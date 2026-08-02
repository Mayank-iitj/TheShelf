const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { db } = require('./db');

const { getWeights, setWeights } = require('./engine/rank');
const { rankAttention } = require('./engine/attentionTwin');
const { getPotentialIndex } = require('./engine/potential');
const { getStage } = require('./engine/stage');
const { detectHabits } = require('./engine/habits');
const { runDailyAgent } = require('./agents/daily');
const { runCuratorAgent } = require('./agents/curator');
const { runOnboardingAgent } = require('./agents/onboarding');
const { runMasterplanAgent } = require('./agents/masterplan');
const { saveOnboardingAnswers } = require('./lib/profile');
const { saveMasterplan, getMasterplan, setStageDone } = require('./lib/masterplan');
const { runReviewAgent } = require('./agents/review');
const { runMasterAgent } = require('./agents/master');
const { runFutureSelfChat } = require('./agents/futureSelfChat');
const { seedContent } = require('./seed/seedContent');
const { seedHistory, simulateHistoryForUser } = require('./seed/seedHistory');

const app = express();

// CORS: allow the Vercel frontend and localhost dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN, // e.g. https://The Shelf.vercel.app
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());


// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Health check for Render / load balancers
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Surface

function getDay() {
  const row = db.prepare(`SELECT value FROM app_state WHERE key = 'current_day'`).get();
  return row ? parseInt(row.value, 10) : 1;
}

app.get('/api/clock', (req, res) => {
  res.json({ current_day: getDay() });
});

app.post('/api/clock', (req, res) => {
  const { day } = req.body;
  db.prepare(`UPDATE app_state SET value = ? WHERE key = 'current_day'`).run(day.toString());
  res.json({ success: true });
});

app.get('/api/ledger', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  
  // Replay logic for the demo: 
  // We simply fetch rows as they are currently because the seed script puts them in the day 21 state.
  // To truly do event sourcing time travel, we'd rebuild from ledger_events.
  // For the sake of the quick demo, if day < 21, we approximate by filtering events.
  const rows = db.prepare(`SELECT * FROM ledger_rows WHERE created_day <= ?`).all(day);
  
  // Apply events
  for (const row of rows) {
    const latestEvent = db.prepare(`SELECT * FROM ledger_events WHERE row_id = ? AND day <= ? ORDER BY day DESC LIMIT 1`).get(row.id, day);
    if (latestEvent) {
      const state = JSON.parse(latestEvent.after_json);
      Object.assign(row, state);
    }
  }
  
  const activeRows = rows.filter(r => r.status !== 'purged');
  res.json(activeRows);
});

app.patch('/api/ledger/:rowId', (req, res) => {
  const { claim } = req.body;
  const { rowId } = req.params;
  const day = getDay();
  db.prepare(`UPDATE ledger_rows SET claim = ?, updated_day = ? WHERE id = ?`).run(claim, day, rowId);
  res.json({ success: true });
});

app.post('/api/ledger/:rowId/purge', (req, res) => {
  const { rowId } = req.params;
  const day = getDay();
  
  const row = db.prepare(`SELECT * FROM ledger_rows WHERE id = ?`).get(rowId);
  db.prepare(`UPDATE ledger_rows SET status = 'purged', updated_day = ? WHERE id = ?`).run(day, rowId);
  
  const after = { ...row, status: 'purged' };
  db.prepare(`INSERT INTO ledger_events (user_id, day, row_id, event, before_json, after_json, rationale) VALUES (1, ?, ?, 'purged', ?, ?, 'User purged via UI')`)
    .run(day, rowId, JSON.stringify(row), JSON.stringify(after));
    
  res.json({ success: true });
});

