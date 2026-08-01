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

async function runDailyAgent(userId, day) {
  console.log(\`Running daily agent for user \${userId} on day \${day}...\`);
  
  const potential = getPotentialIndex(userId, day);
  const stage = getStage(userId, day);
  const habits = detectHabits(userId, day);
  
  const userPrompt = \`
    Stage: \${stage.stage} (\${stage.explanation})
    Potential Index: \${potential}
    Habits: \${JSON.stringify(habits)}
    Day: \${day}
  \`;

  const fallback = {
    intervention: "deliver",
    rationale: "Delivering a mix of new ideas and an experience to build competence.",
    cited_ids: ["L05"],
    considered: [],
    payload: {}
  };
  
  if (day === 10) {
    fallback.intervention = "withhold";
    fallback.rationale = "Nothing today. You have an unfinished challenge from Tuesday and finishing it beats starting something new.";
    fallback.cited_ids = ["H02"];
    fallback.considered = [
      { intervention: "deliver", rejected_because: "Would just add to the pile of unfinished items." },
      { intervention: "rest", rejected_because: "You have not been working hard enough to earn a rest." }
    ];
  }

  let response = await callLLM(DAILY_SYSTEM_PROMPT, userPrompt, fallback);

  
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
