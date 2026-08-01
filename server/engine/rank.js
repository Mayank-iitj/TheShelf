const { db } = require('../db');
const { getAllCompetences } = require('./competence');

let currentWeights = {
  regret_prior: 0.35,
  artifact_prior: 0.30,
  completion: 0.20,
  revisit: 0.15,
  relevance: 0.25,
  zpd: 0.20,
  attention_penalty: 0.25
};

function getWeights() {
  return currentWeights;
}

function setWeights(weights) {
  currentWeights = { ...currentWeights, ...weights };
}

function scoreItem(item, userId, day, activeRows, competences) {
  let overlapScore = 0;
  const itemTags = JSON.parse(item.tags);
  
  for (const row of activeRows) {
    const rowTags = JSON.parse(row.domain_tags);
    const overlap = itemTags.some(t => rowTags.includes(t));
    if (overlap) {
      let multiplier = row.status === 'dormant' ? 0.15 : 1.0;
      if (row.status === 'purged') multiplier = 0;
      overlapScore += (row.strength * multiplier);
    }
  }
  const relevance = Math.min(1, overlapScore);

  let compSum = 0;
  let compCount = 0;
  for (const t of itemTags) {
    if (competences[t]) {
      compSum += competences[t];
      compCount++;
    }
  }
  const avgComp = compCount > 0 ? compSum / compCount : 1;
  const zpd = 1 - Math.abs(item.difficulty - (avgComp + 1)) / 4;

  const regret_prior = 0.5; // Stub: mean regret mapped
  const artifact_prior = 0.5; // Stub
  const completion = 0.5; // Stub
  const revisit = 0; // Stub
  
  const attention_penalty = item.thumbnail_heat * 0.5 + (item.minutes < 3 ? 0.5 : 0);

  const w = currentWeights;
  const score = 
    w.regret_prior * regret_prior +
    w.artifact_prior * artifact_prior +
    w.completion * completion +
    w.revisit * revisit +
    w.relevance * relevance +
    w.zpd * zpd -
    w.attention_penalty * attention_penalty;

  return {
    score,
    breakdown: { regret_prior, artifact_prior, completion, revisit, relevance, zpd, attention_penalty }
  };
}

function rankGrowth(userId, day) {
  const items = db.prepare(`SELECT * FROM content_items`).all();
  const rows = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status != 'purged'`).all(userId);
  const competences = getAllCompetences(userId, day);
  
  const scored = items.map(item => {
    const { score, breakdown } = scoreItem(item, userId, day, rows, competences);
    return { ...item, score, breakdown };
  });

  scored.sort((a, b) => b.score - a.score);
  
  // Dissent quota stub: if top 3 are mainstream, force highest contrarian to slot 3
  const top3 = scored.slice(0, 3);
  if (!top3.some(i => i.stance === 'contrarian')) {
    const highestContrarian = scored.find(i => i.stance === 'contrarian');
    if (highestContrarian) {
      top3[2] = highestContrarian;
    }
  }

  // Rest item stub
  const artifactsLast3Days = db.prepare(`SELECT COUNT(*) as c FROM artifacts WHERE user_id = ? AND day >= ? AND day < ?`).get(userId, day - 3, day).c;
  if (artifactsLast3Days === 0) {
    const restItem = scored.find(i => i.type === 'rest');
    if (restItem) {
      top3[0] = restItem;
    }
  }

  return top3.slice(0, 3);
}

module.exports = { rankGrowth, getWeights, setWeights };
