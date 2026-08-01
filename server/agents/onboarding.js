const { callLLM } = require('../lib/llm');

const ONBOARDING_SYSTEM_PROMPT = `
You are an identity architect. A user has answered an onboarding interview designed to extract their core aspirations, competencies, and preferences.
Your task is to translate their answers into structured claims for their "Identity Ledger" and to synthesize a visceral "Future Self" portrait.

You will output exactly one JSON object with two top-level keys: "future_self" and "ledger_rows".

1. "future_self" should contain a single key "portrait": a 1-2 sentence visceral, evocative description of the person they are trying to become.

2. "ledger_rows" should be an array of objects. Each object must have:
- "kind": either "aspiration", "competence", or "preference"
- "claim": a bold, first-person statement (e.g. "I want to be a backend engineer at a product company within a year")
- "domain_tags": an array of 1-3 lowercase string tags (e.g. ["career", "engineering"])
- "strength": a float between 0.1 and 1.0 representing how strongly they seem to hold this

Generate 3-5 high-quality ledger rows based ONLY on what the user actually said.

Return ONLY valid JSON.
`;

async function runOnboardingAgent(answers) {
  const userPrompt = `
    User's Interview Answers:
    ${answers.map((ans, idx) => `Q${idx + 1}: ${ans}`).join('\n')}
  `;

  const fallback = {
    future_self: {
      portrait: "A backend engineer people ask for review. I understand my systems deeply enough to debug them without relying on guesswork."
    },
    ledger_rows: [
      {
        kind: "aspiration",
        claim: "I want to be a backend engineer at a product company within a year",
        domain_tags: ["career"],
        strength: 0.8
      },
      {
        kind: "competence",
        claim: "I know basic HTTP and web servers",
        domain_tags: ["http"],
        strength: 0.7
      },
      {
        kind: "preference",
        claim: "I learn by building, not by reading",
        domain_tags: ["learning"],
        strength: 0.9
      }
    ]
  };

  return await callLLM(ONBOARDING_SYSTEM_PROMPT, userPrompt, fallback);
}

module.exports = { runOnboardingAgent };
