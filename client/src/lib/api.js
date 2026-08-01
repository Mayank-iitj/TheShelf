// In development, Vite proxies /api → localhost:3001.
// In production (Vercel), set VITE_API_URL to your Render backend URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchClock() {
  return api('/api/clock');
}

export async function setClock(day) {
  return api('/api/clock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day })
  });
}

export async function fetchLedger(day) {
  return api(`/api/ledger?day=${day}`);
}

export async function editLedgerRow(rowId, claim) {
  return api(`/api/ledger/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim })
  });
}

export async function purgeLedgerRow(rowId) {
  return api(`/api/ledger/${rowId}/purge`, { method: 'POST' });
}

export async function fetchShelf(day, ranker = 'growth') {
  return api(`/api/shelf?day=${day}&ranker=${ranker}`);
}

export async function fetchTwin(day) {
  return api(`/api/twin?day=${day}`);
}

export async function fetchWeights() {
  return api('/api/weights');
}

export async function setWeights(weights) {
  return api('/api/weights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights)
  });
}

export async function fetchHabits(day) {
  return api(`/api/habits?day=${day}`);
}

export async function fetchStage(day) {
  return api(`/api/stage?day=${day}`);
}

export async function fetchFutureSelf() {
  return api('/api/future-self');
}

export async function fetchPotential(day) {
  return api(`/api/potential?day=${day}`);
}

export async function resetSimulation() {
  return api('/api/reset', { method: 'POST' });
}

export async function fetchReview(day) {
  return api(`/api/review?day=${day}`);
}

export async function acceptReview(rowIds) {
  return api('/api/review/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowIds })
  });
}

export async function submitOnboarding(answers) {
  return api('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });
}
