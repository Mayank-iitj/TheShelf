const { db } = require('../db');

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

// Replaces any existing plan for the user — re-onboarding regenerates from scratch.
const saveMasterplan = db.transaction((userId, day, goal, source, stages) => {
  db.prepare(`DELETE FROM masterplan_stages WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM masterplans WHERE user_id = ?`).run(userId);

  db.prepare(`
    INSERT INTO masterplans (user_id, goal, source, created_day, updated_day)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, goal, source, day, day);

  const { id: masterplanId } = db.prepare(
    `SELECT id FROM masterplans WHERE user_id = ? ORDER BY id DESC LIMIT 1`
  ).get(userId);

  stages.forEach((stage, idx) => {
    const stageId = `MP${String(idx + 1).padStart(2, '0')}`;
    db.prepare(`
      INSERT INTO masterplan_stages
        (id, masterplan_id, user_id, stage_order, title, description, resources_json, done, created_day, updated_day)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(stageId, masterplanId, userId, idx, stage.title, stage.description, JSON.stringify(stage.resources || []), day, day);
  });
});

function getMasterplan(userId) {
  const header = db.prepare(`SELECT * FROM masterplans WHERE user_id = ?`).get(userId);
  if (!header) return null;
  const stages = db.prepare(
    `SELECT * FROM masterplan_stages WHERE user_id = ? ORDER BY stage_order ASC`
  ).all(userId).map(s => ({ ...s, resources: safeParse(s.resources_json, []) }));
  return { ...header, stages };
}

function setStageDone(userId, stageId, done, day) {
  db.prepare(`
    UPDATE masterplan_stages SET done = ?, updated_day = ? WHERE id = ? AND user_id = ?
  `).run(done ? 1 : 0, day, stageId, userId);
}

module.exports = { saveMasterplan, getMasterplan, setStageDone };
