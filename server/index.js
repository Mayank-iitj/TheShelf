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
const { seedContent } = require('./seed/seedContent');
const { seedHistory } = require('./seed/seedHistory');

const app = express();
app.use(helmet({ contentSecurityPolicy: false })); // allow dev scripts
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

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

app.get('/api/review', (req, res) => {
  const day = req.query.day ? parseInt(req.query.day, 10) : getDay();
  const review = db.prepare(`SELECT * FROM reviews WHERE day = ?`).get(day);
  res.json(review || {});
});

app.post('/api/review/accept', (req, res) => {
  // Mock accept logic
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
  console.log(\`Server running on port \${PORT}\`);
});
