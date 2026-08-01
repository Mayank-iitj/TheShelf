const { db } = require('../db');

function rankAttention(userId, day) {
  const items = db.prepare(`SELECT * FROM content_items`).all();
  
  const scored = items.map(item => {
    // 0.45*thumbnail_heat + 0.30*novelty + 0.15*(1 - minutes/60) + 0.10*tag_overlap
    const minutesTerm = 1 - Math.min(60, item.minutes) / 60;
    const tag_overlap = 0.5; // Stub
    const score = 0.45 * item.thumbnail_heat + 0.30 * item.novelty + 0.15 * minutesTerm + 0.10 * tag_overlap;
    return { ...item, score, breakdown: { thumbnail_heat: item.thumbnail_heat, novelty: item.novelty, minutesTerm, tag_overlap } };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3); // No cap technically requested, but returning top 3 for display
}

module.exports = { rankAttention };
