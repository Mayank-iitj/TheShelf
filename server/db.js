const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shelf.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency in production
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Database schema initialized.');
}

function clearDb() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  for (const table of tables) {
    if (table.name !== 'sqlite_sequence') {
      db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
    }
  }
}

function resetDb() {
    clearDb();
    initDb();
}

module.exports = {
  db,
  initDb,
  clearDb,
  resetDb
};
