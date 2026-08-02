const { callGeminiWithGrounding } = require('../lib/gemini');

function truncate(text, max = 140) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

// Deterministic fallback used whenever Gemini is unavailable or errors.
// Keyed off answers[0] (the goal) only — the masterplan is scoped to the
// goal, not the full 7-answer onboarding context.
function buildFallbackFromAnswers(answers) {
  const goal = (answers[0] || '').trim() || 'your goal';
  const g = truncate(goal, 60);

  const searchLink = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return {
    goal,
    stages: [
      {
        title: 'Foundations',
        description: `Learn the fundamentals behind ${g}.`,
        resources: [
          { label: 'Search for beginner guides', url: searchLink(`${goal} beginner guide`) }
        ]
      },
      {
        title: 'Core Skills',
        description: `Build the specific skills ${g} actually requires.`,
        resources: [
          { label: 'Search for core skill tutorials', url: searchLink(`${goal} core skills tutorial`) }
        ]
      },
      {
        title: 'Portfolio',
        description: `Produce visible proof of work in ${g}.`,
        resources: [
          { label: 'Search for portfolio project ideas', url: searchLink(`${goal} portfolio project ideas`) }
        ]
      },
      {
        title: 'Launch',
        description: `Put your work in front of real people or opportunities in ${g}.`,
        resources: [
          { label: 'Search for where to launch or apply', url: searchLink(`${goal} job board or community`) }
        ]
      }
    ]
  };
}

const MASTERPLAN_SYSTEM_PROMPT = `
You are a roadmap architect with access to live Google Search.
Given a person's stated goal, produce a staged, trackable checklist roadmap
to get them there. Do NOT write any introductory narrative, motivational
copy, or prose framing — output ONLY the structured plan.

Use Google Search to find REAL, CURRENT, verifiable resources (courses,
docs, communities, tools) — do not invent URLs from memory.

Return ONLY a single JSON object (optionally wrapped in \`\`\`json fences),
with this exact shape:
{
  "goal": "<the goal, echoed back>",
  "stages": [
    {
      "title": "<short phase name, e.g. 'Foundations'>",
      "description": "<ONE short sentence, no more>",
      "resources": [
        { "label": "<resource name>", "url": "<real URL found via search>" }
      ]
    }
  ]
}

Produce exactly 4-6 stages, ordered from earliest to latest (e.g.
Foundations -> Core Skills -> Portfolio/Practice -> Launch, adapted to the
goal's actual field — this applies to ANY field, not just software:
design, trades, arts, business, sports, academics, anything). Each stage
must have 2-4 resources. Every resource must have a real, working, current
URL — prefer official docs, well-known platforms, or specific named
communities over generic search-result links.

Return ONLY valid JSON.
`;

async function runMasterplanAgent(answers) {
  const goal = (answers[0] || '').trim();
  const userPrompt = `Goal: ${goal}`;
  const fallback = buildFallbackFromAnswers(answers);

  const result = await callGeminiWithGrounding(MASTERPLAN_SYSTEM_PROMPT, userPrompt, fallback);
  return stripMarkdown(normalizeResult(result, fallback));
}

// LLM output here isn't schema-enforced (search grounding precludes strict
// JSON mode), so defensively filter/clamp shape rather than trust it raw.
function normalizeResult(result, fallback) {
  const safe = (result && typeof result === 'object') ? result : {};
  const goal = typeof safe.goal === 'string' && safe.goal.trim() ? safe.goal : fallback.goal;

  let stages = Array.isArray(safe.stages) ? safe.stages : [];
  stages = stages
    .filter(s => s && typeof s.title === 'string' && s.title.trim())
    .map(s => ({
      title: s.title.trim(),
      description: typeof s.description === 'string' ? s.description.trim() : '',
      resources: (Array.isArray(s.resources) ? s.resources : [])
        .filter(r => r && typeof r.url === 'string' && r.url.trim())
        .map(r => ({
          label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : r.url,
          url: r.url.trim()
        }))
        .slice(0, 4)
    }))
    .slice(0, 6);

  if (stages.length === 0) stages = fallback.stages;

  return { goal, stages };
}

// LLM output is rendered as plain text in the UI, not parsed as markdown —
// strip any emphasis markers it adds so text doesn't show literal asterisks.
function stripMarkdown(result) {
  const clean = (s) => typeof s === 'string' ? s.replace(/\*\*/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/(\S)\*(\s|$)/g, '$1$2') : s;
  result.stages.forEach(s => {
    s.title = clean(s.title);
    s.description = clean(s.description);
  });
  return result;
}

module.exports = { runMasterplanAgent };
