const { db } = require('../db');
const { getPotentialIndex } = require('../engine/potential');
const { getStage } = require('../engine/stage');
const { detectHabits } = require('../engine/habits');
const { callLLM } = require('../lib/llm');

const DAILY_SYSTEM_PROMPT = `
You are a growth curator deciding what to do for one person today. You are not a feed.
You may decide to do nothing.

You receive: their future-self portrait and markers, their identity ledger, their observed habits,
their journey stage, the last 7 days of deliveries and artifacts, and their delayed regret scores.

Choose exactly ONE intervention from: deliver, challenge, mentor_intro, counterpoint, revisit, rest, withhold.

Rules:
- Prefer withhold or rest over filling the day. An empty day is a valid, sometimes correct output.
- Cite the habit or ledger row that drove the choice, by id.
- If their habits contradict a stated aspiration, name it plainly. Do not soften it.
- Never justify a choice with engagement, interest, or what similar users liked.

Return ONLY JSON:
{"intervention":"...","rationale":"...","cited_ids":["..."],"considered":[{"intervention":"...","rejected_because":"..."}],"payload":{}}
`;

// Deterministic, ledger/habit-derived fallback used whenever the LLM is unavailable or errors.
// Reacts to the actual user's data instead of returning a single fixed intervention.
function buildFallback(userId, day, stage, habits) {
  const ledger = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status = 'active'`).all(userId);
  const artifactsLast3 = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = ? AND day >= ? AND day < ?`).get(userId, day - 3, day).c;
  const contradicting = habits.find(h => h.contradicts_row);

  const considered = [];

  // No artifacts in the last 3 days -> nothing to build on, better to rest than pile on.
  if (artifactsLast3 === 0 && day > 3) {
    considered.push({ intervention: 'deliver', rejected_because: 'No artifacts logged in the last 3 days — adding more would just pile up unfinished items.' });
    return {
      intervention: 'rest',
      rationale: 'Nothing today. No artifacts in the last 3 days — resting beats starting something new you will not finish.',
      cited_ids: [],
      considered,
      payload: {}
    };
  }

  // A behavioural habit directly contradicts a stated ledger row -> surface it plainly.
  if (contradicting) {
    const row = ledger.find(r => r.id === contradicting.contradicts_row);
    considered.push({ intervention: 'deliver', rejected_because: 'Delivering more content ignores the pattern already contradicting a stated goal.' });
    return {
      intervention: 'counterpoint',
      rationale: row
        ? `You said "${row.claim}" (${row.id}), but the pattern is: ${contradicting.pattern}.`
        : `Observed pattern contradicts a ledger row: ${contradicting.pattern}.`,
      cited_ids: [contradicting.id, contradicting.contradicts_row].filter(Boolean),
      considered,
      payload: {}
    };
  }

  // Early days with an empty ledger -> nothing to curate against yet.
  if (ledger.length === 0) {
    return {
      intervention: 'withhold',
      rationale: 'No active ledger rows to curate against yet.',
      cited_ids: [],
      considered: [],
      payload: {}
    };
  }

  // Default: deliver, citing the strongest active aspiration/competence row.
  const topRow = [...ledger].sort((a, b) => b.strength - a.strength)[0];
  return {
    intervention: 'deliver',
    rationale: topRow
      ? `Delivering content aligned with your strongest active row: "${topRow.claim}" (${topRow.id}).`
      : 'Delivering a mix of new ideas and an experience to build competence.',
    cited_ids: topRow ? [topRow.id] : [],
    considered: [],
    payload: {}
  };
}

async function runDailyAgent(userId, day) {
  console.log(`Running daily agent for user ${userId} on day ${day}...`);

  const potential = getPotentialIndex(userId, day);
  const stage = getStage(userId, day);
  const habits = detectHabits(userId, day);

  const userPrompt = `
    Stage: ${stage.stage} (${stage.explanation})
    Potential Index: ${potential}
    Habits: ${JSON.stringify(habits)}
    Day: ${day}
  `;

  const fallback = buildFallback(userId, day, stage, habits);

  const response = await callLLM(DAILY_SYSTEM_PROMPT, userPrompt, fallback);

  const insertAction = db.prepare(`
    INSERT INTO agent_actions (user_id, day, intervention, rationale, payload_json, state, considered_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertAction.run(
    userId, day, response.intervention, response.rationale, 
    JSON.stringify(response.payload || {}), 'completed', 
    JSON.stringify(response.considered || [])
  );

  return response;
}

module.exports = { runDailyAgent };
