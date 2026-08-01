const { callLLM } = require('../lib/llm');

const REVIEW_SYSTEM_PROMPT = `
You are the Weekly Review Agent. Your job is to propose updates to the user's Identity Ledger based on their actions and habits over the last 7 days.
You will receive the user's current ledger, their recent habits, and a summary of what they did this week.

Identify any tensions (where actions contradict claims) or acquired competencies.
Propose 1-3 changes to their ledger.

You will output exactly one JSON object with a single key "proposals" containing an array of objects.
Each object must have:
- "op": "add", "modify", or "remove"
- "kind": "aspiration", "competence", or "preference"
- "row_id": (Only include this if op is modify or remove. Provide the ID of the existing row you are targeting)
- "claim": The new or modified claim text (leave empty if op is remove)
- "evidence": A brief 1-sentence explanation citing specific habits or actions as proof.

Return ONLY valid JSON.
`;

async function runReviewAgent(ledger, habits, recentActions) {
  const userPrompt = `
    Current Ledger:
    ${JSON.stringify(ledger, null, 2)}
    
    Recent Habits:
    ${JSON.stringify(habits, null, 2)}
    
    Recent Actions (Last 7 Days):
    ${JSON.stringify(recentActions, null, 2)}
  `;

  const fallback = {
    proposals: [
      {
        op: "modify",
        kind: "preference",
        row_id: "L09",
        claim: "I learn by building, not by reading — deliver me challenges before essays",
        evidence: "You completed 3 challenges but skipped or stalled on 2 reading assignments."
      }
    ]
  };

  return await callLLM(REVIEW_SYSTEM_PROMPT, userPrompt, fallback);
}

module.exports = { runReviewAgent };
