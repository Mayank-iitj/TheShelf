const { db } = require('../db');

// Mirrors client/src/screens/Onboarding.jsx QUESTIONS. Kept here so prompts can
// present each answer with the question that produced it — an answer like
// "about two hours" is meaningless to the model without its question.
const ONBOARDING_QUESTIONS = [
  'What are you trying to become good at, and why that?',
  'What have you actually finished in the last month? Not started — finished.',
  'When you sit down to learn, what usually happens?',
  "What do you tell people you're into that you never actually spend time on?",
  'How much time do you really have on a normal weekday?',
  "What's something you believe about this field that most people around you don't?",
  'What would make you say, a year from now, that this year worked?'
];

function answersKey(userId) {
  return `onboarding_answers_${userId}`;
}

// The raw interview answers are the only place the user's own words survive —
// ledger rows are a lossy summary of them. Persist them so every downstream
// agent can ground on what was actually said.
function saveOnboardingAnswers(userId, answers) {
  const payload = JSON.stringify(Array.isArray(answers) ? answers : []);
  db.prepare(`
    INSERT INTO app_state (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(answersKey(userId), payload);
}

function getOnboardingAnswers(userId) {
  const row = db.prepare(`SELECT value FROM app_state WHERE key = ?`).get(answersKey(userId));
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

// One place that assembles everything known about the user, so the curator,
// daily and master agents all reason over the same picture.
function buildUserContext(userId, day) {
  const answers = getOnboardingAnswers(userId);

  const futureSelf = db.prepare(`SELECT * FROM future_self WHERE user_id = ?`).get(userId) || null;
  const markers = futureSelf ? safeParse(futureSelf.markers_json, []) : [];

  const ledger = db.prepare(`
    SELECT * FROM ledger_rows WHERE user_id = ? AND status != 'purged' ORDER BY strength DESC
  `).all(userId).map(r => ({ ...r, domain_tags: safeParse(r.domain_tags, []) }));

  const habits = db.prepare(`SELECT * FROM habits WHERE user_id = ?`).all(userId);

  const artifacts = db.prepare(`
    SELECT * FROM artifacts WHERE user_id = ? AND day <= ? ORDER BY day DESC LIMIT 5
  `).all(userId, day);

  // Growth deliveries only: the attention-ranker rows are the twin's
  // counterfactual feed, never actually consumed, so counting them as
  // "already shown" would mislead the agent.
  const recentDeliveries = db.prepare(`
    SELECT d.day, d.why_now, d.opened, d.completed, c.title, c.type
    FROM deliveries d LEFT JOIN content_items c ON d.item_id = c.id
    WHERE d.user_id = ? AND d.ranker = 'growth' AND d.day < ? AND d.day >= ?
    ORDER BY d.day DESC LIMIT 9
  `).all(userId, day, Math.max(0, day - 7));

  // Every tag the user's own claims touch — the vocabulary their shelf should stay inside.
  const tags = [...new Set(ledger.flatMap(r => r.domain_tags))];

  return { answers, futureSelf, markers, ledger, habits, artifacts, recentDeliveries, tags };
}

// Renders the context as the user-message half of a prompt. Shared by agents so
// they see identical grounding and cite the same row ids.
function formatUserContext(ctx, day) {
  const lines = [];

  lines.push(`Day: ${day}`);

  if (ctx.answers.length > 0) {
    lines.push('\nWhat they said in their onboarding interview (their own words — quote these back where it helps):');
    ctx.answers.forEach((ans, i) => {
      if (!ans || !ans.trim()) return;
      lines.push(`Q: ${ONBOARDING_QUESTIONS[i] || `Question ${i + 1}`}`);
      lines.push(`A: ${ans.trim()}`);
    });
  }

  if (ctx.futureSelf?.portrait) {
    lines.push(`\nFuture-self portrait: ${ctx.futureSelf.portrait}`);
    if (ctx.markers.length > 0) {
      lines.push(`Markers: ${ctx.markers.map(m => `${m.marker} [${m.status}]`).join('; ')}`);
    }
  }

  if (ctx.ledger.length > 0) {
    lines.push('\nIdentity ledger (cite rows by id):');
    ctx.ledger.forEach(r => {
      lines.push(`- ${r.id} [${r.kind}, status=${r.status}, strength=${r.strength}] "${r.claim}" tags=${JSON.stringify(r.domain_tags)}`);
    });
  }

  if (ctx.habits.length > 0) {
    lines.push('\nObserved habits (what they actually do):');
    ctx.habits.forEach(h => {
      lines.push(`- ${h.id} "${h.pattern}"${h.contradicts_row ? ` (contradicts ${h.contradicts_row})` : ''}`);
    });
  }

  if (ctx.artifacts.length > 0) {
    lines.push('\nRecent artifacts they produced:');
    ctx.artifacts.forEach(a => lines.push(`- day ${a.day}: ${a.body}`));
  }

  if (ctx.recentDeliveries.length > 0) {
    lines.push('\nRecently delivered in the last 7 days — what was already shown, and whether they engaged (do not repeat these titles):');
    ctx.recentDeliveries.forEach(d => {
      const state = d.completed ? 'completed' : d.opened ? 'opened but not finished' : 'never opened';
      lines.push(`- day ${d.day}: ${d.title || 'untitled'} [${state}]`);
    });
  }

  return lines.join('\n');
}

module.exports = {
  ONBOARDING_QUESTIONS,
  saveOnboardingAnswers,
  getOnboardingAnswers,
  buildUserContext,
  formatUserContext
};
