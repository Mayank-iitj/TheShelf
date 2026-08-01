const { db } = require('../db');
const { getAllCompetences } = require('./competence');

function getPotentialIndex(userId, currentDay) {
  // potential = 100 * (0.30 * marker_progress + 0.25 * artifact_rate + 0.20 * competence_delta + 0.15 * mean_regret_normalized + 0.10 * autonomy)
  
  const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = ?`).get(userId);
  let marker_progress = 0;
  if (futureSelf) {
    const markers = JSON.parse(futureSelf.markers_json);
    const reached = markers.filter(m => m.status !== 'not_yet').length;
    marker_progress = markers.length > 0 ? reached / markers.length : 0;
  }

  const activeDays = Math.max(1, currentDay);
  const artifactsCount = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = ? AND day <= ?`).get(userId, currentDay).c;
  const artifact_rate = Math.min(1.0, artifactsCount / (activeDays * 0.5)); // cap at 1.0

  const comp = getAllCompetences(userId, currentDay);
  const compValues = Object.values(comp);
  const meanComp = compValues.reduce((a,b)=>a+b, 0) / (compValues.length || 1);
  const competence_delta = Math.min(1.0, (meanComp - 1) / 4);

  const mean_regret_normalized = 0.7; // Stub

  const deliveredCompleted = db.prepare(`SELECT COUNT(*) as c FROM deliveries WHERE user_id = ? AND day <= ? AND completed = 1 AND ranker = 'growth'`).get(userId, currentDay).c;
  const autonomy = artifactsCount > 0 ? Math.max(0, 1 - (deliveredCompleted / artifactsCount)) : 0.5;

  const potential = 100 * (
    0.30 * marker_progress +
    0.25 * artifact_rate +
    0.20 * competence_delta +
    0.15 * mean_regret_normalized +
    0.10 * autonomy
  );

  return Math.round(potential);
}

module.exports = { getPotentialIndex };
