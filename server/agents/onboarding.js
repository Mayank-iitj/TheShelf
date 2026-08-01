const { callLLM } = require('../lib/llm');

// Vocabulary of domain tags actually used by the content pool (server/seed/content.json).
// Matching answers against these keeps ledger rows connected to real content for ranking.
const TAG_KEYWORDS = {
  'http': ['http', 'web server', 'request', 'protocol'],
  'security': ['security', 'auth', 'vulnerab', 'exploit', 'encrypt'],
  'databases': ['database', 'postgres', 'mongo', 'db '],
  'sql': ['sql', 'query', 'queries'],
  'distributed-systems': ['distributed', 'microservice', 'cluster', 'consensus'],
  'systems-thinking': ['systems', 'architecture', 'design pattern'],
  'deployment': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline'],
  'api-design': ['api', 'rest', 'graphql', 'endpoint'],
  'caching': ['cache', 'caching', 'redis'],
  'concurrency': ['concurren', 'thread', 'async', 'parallel'],
  'debugging': ['debug', 'bug', 'incident', 'troubleshoot'],
  'observability': ['observab', 'logging', 'metrics', 'monitor'],
  'testing': ['test', 'testing', 'qa'],
  'career': ['career', 'job', 'company', 'engineer', 'role'],
  'communication': ['communicat', 'writing', 'essay', 'talk', 'present'],
  'learning-how-to-learn': ['learn', 'study', 'read', 'practice'],
  'burnout': ['burnout', 'tired', 'exhaust', 'overwhelm'],
  'indexing': ['index', 'search'],
};