app.get('/api/shelf', async (req, res, next) => {
  try {
    const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
    const ranker = req.query.ranker || 'growth';

    // Run the daily agent once per day and persist its decision, so revisiting
    // the same day is stable but each day/user gets a decision grounded in
    // their own real ledger + habits rather than a fixed canned response.
    let action = db.prepare(`SELECT * FROM agent_actions WHERE user_id = 1 AND day = ?`).get(day);
    if (!action) {
      await runDailyAgent(1, day);
      action = db.prepare(`SELECT * FROM agent_actions WHERE user_id = 1 AND day = ?`).get(day);
    }

    // Pre-computed deliveries for this day/ranker, if already persisted.
    const selectDeliveries = () => db.prepare(`
      SELECT c.*, d.id AS delivery_id, d.why_now, d.cited_rows, d.score, d.score_breakdown, d.opened, d.completed
      FROM deliveries d
      JOIN content_items c ON d.item_id = c.id
      WHERE d.day = ? AND d.ranker = ? AND d.user_id = 1
      ORDER BY d.slot
    `).all(day, ranker);

    let items = selectDeliveries();

    // No shelf for this day yet: curate one now from the user's own onboarding
    // answers, ledger and habits via Groq (falls back to pool ranking offline).
    let source = items.length > 0 ? 'cached' : null;
    let shelfNote = null;

    if (items.length === 0 && ranker === 'growth') {
      const curated = await runCuratorAgent(1, day, action?.intervention || 'deliver');
      items = curated.items;
      source = curated.source;
      shelfNote = curated.shelf_note;
    } else if (items.length === 0 && ranker === 'attention') {
      // The twin's counterfactual: what a pure engagement feed would have served.
      // Deliberately NOT personalized to the ledger — that is the comparison.
      const insertDelivery = db.prepare(`
        INSERT INTO deliveries (user_id, day, item_id, ranker, slot, why_now, cited_rows, score, score_breakdown, opened, completed, dwell_minutes)
        VALUES (1, ?, ?, 'attention', ?, '', '[]', ?, ?, 0, 0, 0)
      `);
      rankAttention(1, day).forEach((item, slot) => {
        insertDelivery.run(day, item.id, slot, item.score, JSON.stringify(item.breakdown));
      });
      items = selectDeliveries();
      source = 'attention-ranker';
    }

    // What the shelf was built from — shown in the dashboard so the
    // personalization is visible rather than implied.
    const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = 1`).get();
    const citedIds = [...new Set(items.flatMap(i => {
      try { return JSON.parse(i.cited_rows || '[]'); } catch (e) { return []; }
    }))];
    const citedClaims = citedIds.length > 0
      ? db.prepare(`SELECT id, kind, claim FROM ledger_rows WHERE user_id = 1 AND id IN (${citedIds.map(() => '?').join(',')})`).all(...citedIds)
      : [];

    res.json({
      action: action ? { intervention: action.intervention, rationale: action.rationale, considered: JSON.parse(action.considered_json || '[]') } : null,
      items,
      personalization: {
        source,
        shelf_note: shelfNote,
        portrait: futureSelf?.portrait || null,
        cited_claims: citedClaims
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/twin', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  // Return divergence chart data up to day
  const series = [];
  let attPot = getPotentialIndex(1, 1); // starts same as potential
  
  for (let d = 1; d <= day; d++) {
     const pot = getPotentialIndex(1, d);
     if (d > 1) {
       // Deterministic compounding decay: slightly drags behind potential, loses ~3 pts/day
       attPot = attPot * 0.98 + (pot - attPot) * 0.1 - (Math.sin(d) * 2 + 3); 
     } else {
       attPot = pot;
     }
     
     series.push({
       day: d,
       potential: pot,
       attention_potential: Math.max(0, Math.round(attPot)),
       artifacts: db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE day <= ?`).get(d).c
     });
  }
  
  const artifacts = series.length > 0 ? series[series.length - 1].artifacts : 0;
  const minutes_reclaimed = Math.round(artifacts * 45 + day * 15);

  res.json({ series, minutes_reclaimed });
});

app.get('/api/weights', (req, res) => {
  res.json(getWeights());
});

app.post('/api/weights', (req, res) => {
  setWeights(req.body);
  res.json({ success: true });
});

app.get('/api/habits', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  res.json(detectHabits(1, day));
});

app.get('/api/stage', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  res.json(getStage(1, day));
});

app.get('/api/future-self', (req, res) => {
  const fs = db.prepare(`SELECT * FROM future_self WHERE user_id = 1`).get();
  if (fs) {
    fs.markers = JSON.parse(fs.markers_json);
  }
  res.json(fs);
});

app.post('/api/future-self/chat', async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const fs = db.prepare(`SELECT * FROM future_self WHERE user_id = 1`).get();
    const portrait = fs ? fs.portrait : null;
    const markers = fs ? JSON.parse(fs.markers_json) : [];
    const ledgerRows = db.prepare(`SELECT id, kind, claim, strength FROM ledger_rows WHERE user_id = 1 AND status IN ('active', 'dormant')`).all();

    const result = await runFutureSelfChat({ message, history, portrait, markers, ledgerRows });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/potential', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  res.json({ index: getPotentialIndex(1, day) });
});

app.post('/api/reset', (req, res) => {
  seedContent();
  seedHistory();
  res.json({ success: true });
});

