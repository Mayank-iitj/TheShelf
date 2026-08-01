const { db } = require('../db');

// Dummy competence formula for now based on brief
// competence = clamp(1 + 4 * (0.6*artifact_rate + 0.4*completed_difficulty_ewma/5), 1, 5)

function getCompetence(userId, tag, upToDay) {
  const artifacts = db.prepare(`
    SELECT a.*, c.difficulty 
    FROM artifacts a
    JOIN content_items c ON a.linked_item_id = c.id
    WHERE a.user_id = ? AND a.day <= ? AND c.tags LIKE ?
  `).all(userId, upToDay, `%${tag}%`);

  const activeDays = Math.max(1, upToDay); // simplify active days
  const artifactRate = Math.min(1, artifacts.length / (activeDays / 3)); 
  
  let ewma = 0;
  if (artifacts.length > 0) {
    ewma = artifacts.reduce((acc, a) => acc + (a.difficulty || 2), 0) / artifacts.length;
  }

  const competence = 1 + 4 * (0.6 * artifactRate + 0.4 * (ewma / 5));
  return Math.min(5, Math.max(1, competence));
}

function getAllCompetences(userId, upToDay) {
  const allTags = JSON.parse(db.prepare(`
    SELECT value FROM app_state WHERE key = 'all_tags'
  `).get()?.value || '["http", "databases", "sql", "indexing", "caching", "concurrency", "distributed-systems", "api-design", "testing", "debugging", "deployment", "observability", "security", "career", "learning-how-to-learn", "systems-thinking", "burnout", "communication"]');
  
  const comp = {};
  for (const tag of allTags) {
    comp[tag] = getCompetence(userId, tag, upToDay);
  }
  return comp;
}

module.exports = { getCompetence, getAllCompetences };
