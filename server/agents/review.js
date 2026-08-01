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

// Deterministic, ledger/habit-derived fallback used whenever the LLM is unavailable or errors.
// References whichever real ledger row and habit actually apply — never a fixed row id.
function buildFallback(ledger, habits, recentActions) {
  const active = (ledger || []).filter(r => r.status === 'active');
  const contradicting = (habits || []).find(h => h.contradicts_row);

  if (contradicting) {
    const row = active.find(r => r.id === contradicting.contradicts_row);
    if (row) {
      return {
        proposals: [
          {
            op: 'modify',
            kind: row.kind,
            row_id: row.id,
            claim: `${row.claim} — but adjust: ${contradicting.pattern}`,
            evidence: `Observed pattern (${contradicting.id}): ${contradicting.pattern}.`
          }
        ]
      };
    }
  }

  const deliveredCount = (recentActions || []).filter(a => a.intervention === 'deliver').length;
  const withheldCount = (recentActions || []).filter(a => a.intervention === 'withhold' || a.intervention === 'rest').length;

  if (active.length > 0) {
    const weakest = [...active].sort((a, b) => a.strength - b.strength)[0];
    return {
      proposals: [
        {
          op: 'modify',
          kind: weakest.kind,
          row_id: weakest.id,
          claim: weakest.claim,
          evidence: `${deliveredCount} deliveries and ${withheldCount} rest/withhold days in the last week — not enough evidence yet to raise or lower this row's strength further.`
        }
      ]
    };
  }

  return { proposals: [] };
}

async function runReviewAgent(ledger, habits, recentActions) {
  const userPrompt = `
    Current Ledger:
    ${JSON.stringify(ledger, null, 2)}
    
    Recent Habits:
    ${JSON.stringify(habits, null, 2)}
    
    Recent Actions (Last 7 Days):
    ${JSON.stringify(recentActions, null, 2)}
  `;

  const fallback = buildFallback(ledger, habits, recentActions);

  const result = await callLLM(REVIEW_SYSTEM_PROMPT, userPrompt, fallback);
  return stripMarkdown(result);
}

// LLM output is rendered as plain text in the UI, not parsed as markdown —
// strip any emphasis markers it adds so proposals don't show literal asterisks.
function stripMarkdown(result) {
  const clean = (s) => typeof s === 'string' ? s.replace(/\*\*/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2') : s;
  (result.proposals || []).forEach(p => {
    p.claim = clean(p.claim);
    p.evidence = clean(p.evidence);
  });
  return result;
}

module.exports = { runReviewAgent };
