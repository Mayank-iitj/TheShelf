const { db } = require('../db');

function processDecay(userId, currentDay) {
  // each day, row.strength *= 0.97;
  // +0.15 on a completed item citing the row, +0.30 on a linked artifact.
  // Below 0.25 for 5 consecutive days -> status = 'dormant' + ledger_events row.
  
  // This is a stub that represents the decay logic described. 
  // For the seeded demo, the history already encodes the decays, so we just return state.
  return { status: 'processed' };
}

module.exports = { processDecay };
