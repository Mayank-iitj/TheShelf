const { db, resetDb } = require('../db');
const path = require('path');
const fs = require('fs');

function seedContent() {
  console.log('Resetting database...');
  resetDb();

  const contentPath = path.resolve(__dirname, 'content.json');
  const items = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  console.log(`Loading ${items.length} items into the content pool...`);
  
  const insertStmt = db.prepare(`
    INSERT INTO content_items (
      id, title, url, source, bucket, type, minutes, difficulty, tags, stance, thumbnail_heat, novelty, completion_condition
    ) VALUES (
      @id, @title, @url, @source, @bucket, @type, @minutes, @difficulty, @tags, @stance, @thumbnail_heat, @novelty, @completion_condition
    )
  `);

  db.transaction(() => {
    for (const item of items) {
      const row = {
        ...item,
        tags: JSON.stringify(item.tags),
        completion_condition: item.completion_condition || null
      };
      insertStmt.run(row);
    }
  })();

  console.log('Content seeded successfully.');
}

if (require.main === module) {
  seedContent();
}

module.exports = { seedContent };