function extractTags(text, fallbackTags = []) {
  const lower = (text || '').toLowerCase();
  const found = Object.entries(TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
    .map(([tag]) => tag);
  return found.length > 0 ? found.slice(0, 3) : fallbackTags;
}

function truncate(text, max = 140) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

// Deterministic, answer-derived fallback used whenever the LLM is unavailable or errors.
// Every call produces a result unique to the actual answers given — never a fixed canned object.
function buildFallbackFromAnswers(answers) {
  const a = (i) => (answers[i] || '').trim();
  const [goal, finished, learnHabit, unspentInterest, timeAvail, contrarianBelief, yearSuccess] = [0, 1, 2, 3, 4, 5, 6].map(a);

  const ledger_rows = [];

  if (goal) {
    ledger_rows.push({
      kind: 'aspiration',
      claim: `I want to become good at ${truncate(goal, 90)}`,
      domain_tags: extractTags(goal, ['career']),
      strength: 0.85
    });
  }

  if (finished) {
    ledger_rows.push({
      kind: 'competence',
      claim: `I have actually finished: ${truncate(finished, 100)}`,
      domain_tags: extractTags(finished, ['learning-how-to-learn']),
      strength: 0.75
    });
  }

  if (learnHabit) {
    ledger_rows.push({
      kind: 'preference',
      claim: `When I sit down to learn: ${truncate(learnHabit, 100)}`,
      domain_tags: extractTags(learnHabit, ['learning-how-to-learn']),
      strength: 0.7
    });
  }

  if (unspentInterest) {
    ledger_rows.push({
      kind: 'tension',
      claim: `I say I'm into ${truncate(unspentInterest, 80)}, but I don't actually spend time on it`,
      domain_tags: extractTags(unspentInterest, ['career']),
      strength: 0.6
    });
  }

  if (timeAvail) {
    ledger_rows.push({
      kind: 'constraint',
      claim: `On a normal weekday I really have: ${truncate(timeAvail, 80)}`,
      domain_tags: ['learning-how-to-learn'],
      strength: 0.8
    });
  }

  if (contrarianBelief) {
    ledger_rows.push({
      kind: 'preference',
      claim: truncate(contrarianBelief, 120),
      domain_tags: extractTags(contrarianBelief, ['systems-thinking']),
      strength: 0.65
    });
  }

  if (yearSuccess) {
    ledger_rows.push({
      kind: 'aspiration',
      claim: `A year from now, this worked if: ${truncate(yearSuccess, 100)}`,
      domain_tags: extractTags(yearSuccess, ['career']),
      strength: 0.9
    });
  }

  // Guarantee at least one row even if every answer was left blank.
  if (ledger_rows.length === 0) {
    ledger_rows.push({
      kind: 'aspiration',
      claim: 'I want to figure out what I am actually trying to become',
      domain_tags: ['career'],
      strength: 0.5
    });
  }

  const portraitGoal = goal || yearSuccess || 'someone who follows through on what they start';
  const portraitProof = yearSuccess || finished || 'consistent, visible progress';
  const portrait = `I am becoming ${truncate(portraitGoal, 100)}. I'll know it worked when ${truncate(portraitProof, 100)}.`;

  const markers = [
    finished ? { status: 'not_yet', marker: `Do again, deliberately: ${truncate(finished, 60)}` } : { status: 'not_yet', marker: 'Finish one thing you start this month' },
    { status: 'not_yet', marker: unspentInterest ? `Actually spend time on ${truncate(unspentInterest, 50)}` : 'Close the gap between what you say and what you do' },
    { status: 'not_yet', marker: yearSuccess ? truncate(yearSuccess, 70) : 'Define what a successful year looks like' }
  ];

  return {
    future_self: { portrait, markers },
    ledger_rows
  };
}

const ONBOARDING_SYSTEM_PROMPT = `
You are an identity architect. A user has answered an onboarding interview designed to extract their core aspirations, competencies, and preferences.
Your task is to translate their answers into structured claims for their "Identity Ledger" and to synthesize a visceral "Future Self" portrait.

You will output exactly one JSON object with two top-level keys: "future_self" and "ledger_rows".

1. "future_self" should contain two keys:
- "portrait": a 1-2 sentence visceral, evocative description of the person they are trying to become.
- "markers": an array of 3-5 concrete, testable milestones (e.g. 'Deploy a fullstack app to production'). Each object in the array must have a "status" string set to "not_yet", and a "marker" string describing the milestone.

2. "ledger_rows" should be an array of objects. Each object must have:
- "kind": either "aspiration", "competence", or "preference"
- "claim": a bold, first-person statement (e.g. "I want to be a backend engineer at a product company within a year")
- "domain_tags": an array of 1-3 lowercase string tags (e.g. ["career", "engineering"])
- "strength": a float between 0.1 and 1.0 representing how strongly they seem to hold this

Generate 3-5 high-quality ledger rows based ONLY on what the user actually said.

Return ONLY valid JSON.
`;

async function runOnboardingAgent(answers) {
  const userPrompt = `
    User's Interview Answers:
    ${answers.map((ans, idx) => `Q${idx + 1}: ${ans}`).join('\n')}
  `;

  const fallback = buildFallbackFromAnswers(answers);

  const result = await callLLM(ONBOARDING_SYSTEM_PROMPT, userPrompt, fallback);
  return stripMarkdown(normalizeResult(result, fallback));
}

// The LLM can return syntactically valid JSON that still omits a top-level key
// the system prompt asked for (or returns it in the wrong shape). Backfill any
// missing piece from the deterministic fallback so downstream code can always
// rely on future_self.{portrait,markers} and ledger_rows existing and being
// well-formed, instead of crashing on whichever key the model dropped.
function normalizeResult(result, fallback) {
  const safe = (result && typeof result === 'object') ? result : {};

  const future_self = (safe.future_self && typeof safe.future_self === 'object')
    ? safe.future_self
    : fallback.future_self;

  return {
    future_self: {
      portrait: typeof future_self.portrait === 'string' && future_self.portrait.trim()
        ? future_self.portrait
        : fallback.future_self.portrait,
      markers: Array.isArray(future_self.markers) && future_self.markers.length > 0
        ? future_self.markers
        : fallback.future_self.markers
    },
    ledger_rows: Array.isArray(safe.ledger_rows) && safe.ledger_rows.length > 0
      ? safe.ledger_rows
      : fallback.ledger_rows
  };
}

// LLM output is rendered as plain text in the UI, not parsed as markdown —
// strip any emphasis markers it adds so claims don't show literal asterisks.
function stripMarkdown(result) {
  const clean = (s) => typeof s === 'string' ? s.replace(/\*\*/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2') : s;
  if (result.future_self) {
    result.future_self.portrait = clean(result.future_self.portrait);
    (result.future_self.markers || []).forEach(m => { m.marker = clean(m.marker); });
  }
  (result.ledger_rows || []).forEach(r => { r.claim = clean(r.claim); });
  return result;
}

module.exports = { runOnboardingAgent };
