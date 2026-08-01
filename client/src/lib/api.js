export async function fetchClock() {
  const res = await fetch('/api/clock');
  return res.json();
}

export async function setClock(day) {
  const res = await fetch('/api/clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day })
  });
  return res.json();
}

export async function fetchLedger(day) {
  const res = await fetch(`/api/ledger?day=${day}`);
  return res.json();
}

export async function editLedgerRow(rowId, claim) {
  const res = await fetch(`/api/ledger/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim })
  });
  return res.json();
}

export async function purgeLedgerRow(rowId) {
  const res = await fetch(`/api/ledger/${rowId}/purge`, { method: 'POST' });
  return res.json();
}

export async function fetchShelf(day, ranker = 'growth') {
  const res = await fetch(`/api/shelf?day=${day}&ranker=${ranker}`);
  return res.json();
}

export async function fetchTwin(day) {
  const res = await fetch(`/api/twin?day=${day}`);
  return res.json();
}

export async function fetchWeights() {
  const res = await fetch('/api/weights');
  return res.json();
}

export async function setWeights(weights) {
  const res = await fetch('/api/weights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights)
  });
  return res.json();
}

export async function fetchHabits(day) {
  const res = await fetch(`/api/habits?day=${day}`);
  return res.json();
}

export async function fetchStage(day) {
  const res = await fetch(`/api/stage?day=${day}`);
  return res.json();
}

export async function fetchFutureSelf() {
  const res = await fetch('/api/future-self');
  return res.json();
}

export async function fetchPotential(day) {
  const res = await fetch(`/api/potential?day=${day}`);
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch('/api/reset', { method: 'POST' });
  return res.json();
}

export async function fetchReview(day) {
  const res = await fetch(`/api/review?day=${day}`);
  return res.json();
}

export async function acceptReview(rowIds) {
  const res = await fetch('/api/review/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowIds })
  });
  return res.json();
}