app.post('/api/onboarding/reset', (req, res) => {
  db.prepare(`DELETE FROM ledger_rows`).run();
  db.prepare(`DELETE FROM ledger_events`).run();
  db.prepare(`DELETE FROM future_self`).run();
  db.prepare(`DELETE FROM habits`).run();
  db.prepare(`DELETE FROM deliveries`).run();
  db.prepare(`DELETE FROM artifacts`).run();
  db.prepare(`DELETE FROM agent_actions`).run();
  db.prepare(`DELETE FROM reviews`).run();
  db.prepare(`DELETE FROM regret_responses`).run();
  db.prepare(`DELETE FROM proofs`).run();
  db.prepare(`DELETE FROM content_items WHERE source = 'Curated for you'`).run();
  db.prepare(`DELETE FROM app_state WHERE key LIKE 'onboarding_answers_%'`).run();
  db.prepare(`UPDATE app_state SET value = '1' WHERE key = 'current_day'`).run();
  db.prepare(`DELETE FROM masterplan_stages`).run();
  db.prepare(`DELETE FROM masterplans`).run();
  res.json({ success: true });
});

app.post('/api/onboarding', async (req, res, next) => {
  try {
    const { answers } = req.body;

    // Keep the raw answers: the curator and daily agents ground on the user's
    // own words, which the derived ledger rows only summarize.
    saveOnboardingAnswers(1, answers);

    // Runs alongside the Groq-backed identity agent: both read the same
    // answers, but the masterplan is Gemini-backed so it can ground its
    // resources in a live Google Search instead of training-data recall.
    const [result, masterplanResult] = await Promise.all([
      runOnboardingAgent(answers),
      runMasterplanAgent(answers)
    ]);

    // Dynamic 21-day timeline simulation using the new onboarding answers
    simulateHistoryForUser(1, result);

    const day = getDay();
    saveMasterplan(1, day, masterplanResult.goal, process.env.GEMINI_API_KEY ? 'gemini' : 'fallback', masterplanResult.stages);

    res.json({ success: true, result, masterplan: masterplanResult });
  } catch (err) {
    next(err);
  }
});

app.get('/api/masterplan', (req, res) => {
  res.json(getMasterplan(1) || { goal: null, stages: [] });
});

app.patch('/api/masterplan/stages/:stageId', (req, res) => {
  const { stageId } = req.params;
  const { done } = req.body;
  setStageDone(1, stageId, !!done, getDay());
  res.json({ success: true });
});

app.get('/api/review', async (req, res, next) => {
  try {
    const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
    let review = db.prepare(`SELECT * FROM reviews WHERE day = ?`).get(day);
    
    if (!review && (day === 7 || day === 14 || day === 21)) {
      // Need to generate a review
      const ledger = db.prepare(`SELECT * FROM ledger_rows WHERE status != 'purged'`).all();
      const habits = detectHabits(1, day);
      const recentActions = db.prepare(`SELECT * FROM agent_actions WHERE day > ? AND day <= ?`).all(day - 7, day);
      
      const generated = await runReviewAgent(ledger, habits, recentActions);
      
      db.prepare(`INSERT INTO reviews (user_id, day, proposed_json) VALUES (1, ?, ?)`).run(day, JSON.stringify(generated.proposals));
      review = db.prepare(`SELECT * FROM reviews WHERE day = ?`).get(day);
    }
    
    res.json(review || {});
  } catch (err) {
    next(err);
  }
});

app.post('/api/review/accept', (req, res) => {
  const { rowIds } = req.body; // now these are indices of the proposals
  const day = getDay();
  
  const review = db.prepare(`SELECT * FROM reviews WHERE day = ?`).get(day);
  if (!review) return res.status(404).json({ error: "No review found" });
  
  const proposals = JSON.parse(review.proposed_json || "[]");
  
  for (const idx of rowIds) {
    const p = proposals[idx];
    if (!p) continue;
    
    if (p.op === 'add') {
      const id = 'L' + Math.floor(Math.random()*1000).toString().padStart(3, '0');
      db.prepare(`INSERT INTO ledger_rows (id, user_id, kind, claim, domain_tags, confidence, provenance, source, status, strength, created_day, updated_day) VALUES (?, 1, ?, ?, '[]', 0.8, ?, 'review', 'active', 0.8, ?, ?)`).run(id, p.kind || 'aspiration', p.claim, p.evidence || 'Weekly Review', day, day);
    } else if (p.op === 'modify' && p.row_id) {
      db.prepare(`UPDATE ledger_rows SET claim = ?, updated_day = ? WHERE id = ?`).run(p.claim, day, p.row_id);
    } else if (p.op === 'remove' && p.row_id) {
      db.prepare(`UPDATE ledger_rows SET status = 'purged', updated_day = ? WHERE id = ?`).run(day, p.row_id);
    }
    
    p.accepted = true;
  }
  
  const remaining = proposals.filter(p => !p.accepted);
  db.prepare(`UPDATE reviews SET proposed_json = ? WHERE day = ?`).run(JSON.stringify(remaining), day);
  
  res.json({ success: true });
});

