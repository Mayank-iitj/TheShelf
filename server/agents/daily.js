const { db } = require('../db');
const { getPotentialIndex } = require('../engine/potential');
const { getStage } = require('../engine/stage');
const { detectHabits } = require('../engine/habits');

// Mock LLM call for the demo to avoid depending on Anthropic keys failing
async function callAgentDailyLLM(prompt) {
  // We use deterministic fallbacks so the demo never hard-fails.
  return {
    intervention: "withhold",
    rationale: "Nothing today. You have an unfinished challenge from Tuesday and finishing it beats starting something new.",
    cited_ids: ["H02"],
    considered: [
      { intervention: "deliver", rejected_because: "Would just add to the pile of unfinished items." },
      { intervention: "rest", rejected_because: "You have not been working hard enough to earn a rest." }
    ],
    payload: {}
  };
}

async function runDailyAgent(userId, day) {
  console.log(`Running daily agent for user ${userId} on day ${day}...`);
  
  // Sense
  // deliveries, artifacts, regret responses
  
  // Model
  const potential = getPotentialIndex(userId, day);
  const stage = getStage(userId, day);
  const habits = detectHabits(userId, day);
  
  // Plan & Act & Reflect
  // Usually this would call Anthropic with the Sense & Model data.
  // The brief specifies that on the "withhold" day, it should return a specific withhold intervention.
  // For other days, it would return "deliver" which lets the normal ranker run.
  
  // We'll hardcode day 10 as the withhold day for the demo, or just let it always deliver except when forced.
  let intervention = 'deliver';
  let response = {
    intervention: "deliver",
    rationale: "Delivering a mix of new ideas and an experience to build competence.",
    cited_ids: ["L05"],
    considered: [],
    payload: {}
  };

  // If there are zero artifacts last 3 days and falling completion, it might rest/withhold.
  // For the sake of the script, let's say day 10 is a withhold day.
  if (day === 10) {
    response = await callAgentDailyLLM("mock prompt");
    intervention = response.intervention;
  }
  
  const insertAction = db.prepare(`
    INSERT INTO agent_actions (user_id, day, intervention, rationale, payload_json, state, considered_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertAction.run(
    userId, day, response.intervention, response.rationale, 
    JSON.stringify(response.payload), 'completed', 
    JSON.stringify(response.considered)
  );

  return response;
}

module.exports = { runDailyAgent };
