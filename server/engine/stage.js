const { db } = require('../db');

function getStage(userId, currentDay) {
  // orienting, building, deepening, applying, consolidating
  // For demo, simplify logic
  const artifactsCount = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = ? AND day <= ?`).get(userId, currentDay).c;
  
  if (artifactsCount < 3) return { stage: 'orienting', explanation: 'Less than 3 artifacts logged.' };
  if (artifactsCount >= 3 && artifactsCount < 6) return { stage: 'building', explanation: '3+ artifacts logged, building foundation.' };
  if (artifactsCount >= 6 && artifactsCount < 8) return { stage: 'deepening', explanation: 'Consistent cadence established.' };
  return { stage: 'applying', explanation: 'Difficulty 4 items completed with artifacts.' };
}

module.exports = { getStage };