// Create the proofs table if it doesn't exist (safe migration)
try {
  db.exec(`CREATE TABLE IF NOT EXISTS proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    delivery_id TEXT,
    day INTEGER,
    proof_type TEXT,
    proof_content TEXT,
    verified INTEGER DEFAULT 1,
    created_at TEXT
  )`);
} catch(e) { /* already exists */ }

// POST /api/proof — Submit proof of action for a shelf item
app.post('/api/proof', (req, res) => {
  const { delivery_id, proof_type, proof_content } = req.body;
  const day = getDay();
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO proofs (user_id, delivery_id, day, proof_type, proof_content, verified, created_at)
    VALUES (1, ?, ?, ?, ?, 1, ?)`).run(delivery_id || 'manual', day, proof_type || 'text', proof_content, now);

  // Mark delivery as completed if delivery_id provided
  let linkedItemId = null;
  if (delivery_id && !isNaN(parseInt(delivery_id, 10))) {
    db.prepare(`UPDATE deliveries SET completed = 1 WHERE id = ?`).run(delivery_id);
    // Competence is computed by joining artifacts to content_items, so the
    // artifact has to point at the item — storing the delivery id here meant
    // proofs never counted toward competence.
    linkedItemId = db.prepare(`SELECT item_id FROM deliveries WHERE id = ?`).get(delivery_id)?.item_id || null;
  } else if (delivery_id) {
    linkedItemId = db.prepare(`SELECT id FROM content_items WHERE id = ?`).get(delivery_id)?.id || null;
  }

  // Create an artifact record
  db.prepare(`INSERT INTO artifacts (user_id, day, body, linked_item_id, kind) VALUES (1, ?, ?, ?, 'proof')`).run(day, proof_content, linkedItemId);

  res.json({ success: true, message: 'Proof submitted. Your Identity Ledger has been updated.' });
});

// GET /api/master — Master Orchestrator Agent Synthesis
app.get('/api/master', async (req, res, next) => {
  try {
    const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
    const result = await runMasterAgent(1, day);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/passport — Export the Identity Passport JSON
app.get('/api/passport', (req, res) => {
  const day = getDay();
  const ledger = db.prepare(`SELECT * FROM ledger_rows WHERE status != 'purged' AND user_id = 1`).all();
  const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = 1`).get();
  const proofCount = db.prepare(`SELECT COUNT(*) as c FROM proofs WHERE user_id = 1`).get();
  const artifactCount = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = 1`).get();
  const stage = getStage(1, day);
  const potential = getPotentialIndex(1, day);

  const passport = {
    meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      platform: 'The Shelf',
      day_active: day,
    },
    identity: {
      stage: stage.stage,
      potential_index: potential,
      proofs_submitted: proofCount?.c || 0,
      artifacts_created: artifactCount?.c || 0,
    },
    future_self: futureSelf ? {
      portrait: futureSelf.portrait,
      markers: futureSelf.markers_json ? JSON.parse(futureSelf.markers_json) : []
    } : null,
    ledger_claims: ledger.map(r => ({
      id: r.id,
      kind: r.kind,
      claim: r.claim,
      strength: r.strength,
      confidence: r.confidence,
      domain_tags: r.domain_tags ? JSON.parse(r.domain_tags) : [],
    })),
    system_prompt_hint: `You are assisting a user whose goals and identity are described below. Use this to personalize your responses.\n\nFuture Vision: ${futureSelf?.portrait || 'Not yet defined'}\n\nCore Claims:\n${ledger.map(r => `- [${r.kind}] ${r.claim}`).join('\n')}`,
  };

  res.setHeader('Content-Disposition', 'attachment; filename="identity_passport.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(passport);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Serve frontend for all other routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔥 The Shelf API running on port ${PORT}`);
  console.log(`🤖 GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'LOADED ✓' : 'MISSING ✗ — AI fallbacks will be used'}`);

  // Auto-seed database on startup if it's empty
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM sqlite_master WHERE type='table' AND name='content_items'`).get();
    if (!count || count.c === 0) {
      console.log('📦 Database is empty — running initial seed...');
      seedContent();
      seedHistory();
      console.log('✅ Seed complete.');
    } else {
      const itemCount = db.prepare(`SELECT COUNT(*) as c FROM content_items`).get();
      if (itemCount.c === 0) {
        console.log('📦 No content found — seeding content and history...');
        seedContent();
        seedHistory();
        console.log('✅ Seed complete.');
      } else {
        console.log(`📚 Database ready: ${itemCount.c} content items loaded.`);
      }
    }
  } catch (err) {
    console.error('Seed error (non-fatal):', err.message);
  }
});
