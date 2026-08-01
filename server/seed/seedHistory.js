const { db } = require('../db');

function seedHistory() {
  console.log('Seeding simulated 21-day history...');

  db.transaction(() => {
    // 1. User
    db.prepare(`INSERT INTO users (id, name, created_at) VALUES (1, 'Ari', datetime('now'))`).run();
    db.prepare(`INSERT INTO app_state (key, value) VALUES ('current_day', '21')`).run();

    // 2. Future Self
    db.prepare(`
      INSERT INTO future_self (id, user_id, title, portrait, markers_json, horizon_months, updated_day)
      VALUES (
        1, 1, 'A backend engineer people ask for review',
        'I am building scalable services at a product company. I understand my systems deeply enough to debug them without relying on guesswork. People trust me to review their distributed systems code.',
        '[
          {"marker": "can debug a prod incident alone", "status": "emerging", "reached_day": null},
          {"marker": "write a query planner", "status": "not_yet", "reached_day": null},
          {"marker": "ship a project 100 people use", "status": "emerging", "reached_day": null},
          {"marker": "comfortably read systems papers", "status": "not_yet", "reached_day": null}
        ]',
        12, 1
      )
    `).run();

    // 3. Ledger Rows (State at Day 21)
    const ledgerRows = [
      { id: 'L01', kind: 'aspiration', claim: 'I want to be a backend engineer at a product company within a year', domain_tags: ['career'], confidence: 0.9, provenance: 'Stated explicitly in onboarding interview.', source: 'interview', status: 'active', strength: 0.8, created_day: 1, updated_day: 1 },
      { id: 'L02', kind: 'competence', claim: 'I know basic HTTP and web servers', domain_tags: ['http'], confidence: 0.8, provenance: 'Self-reported in onboarding.', source: 'interview', status: 'active', strength: 0.7, created_day: 1, updated_day: 14 },
      { id: 'L03', kind: 'aspiration', claim: 'I want to read more systems papers', domain_tags: ['distributed-systems', 'systems-thinking'], confidence: 0.7, provenance: 'Stated in interview when asked about deep knowledge.', source: 'interview', status: 'dormant', strength: 0.1, created_day: 1, updated_day: 12 },
      { id: 'L04', kind: 'competence', claim: 'I know how to write basic SQL', domain_tags: ['sql', 'databases'], confidence: 0.8, provenance: 'Stated in interview.', source: 'interview', status: 'active', strength: 0.9, created_day: 1, updated_day: 18 },
      { id: 'L05', kind: 'aspiration', claim: 'I want to ship a project people actually use', domain_tags: ['deployment', 'api-design'], confidence: 0.9, provenance: 'Stated as the definition of a successful year.', source: 'interview', status: 'active', strength: 0.9, created_day: 1, updated_day: 20 },
      { id: 'L06', kind: 'constraint', claim: 'I only have 2 hours a day on weekdays', domain_tags: ['learning-how-to-learn'], confidence: 0.9, provenance: 'Stated in interview.', source: 'interview', status: 'active', strength: 0.8, created_day: 1, updated_day: 1 },
      { id: 'L07', kind: 'aspiration', claim: 'I want to get into competitive programming', domain_tags: ['algorithms'], confidence: 0.5, provenance: 'Stated in interview as a side interest.', source: 'interview', status: 'purged', strength: 0.0, created_day: 1, updated_day: 18 },
      { id: 'L08', kind: 'tension', claim: 'You say you want to learn databases deeply, but you spend time watching Docker tutorials', domain_tags: ['databases', 'deployment'], confidence: 0.8, provenance: 'Inferred from interview contradiction.', source: 'interview', status: 'active', strength: 0.6, created_day: 1, updated_day: 1 },
      { id: 'L09', kind: 'preference', claim: 'I learn by building, not by reading — deliver me challenges before essays', domain_tags: ['learning-how-to-learn'], confidence: 0.9, provenance: 'Accepted from day 14 weekly review based on artifact pattern.', source: 'user_edit', status: 'active', strength: 0.9, created_day: 14, updated_day: 14 }
    ];

    const insertRow = db.prepare(`INSERT INTO ledger_rows (id, user_id, kind, claim, domain_tags, confidence, provenance, source, status, strength, created_day, updated_day) VALUES (@id, 1, @kind, @claim, @domain_tags, @confidence, @provenance, @source, @status, @strength, @created_day, @updated_day)`);
    for (const r of ledgerRows) {
      insertRow.run({ ...r, domain_tags: JSON.stringify(r.domain_tags) });
    }

    // 4. Ledger Events (The Trail)
    const ledgerEvents = [
      // Day 1 creations
      ...ledgerRows.filter(r => r.id !== 'L09').map(r => ({ day: 1, row_id: r.id, event: 'created', before: null, after: r, rationale: 'Created during onboarding interview' })),
      // Day 12 L03 dormant
      { day: 12, row_id: 'L03', event: 'dormant', before: { ...ledgerRows.find(r => r.id === 'L03'), status: 'active', strength: 0.3 }, after: ledgerRows.find(r => r.id === 'L03'), rationale: 'Stated four times, zero completions or artifacts in 12 days.' },
      // Day 14 L09 created
      { day: 14, row_id: 'L09', event: 'created', before: null, after: ledgerRows.find(r => r.id === 'L09'), rationale: 'Accepted by user during Day 14 review' },
      // Day 18 L07 purged
      { day: 18, row_id: 'L07', event: 'purged', before: { ...ledgerRows.find(r => r.id === 'L07'), status: 'active', strength: 0.4 }, after: ledgerRows.find(r => r.id === 'L07'), rationale: 'User clicked "I am not that person anymore"' }
    ];

    const insertEvent = db.prepare(`INSERT INTO ledger_events (user_id, day, row_id, event, before_json, after_json, rationale) VALUES (1, @day, @row_id, @event, @before_json, @after_json, @rationale)`);
    for (const e of ledgerEvents) {
      insertEvent.run({
        day: e.day,
        row_id: e.row_id,
        event: e.event,
        before_json: e.before ? JSON.stringify(e.before) : null,
        after_json: e.after ? JSON.stringify(e.after) : null,
        rationale: e.rationale
      });
    }

    // 5. Habits
    const habits = [
      { id: 'H01', pattern: 'You start at 22:40 on weeknights and stop after 18 minutes', metric: 'time_of_day', value_json: JSON.stringify({ median_start: '22:40', median_minutes: 18 }), evidence_days: 14, confidence: 0.8, contradicts_row: null, first_day: 5, updated_day: 21 },
      { id: 'H02', pattern: 'Nothing over 25 minutes has ever been finished', metric: 'dropoff', value_json: JSON.stringify({ max_completed_minutes: 24 }), evidence_days: 21, confidence: 0.9, contradicts_row: 'L03', first_day: 7, updated_day: 21 },
      { id: 'H03', pattern: 'You finish 70% of experiences and 20% of ideas', metric: 'modality', value_json: JSON.stringify({ experience_rate: 0.7, idea_rate: 0.2 }), evidence_days: 21, confidence: 0.85, contradicts_row: null, first_day: 14, updated_day: 21 },
      { id: 'H04', pattern: 'opened 4, finished 0, over 12 days', metric: 'modality', value_json: JSON.stringify({ papers_opened: 4, papers_finished: 0 }), evidence_days: 12, confidence: 0.9, contradicts_row: 'L03', first_day: 1, updated_day: 12 }
    ];
    
    const insertHabit = db.prepare(`INSERT INTO habits (id, user_id, pattern, metric, value_json, evidence_days, confidence, contradicts_row, first_day, updated_day) VALUES (@id, 1, @pattern, @metric, @value_json, @evidence_days, @confidence, @contradicts_row, @first_day, @updated_day)`);
    for (const h of habits) {
      insertHabit.run(h);
    }

    // 6. Artifacts (3 in days 8-14, 5 in days 15-21)
    const artifacts = [
      { day: 9, body: 'Wrote a basic HTTP server in Node without Express', linked_item_id: 'C014', kind: 'code' },
      { day: 11, body: 'Configured a local Postgres instance and ran some queries', linked_item_id: 'C010', kind: 'practice' },
      { day: 13, body: 'Built a simple rate limiter middleware', linked_item_id: 'C012', kind: 'project' },
      { day: 15, body: 'Deployed the rate limiter to a local Redis instance', linked_item_id: 'C011', kind: 'practice' },
      { day: 17, body: 'Drafted an email to Sarah about observability', linked_item_id: 'C015', kind: 'conversation' },
      { day: 18, body: 'Reviewed the caching logic with David', linked_item_id: 'C016', kind: 'conversation' },
      { day: 19, body: 'Finished the query planner challenge', linked_item_id: 'C013', kind: 'code' },
      { day: 21, body: 'Wrote a summary of the tradeoffs in distributed caching', linked_item_id: 'C005', kind: 'note' }
    ];
    const insertArtifact = db.prepare(`INSERT INTO artifacts (user_id, day, body, linked_item_id, kind) VALUES (1, @day, @body, @linked_item_id, @kind)`);
    for (const a of artifacts) {
      insertArtifact.run(a);
    }

    // 6b. Proofs of Action (Sample demo proofs)
    const proofs = [
      { delivery_id: '1', day: 9, proof_type: 'url', proof_content: 'https://github.com/Mayank-iitj/TheShelf/pull/12', verified: 1, created_at: new Date().toISOString() },
      { delivery_id: '3', day: 13, proof_type: 'text', proof_content: 'Built a sliding window rate limiter in Express with unit tests covering 100 req/min edge cases.', verified: 1, created_at: new Date().toISOString() },
      { delivery_id: '5', day: 19, proof_type: 'url', proof_content: 'https://github.com/Mayank-iitj/TheShelf/pull/44', verified: 1, created_at: new Date().toISOString() }
    ];
    const insertProof = db.prepare(`INSERT INTO proofs (user_id, delivery_id, day, proof_type, proof_content, verified, created_at) VALUES (1, @delivery_id, @day, @proof_type, @proof_content, @verified, @created_at)`);
    for (const p of proofs) {
      try { insertProof.run(p); } catch(e){}
    }

    // 7. Deliveries (21 days, both rankers)
    const insertDelivery = db.prepare(`INSERT INTO deliveries (user_id, day, item_id, ranker, slot, why_now, cited_rows, score, score_breakdown, opened, completed, dwell_minutes) VALUES (1, @day, @item_id, @ranker, @slot, @why_now, @cited_rows, @score, @score_breakdown, @opened, @completed, @dwell_minutes)`);
    
    // Day 7 regrets
    const insertRegret = db.prepare(`INSERT INTO regret_responses (user_id, delivery_id, asked_day, value) VALUES (1, @delivery_id, @asked_day, @value)`);

    // Helper to generate deliveries
    let deliveryIdCounter = 1;
    function generateDay(day) {
      // Growth deliveries (3 items)
      // We will make L03 papers open but not complete in days 1-7
      // We will make difficulty ~2 in days 1-7, ~3 in days 8-14, ~4 in days 15-21
      
      const difficultyTarget = day <= 7 ? 2 : (day <= 14 ? 3 : 4);
      
      for (let slot = 0; slot < 3; slot++) {
        let itemId = 'C00' + (Math.floor(Math.random() * 9) + 1);
        if (day <= 7 && slot === 0) itemId = 'C007'; // A paper (difficulty 5, idea)
        
        let opened = Math.random() > 0.5 ? 1 : 0;
        let completed = opened && Math.random() > 0.5 ? 1 : 0;
        
        // Ari opens papers but never completes them
        if (itemId === 'C007') {
          opened = 1;
          completed = 0;
        }

        const isArtifactDay = artifacts.some(a => a.day === day);
        if (isArtifactDay) {
          completed = 1;
        }

        insertDelivery.run({
          day, item_id: itemId, ranker: 'growth', slot,
          why_now: 'Because you wanted to read systems papers.',
          cited_rows: JSON.stringify(['L03']),
          score: 0.8,
          score_breakdown: '{}',
          opened, completed,
          dwell_minutes: opened ? (completed ? 25 : 10) : 0
        });

        if (day === 1 && slot === 0) { // Paper item regret
          insertRegret.run({ delivery_id: deliveryIdCounter, asked_day: 7, value: -1 });
        } else if (day === 1 && slot === 1) { // Debugging essay regret
          insertRegret.run({ delivery_id: deliveryIdCounter, asked_day: 7, value: 2 });
        }
        
        deliveryIdCounter++;
      }

      // Attention Twin deliveries (3 items)
      for (let slot = 0; slot < 3; slot++) {
        let itemId = 'C00' + (Math.floor(Math.random() * 9) + 1);
        insertDelivery.run({
          day, item_id: itemId, ranker: 'attention', slot,
          why_now: '', cited_rows: '[]', score: 0.9, score_breakdown: '{}',
          opened: 1, completed: 1, dwell_minutes: 5
        });
        deliveryIdCounter++;
      }
    }

    for (let d = 1; d <= 21; d++) {
      generateDay(d);
    }

    // 8. Weekly Review (Day 14)
    db.prepare(`
      INSERT INTO reviews (user_id, day, proposed_json, accepted_json)
      VALUES (
        1, 14,
        '[{"op":"ADD","claim":"I learn by building, not by reading — deliver me challenges before essays","evidence":"3 artifacts logged on challenges, 0 on papers","kind":"preference","domain_tags":["learning-how-to-learn"]}]',
        '["L09"]'
      )
    `).run();

  })();

  console.log('Seeded history successfully.');
}

if (require.main === module) {
  seedHistory();
}

module.exports = { seedHistory };
