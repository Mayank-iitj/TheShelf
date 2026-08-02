CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  created_at TEXT
);

-- The Identity Ledger. This is the product. Human-readable rows.
CREATE TABLE ledger_rows (
  id TEXT PRIMARY KEY,               -- 'L01', 'L02' ... shown in the UI, cited by why_now
  user_id INTEGER,
  kind TEXT,                         -- aspiration | competence | constraint | preference | tension
  claim TEXT,                        -- one plain sentence, first person: "I want to ..."
  domain_tags TEXT,                  -- JSON array of strings
  confidence REAL,                   -- 0..1
  provenance TEXT,                   -- why the system believes this, plain sentence
  source TEXT,                       -- interview | inferred | user_edit
  status TEXT,                       -- active | dormant | purged
  strength REAL,                     -- 0..1, decays over time, refreshed by evidence
  created_day INTEGER,               -- simulation day index
  updated_day INTEGER
);

CREATE TABLE ledger_events (         -- append-only audit trail; powers time travel
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, day INTEGER,
  row_id TEXT, event TEXT,           -- created | strengthened | weakened | edited | purged | dormant
  before_json TEXT, after_json TEXT, rationale TEXT
);

-- Observed behavioural patterns. Distinct from the ledger: the ledger is what they SAY,
-- habits are what they DO. The gap between them is the product.
CREATE TABLE habits (
  id TEXT PRIMARY KEY,               -- 'H01' ...
  user_id INTEGER,
  pattern TEXT,                      -- "you start at 22:40 on weeknights and stop after 18 minutes"
  metric TEXT,                       -- cadence | session_length | time_of_day | dropoff | streak | modality
  value_json TEXT,                   -- structured: {"median_start":"22:40","median_minutes":18}
  evidence_days INTEGER,             -- how many days of data support it
  confidence REAL,
  contradicts_row TEXT,              -- ledger row id this behaviour contradicts, or NULL
  first_day INTEGER, updated_day INTEGER
);

-- The self they imagine. One row. Written by the user, refined by the agent.
CREATE TABLE future_self (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  title TEXT,                        -- "A backend engineer people ask for review"
  portrait TEXT,                     -- 3-5 sentences, first person, present tense
  markers_json TEXT,                 -- [{"marker":"can debug a prod incident alone","status":"not_yet"|"emerging"|"reached","reached_day":N}]
  horizon_months INTEGER,
  updated_day INTEGER
);

-- Autonomous agent runs and the actions taken. Proof of agency.
CREATE TABLE agent_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, day INTEGER,
  intervention TEXT,                 -- deliver | challenge | mentor_intro | counterpoint | revisit | rest | withhold
  rationale TEXT,                    -- the agent's own plain-language reasoning for this choice
  payload_json TEXT,                 -- e.g. drafted outreach message, generated challenge brief
  state TEXT,                        -- proposed | accepted | dismissed | completed
  considered_json TEXT               -- the alternatives it rejected, and why — rendered in the UI
);

CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  title TEXT, url TEXT, source TEXT,
  bucket TEXT,                       -- media | knowledge | experience
  type TEXT,                         -- idea | story | tool | mentor | challenge | rest
  minutes INTEGER,
  difficulty INTEGER,                -- 1..5
  tags TEXT,                         -- JSON array
  stance TEXT,                       -- mainstream | contrarian
  thumbnail_heat REAL,               -- 0..1, engagement-bait score, used ONLY by the Attention Twin
  novelty REAL,                      -- 0..1, used ONLY by the Attention Twin
  completion_condition TEXT          -- instructions for completing an experience
);

CREATE TABLE deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, day INTEGER, item_id TEXT,
  ranker TEXT,                       -- growth | attention
  slot INTEGER,                      -- 0,1,2
  why_now TEXT, cited_rows TEXT,     -- JSON array of ledger row ids
  score REAL, score_breakdown TEXT,  -- JSON of each term's contribution
  opened INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  dwell_minutes REAL DEFAULT 0
);

CREATE TABLE artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, day INTEGER,
  body TEXT, linked_item_id TEXT, kind TEXT   -- note | code | project | conversation | practice
);

CREATE TABLE regret_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, delivery_id INTEGER,
  asked_day INTEGER,                 -- always consumed_day + 7
  value INTEGER                      -- -1 wasted my time | 0 neutral | 1 worth it | 2 changed something
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER, day INTEGER,
  proposed_json TEXT,                -- array of proposed diffs
  accepted_json TEXT                 -- array of row ids the user accepted
);

CREATE TABLE app_state (             -- the simulation clock
  key TEXT PRIMARY KEY, value TEXT   -- 'current_day' -> '21'
);

CREATE TABLE proofs (               -- Proof of Action submissions
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  delivery_id TEXT,
  day INTEGER,
  proof_type TEXT,                  -- url | text | code
  proof_content TEXT,               -- URL or text content
  verified INTEGER DEFAULT 1,       -- auto-verified for now
  created_at TEXT
);

-- The Masterplan. One header row per user: the roadmap's framing.
-- Stages are lifted into their own table (below) rather than a JSON blob
-- here, because each stage needs an independent id to PATCH its "done"
-- state without rewriting the whole plan.
CREATE TABLE masterplans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  goal TEXT,                         -- verbatim goal text the plan was built for
  source TEXT,                       -- 'gemini' | 'fallback'
  created_day INTEGER,
  updated_day INTEGER
);

-- Staged checklist items belonging to a masterplan, ordered by stage_order.
CREATE TABLE masterplan_stages (
  id TEXT PRIMARY KEY,               -- 'MP01', 'MP02' ... shown in the UI
  masterplan_id INTEGER,
  user_id INTEGER,
  stage_order INTEGER,               -- 0-based ordering
  title TEXT,                        -- "Foundations"
  description TEXT,                  -- one short sentence, no narrative
  resources_json TEXT,               -- JSON array of {"label","url"}
  done INTEGER DEFAULT 0,            -- checkbox state
  created_day INTEGER,
  updated_day INTEGER
);
