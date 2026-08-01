require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { db } = require('./db');

const { rankGrowth, getWeights, setWeights } = require('./engine/rank');
const { rankAttention } = require('./engine/attentionTwin');
const { getPotentialIndex } = require('./engine/potential');
const { getStage } = require('./engine/stage');
const { detectHabits } = require('./engine/habits');
const { runDailyAgent } = require('./agents/daily');
const { runOnboardingAgent } = require('./agents/onboarding');
const { runReviewAgent } = require('./agents/review');
const { seedContent } = require('./seed/seedContent');
const { seedHistory } = require('./seed/seedHistory');

const app = express();

// CORS: allow the Vercel frontend and localhost dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN, // e.g. https://thesmith.vercel.app
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

app.get('/api/shelf', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  const ranker = req.query.ranker || 'growth';
  
  // Check agent action first
  const action = db.prepare(`SELECT * FROM agent_actions WHERE day = ?`).get(day);
  if (action && action.intervention === 'withhold') {
    return res.json({
      action: {
        intervention: action.intervention,
        rationale: action.rationale,
        considered: JSON.parse(action.considered_json || '[]')
      },
      items: []
    });
  }

  // Pre-seeded deliveries logic
  let items = db.prepare(`
    SELECT c.*, d.why_now, d.cited_rows, d.score_breakdown
    FROM deliveries d
    JOIN content_items c ON d.item_id = c.id
    WHERE d.day = ? AND d.ranker = ?
  `).all(day, ranker);
  
  if (items.length === 0 && ranker === 'growth') {
     items = rankGrowth(1, day).map(i => ({
       ...i, 
       why_now: 'Because it challenges your current understanding.',
       cited_rows: JSON.stringify(["L05"])
     }));
  }

  res.json({
    action: action ? { intervention: action.intervention, rationale: action.rationale, considered: JSON.parse(action.considered_json || '[]') } : null,
    items
  });
});

app.get('/api/twin', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  // Return divergence chart data up to day
  const series = [];
  for (let d = 1; d <= day; d++) {
     series.push({
       day: d,
       potential: getPotentialIndex(1, d),
       attention_potential: getPotentialIndex(1, d) - Math.random() * 15, // Stub twin potential
       artifacts: db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE day <= ?`).get(d).c
     });
  }
  res.json({ series });
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

app.get('/api/potential', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  res.json({ index: getPotentialIndex(1, day) });
});

app.post('/api/reset', (req, res) => {
  seedContent();
  seedHistory();
  res.json({ success: true });
});

app.post('/api/onboarding', async (req, res, next) => {
  try {
    const { answers } = req.body;
    const result = await runOnboardingAgent(answers);
    
    // Clear old seeded ledger to start fresh
    db.prepare(`DELETE FROM ledger_rows`).run();
    db.prepare(`DELETE FROM future_self`).run();
    
    db.prepare(`INSERT INTO future_self (user_id, portrait, markers_json) VALUES (1, ?, ?)`).run(result.future_self.portrait, '[]');
    
    const insertRow = db.prepare(`INSERT INTO ledger_rows (id, user_id, kind, claim, domain_tags_json, confidence, provenance, source, status, strength, created_day, updated_day) VALUES (?, 1, ?, ?, ?, 0.9, 'Onboarding interview', 'interview', 'active', ?, 1, 1)`);
    
    result.ledger_rows.forEach((row, i) => {
      insertRow.run(`L0${i+1}`, row.kind, row.claim, JSON.stringify(row.domain_tags || []), row.strength || 0.8);
    });
    
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
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
  const { rowIds } = req.body;
  const day = getDay();
  
  // Here we would lookup the proposals for the current day and apply them to the ledger.
  // For the sake of the demo, we'll just mock success.
  res.json({ success: true });
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
  console.log(`🔥 TheSmith API running on port ${PORT}`);
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
