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

export async function resetOnboarding() {
  return api('/api/onboarding/reset', { method: 'POST' });
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

export async function submitProof(delivery_id, proof_type, proof_content) {
  return api('/api/proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delivery_id, proof_type, proof_content })
  });
}

export async function fetchMaster(day) {
  return api(`/api/master?day=${day}`);
}

export async function fetchPassport() {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${API_BASE}/api/passport`);
  if (!res.ok) throw new Error('Failed to fetch passport');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'identity_passport.json';
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function chatWithFutureSelf(message, history) {
  return api('/api/future-self/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });
}
