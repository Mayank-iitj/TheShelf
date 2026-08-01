const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/shelf.db');
const schemaPath = path.resolve(__dirname, './schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to the database
const db = new Database(dbPath, { verbose: console.log });

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
