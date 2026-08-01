const { db } = require('../db');
const { getPotentialIndex } = require('../engine/potential');
const { getStage } = require('../engine/stage');
const { detectHabits } = require('../engine/habits');
const { callLLM } = require('../lib/llm');

const MASTER_SYSTEM_PROMPT = `
You are the Supreme Master Orchestrator Agent of The Shelf platform.
You oversee three specialized sub-agents:
1. Onboarding Agent (Identity Claims & Future Self Portrait)
2. Daily Curator Agent (Daily Interventions & Curation Decisions)
3. Weekly Review Agent (Habit Contradiction Detection & Ledger Proposal Matrix)

Your role is to synthesize all sub-agent outputs, evaluate overall trajectory velocity, calculate a Master Alignment Score (0-100), and issue a unified Master Strategic Directive for executive presentation.

Return ONLY a JSON object:
{
  "master_verdict": "A concise executive verdict on the user's progress",
  "alignment_score": 88,
  "velocity_status": "Accelerating" | "Optimal Momentum" | "Attention Drift" | "Rest Mode",
  "sub_agent_reports": {
    "onboarding_agent": { "status": "Active", "summary": "..." },
    "daily_agent": { "status": "Active", "summary": "..." },
    "review_agent": { "status": "Synced", "summary": "..." }
  },
  "master_synthesis": "Comprehensive synthesis paragraph combining vision, habits, and verified proofs.",
  "strategic_directive": "Single actionable priority directive for the user."
}
`;

function buildMasterFallback(userId, day, potential, stage, habits) {
  const ledger = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status = 'active'`).all(userId);
  const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = ?`).get(userId);
  const lastAction = db.prepare(`SELECT * FROM agent_actions WHERE user_id = ? AND day = ?`).get(userId, day);
  const proofCount = db.prepare(`SELECT COUNT(*) as c FROM proofs WHERE user_id = ?`).get(userId)?.c || 0;
  const artifactCount = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = ?`).get(userId)?.c || 0;

  const score = Math.min(98, Math.max(60, Math.round(potential / 10) + proofCount * 4 + artifactCount * 2));

  return {
    master_verdict: `Executing on Day ${day} with ${score}% alignment to Future Self targets.`,
    alignment_score: score,
    velocity_status: score >= 85 ? 'Accelerating' : score >= 70 ? 'Optimal Momentum' : 'Attention Drift',
    sub_agent_reports: {
      onboarding_agent: {
        status: 'Active & Verified',
        summary: `Mapped ${ledger.length} identity claims to portrait: "${futureSelf?.title || 'Engineer'}"`
      },
      daily_agent: {
        status: lastAction ? 'Intervening' : 'Standby',
        summary: lastAction ? `Intervention: '${lastAction.intervention}'. Rationale: ${lastAction.rationale}` : 'Daily curation engine ready.'
      },
      review_agent: {
        status: 'Synced',
        summary: habits.length > 0 ? `Tracking ${habits.length} behavioral patterns. Main metric: ${habits[0].metric}.` : 'Review cycle active.'
      }
    },
    master_synthesis: `The Master Agent has unified outputs across Onboarding, Daily Curator, and Weekly Review. You have active ledger claims (${ledger.length}) supported by ${proofCount} verified Proof-of-Action artifacts. Potential Index stands at ${potential}.`,
    strategic_directive: `Focus on converting active ledger claim "${ledger[0]?.claim || 'core goal'}" into verified proof.`
  };
}

async function runMasterAgent(userId = 1, day = 21) {
  console.log(`Running Master Orchestrator Agent for user ${userId} on day ${day}...`);

  const potential = getPotentialIndex(userId, day);
  const stage = getStage(userId, day);
  const habits = detectHabits(userId, day);
  const ledger = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status = 'active'`).all(userId);
  const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = ?`).get(userId);
  const lastAction = db.prepare(`SELECT * FROM agent_actions WHERE user_id = ? ORDER BY day DESC LIMIT 1`).get(userId);
  const proofs = db.prepare(`SELECT * FROM proofs WHERE user_id = ?`).all(userId);
  const artifacts = db.prepare(`SELECT * FROM artifacts WHERE user_id = ?`).all(userId);

  const userPrompt = `
    User ID: ${userId}, Day: ${day}
    Stage: ${stage.stage} (${stage.explanation})
    Potential Index: ${potential}
    Future Self: ${futureSelf?.portrait || 'None'}
    Active Ledger Claims (${ledger.length}): ${JSON.stringify(ledger.map(r => r.claim))}
    Observed Habits (${habits.length}): ${JSON.stringify(habits.map(h => h.pattern))}
    Last Daily Action: ${JSON.stringify(lastAction || {})}
    Verified Proofs Count: ${proofs.length}
    Artifacts Logged: ${artifacts.length}
  `;

  const fallback = buildMasterFallback(userId, day, potential, stage, habits);
  const response = await callLLM(MASTER_SYSTEM_PROMPT, userPrompt, fallback);

  // Guarantee schema stability by merging with fallback
  return {
    ...fallback,
    ...response,
    sub_agent_reports: {
      ...fallback.sub_agent_reports,
      ...(response?.sub_agent_reports || {})
    }
  };
}

module.exports = { runMasterAgent };
