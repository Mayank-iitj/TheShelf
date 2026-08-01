// Using Node.js 22+ built-in sqlite module — no native compilation required.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shelf.db');
const _db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrency in production
_db.exec('PRAGMA journal_mode = WAL');
_db.exec('PRAGMA foreign_keys = ON');

/**
 * Thin compatibility shim so the rest of the codebase can keep using
 * db.prepare(sql).get/all/run syntax (same as better-sqlite3).
 */
const db = {
  prepare(sql) {
    const stmt = _db.prepare(sql);
    return {
      get(...args) {
        return stmt.get(...args);
      },
      all(...args) {
        return stmt.all(...args);
      },
      run(...args) {
        return stmt.run(...args);
      },
      // Iterator support for better-sqlite3 compatibility
      iterate(...args) {
        return stmt.iterate ? stmt.iterate(...args) : [];
      }
    };
  },
  exec(sql) {
    return _db.exec(sql);
  },
  // Expose raw db for advanced use
  _raw: _db,
};

const schemaPath = path.join(__dirname, 'schema.sql');

function initDb() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  _db.exec(schema);
  console.log('Database schema initialized.');
}

function clearDb() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  for (const table of tables) {
    if (table.name !== 'sqlite_sequence') {
      _db.exec(`DROP TABLE IF EXISTS "${table.name}"`);
    }
  }
}

function resetDb() {
  clearDb();
  initDb();
}

// Auto-initialize schema on first load
try {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_state'").get();
  if (!row) {
    initDb();
  }
} catch (err) {
  console.error('DB init error:', err.message);
  initDb();
}

module.exports = {
  db,
  initDb,
  clearDb,
  resetDb
};
