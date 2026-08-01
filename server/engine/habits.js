const { db } = require('../db');

function detectHabits(userId, currentDay) {
  // Returns habits from DB. Actual habit detection is supposed to be derived from deliveries/artifacts.
  // For the demo, habits are populated in the seed script and retrieved here.
  return db.prepare(`SELECT * FROM habits WHERE user_id = ?`).all(userId);
}

module.exports = { detectHabits };
