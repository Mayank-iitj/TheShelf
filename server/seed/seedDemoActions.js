// One-off script: hand-curates a varied, demo-worthy 21-day sequence of daily
// agent decisions, grounded in the real ledger rows/artifacts seedHistory.js
// already establishes. Run after seedContent + seedHistory. Not wired into
// npm run seed on purpose — this is a demo-day curation pass, not a general
// fixture; re-run manually if the underlying ledger narrative changes.
const { db } = require('../db');

const actions = [
  { day: 1, intervention: 'rest', rationale: 'Just onboarded. No artifacts or habits yet — better to let the ledger settle before curating anything.', cited: [], considered: [{ intervention: 'deliver', rejected_because: 'Nothing to ground a recommendation in yet.' }] },
  { day: 2, intervention: 'deliver', rationale: 'Delivering content aligned with your strongest stated aspiration: "I want to be a backend engineer at a product company within a year" (L01).', cited: ['L01'], considered: [{ intervention: 'rest', rejected_because: 'A clear top-priority aspiration exists; no reason to withhold.' }] },
  { day: 3, intervention: 'deliver', rationale: 'Building on your HTTP fundamentals (L02) with a step up in depth.', cited: ['L02'], considered: [] },
  { day: 4, intervention: 'revisit', rationale: 'Your SQL competence (L04) hasn’t been touched in a few days — resurfacing before it goes dormant.', cited: ['L04'], considered: [{ intervention: 'deliver', rejected_because: 'New material would bury a competence worth reinforcing.' }] },
  { day: 5, intervention: 'deliver', rationale: 'Deployment is a named constraint on your path to L05 (ship something people use) — delivering a focused resource.', cited: ['L05'], considered: [] },
  { day: 6, intervention: 'challenge', rationale: 'You’ve read enough about containers — time to actually deploy one and prove it, not just consume more content.', cited: ['L05'], considered: [{ intervention: 'deliver', rejected_because: 'More reading without doing would not move L05 forward.' }] },
  { day: 7, intervention: 'revisit', rationale: 'Your dormant aspiration to read systems papers (L03) is fading — one light resurfacing before it’s fully abandoned.', cited: ['L03'], considered: [] },
  { day: 8, intervention: 'mentor_intro', rationale: 'You’re past the basics on deployment (L05, L10) — a peer working on the same problem is more useful than another article.', cited: ['L05', 'L10'], considered: [{ intervention: 'deliver', rejected_because: 'You have the material; you need a sounding board now.' }] },
  { day: 9, intervention: 'deliver', rationale: 'Continuing to build toward L01 with content matched to your current stage.', cited: ['L01'], considered: [] },
  { day: 10, intervention: 'deliver', rationale: 'Reinforcing SQL/databases depth (L04) ahead of harder distributed-systems material.', cited: ['L04'], considered: [] },
  { day: 11, intervention: 'counterpoint', rationale: 'You said you want to learn databases deeply (L08), but the last week of activity was mostly deployment tooling. Naming the gap plainly.', cited: ['L08'], considered: [{ intervention: 'deliver', rejected_because: 'Delivering more content would ignore the pattern instead of naming it.' }] },
  { day: 12, intervention: 'deliver', rationale: 'Delivering distributed-systems groundwork ahead of the Redis work you’re about to start.', cited: ['L03'], considered: [] },
  { day: 13, intervention: 'challenge', rationale: 'Enough groundwork on caching strategies — time to actually build the Redis limiter, not read another explainer.', cited: ['L11'], considered: [{ intervention: 'deliver', rejected_because: 'You already have the concepts; this needs a build, not more input.' }] },
  { day: 14, intervention: 'deliver', rationale: 'Your Weekly Review just ran — following up with content matched to the preference it surfaced: challenges over essays (L09).', cited: ['L09'], considered: [] },
  { day: 15, intervention: 'counterpoint', rationale: 'Your stated goal of clean API design contradicts the complexity that crept into the limiter middleware this week. Naming it, not softening it.', cited: ['L12'], considered: [{ intervention: 'deliver', rejected_because: 'This needs to be confronted, not buried under new material.' }] },
  { day: 16, intervention: 'deliver', rationale: 'Delivering API-design material directly relevant to resolving the L12 tension from yesterday.', cited: ['L12'], considered: [] },
  { day: 17, intervention: 'withhold', rationale: 'Cognitive load and recent output are already high (Redis limiter, API cleanup) — an empty day is the correct call, not more input.', cited: [], considered: [{ intervention: 'deliver', rejected_because: 'Piling on right now would not be absorbed.' }] },
  { day: 18, intervention: 'deliver', rationale: 'Back to steady delivery on L05 (ship something people use) as the finish line approaches.', cited: ['L05'], considered: [] },
  { day: 19, intervention: 'revisit', rationale: 'Resurfacing L11 (Redis) once more before the project ships, to make sure it’s solid under load.', cited: ['L11'], considered: [] },
  { day: 20, intervention: 'challenge', rationale: 'This is the week you said would define success (L05) — the challenge today is to actually ship it to real users.', cited: ['L05'], considered: [{ intervention: 'mentor_intro', rejected_because: 'You need to finish and ship, not gather more input first.' }] },
  { day: 21, intervention: 'mentor_intro', rationale: 'You shipped something people use (L05, verified). Time to talk to someone further along than you — content alone won’t get you the next step.', cited: ['L01', 'L05'], considered: [] },
];

function seedDemoActions() {
  db.prepare('DELETE FROM agent_actions').run();
  const insert = db.prepare(`
    INSERT INTO agent_actions (user_id, day, intervention, rationale, payload_json, state, considered_json)
    VALUES (1, ?, ?, ?, '{}', 'completed', ?)
  `);
  for (const a of actions) {
    insert.run(a.day, a.intervention, a.rationale, JSON.stringify(a.considered || []));
  }
  console.log(`Seeded ${actions.length} curated daily agent decisions across the 21-day demo arc.`);
  const counts = {};
  actions.forEach(a => { counts[a.intervention] = (counts[a.intervention] || 0) + 1; });
  console.log('Intervention distribution:', counts);
}

if (require.main === module) {
  seedDemoActions();
}

module.exports = { seedDemoActions };
