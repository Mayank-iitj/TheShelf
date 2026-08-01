const { db } = require('../db');
const { callLLM } = require('../lib/llm');
const { buildUserContext, formatUserContext } = require('../lib/profile');
const { scoreItem, rankGrowth } = require('../engine/rank');
const { getAllCompetences } = require('../engine/competence');
const { getStage } = require('../engine/stage');
const { getPotentialIndex } = require('../engine/potential');
const { VOCAB, normalizeTags } = require('../lib/tags');

const ITEM_TYPES = ['idea', 'story', 'tool', 'mentor', 'challenge', 'rest'];
const BUCKETS = ['media', 'knowledge', 'experience'];

// Buckets the schema pairs each type with, so a model that picks a type but a
// nonsense bucket still produces a coherent row.
const BUCKET_FOR_TYPE = {
  idea: 'knowledge',
  tool: 'knowledge',
  story: 'media',
  mentor: 'experience',
  challenge: 'experience',
  rest: 'experience'
};

const CURATOR_SYSTEM_PROMPT = `
You are the shelf curator for one specific person. You build today's shelf: exactly 3 items, made for them.

You receive their onboarding interview answers in their own words, their future-self portrait,
their identity ledger (claims they hold, each with an id like L01), their observed habits,
their recent artifacts, and the intervention the daily agent chose for today.

Every item must be something THIS person should do or read today because of something they
actually said or did. Generic material is a failure. If their interview says they have 40 minutes
on a weekday, do not hand them a 3-hour item. If a habit contradicts a claim, let one item confront that.

For each item produce:
- "title": specific and concrete. Name the actual thing ("Rebuild your rate limiter without Redis, then explain what broke"), never a topic label ("Introduction to caching").
- "type": one of idea, story, tool, mentor, challenge, rest.
- "minutes": realistic integer, inside the time they said they have.
- "difficulty": integer 1-5, just past what they can already do — not far past.
- "tags": 1-3 tags chosen ONLY from this list, preferring the ones already on the ledger rows you are serving: ${VOCAB.join(', ')}
- "stance": "mainstream" or "contrarian". At least one item should be contrarian.
- "why_now": 1-2 sentences addressed to them as "you", naming the specific claim, habit or artifact that
  put this on the shelf today. Quote their own words where it lands. Never cite engagement or popularity.
- "cited_rows": array of ledger row ids this item serves. Use only ids present in their ledger.
- "completion_condition": what counts as done — a checkable output, not "understand X".

Match the day's intervention: for "rest" or "withhold", items should be genuinely restorative or empty of new work;
for "challenge", at least two items should be things they build.

Return ONLY JSON: {"items":[{...},{...},{...}],"shelf_note":"one sentence on what today's shelf is trying to do for them"}
`;

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function cleanText(text) {
  return typeof text === 'string'
    ? text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

// The model can return a well-formed object that still contains an invented
// ledger id, an out-of-enum type, or a 400-minute item for someone with 30
// minutes a day. Coerce everything into something the schema and the UI can
// hold, and drop items that carry no usable title.
function normalizeItems(raw, ctx) {
  const validRowIds = new Set(ctx.ledger.map(r => r.id));
  const list = Array.isArray(raw?.items) ? raw.items : [];

  const fallbackTags = ctx.tags.length > 0 ? ctx.tags.slice(0, 2) : ['learning-how-to-learn'];

  return list.map(item => {
    const type = ITEM_TYPES.includes(item?.type) ? item.type : 'idea';
    const bucket = BUCKETS.includes(item?.bucket) ? item.bucket : BUCKET_FOR_TYPE[type];

    const title = cleanText(item?.title);
    const why_now = cleanText(item?.why_now);

    const tags = normalizeTags(item?.tags, `${title} ${why_now}`, fallbackTags);

    // The row chip on each card is the product's provenance claim — an item with
    // no citation reads as untethered content. Keep whatever ids the model got
    // right, and attach the closest real row when it cited nothing usable.
    let cited = Array.isArray(item?.cited_rows)
      ? item.cited_rows.filter(id => validRowIds.has(id)).slice(0, 3)
      : [];
    if (cited.length === 0) {
      const match = pickClosestRow(ctx.ledger, tags);
      if (match) cited = [match.id];
    }

    return {
      title,
      type,
      bucket,
      // A rest item still takes time ("a 10 minute walk") — forcing 0 made the
      // card read as "0m", which looked like missing data rather than rest.
      minutes: clampInt(item?.minutes, 0, 180, type === 'rest' ? 10 : 25),
      difficulty: type === 'rest' ? 1 : clampInt(item?.difficulty, 1, 5, 3),
      tags,
      stance: item?.stance === 'contrarian' ? 'contrarian' : 'mainstream',
      why_now,
      cited_rows: cited,
      completion_condition: cleanText(item?.completion_condition)
    };
  }).filter(item => item.title).slice(0, 3);
}

// Strongest active row sharing a tag with the item; strongest row overall if
// none overlap, so a card always points back at something the user claimed.
function pickClosestRow(ledger, tags) {
  if (!ledger || ledger.length === 0) return null;
  const active = ledger.filter(r => r.status === 'active');
  const pool = active.length > 0 ? active : ledger;
  const overlapping = pool.filter(r => (r.domain_tags || []).some(t => tags.includes(t)));
  const candidates = overlapping.length > 0 ? overlapping : pool;
  return [...candidates].sort((a, b) => (b.strength || 0) - (a.strength || 0))[0];
}

// Deterministic path: rank the seeded content pool against the user's ledger,
// exactly as the shelf did before the curator existed. Used when Groq is absent
// or errored, so the dashboard degrades instead of emptying.
function buildFallbackItems(userId, day) {
  const ledgerRows = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status != 'purged'`).all(userId);
  const ranked = rankGrowth(userId, day);

  return ranked.map(item => {
    const itemTags = JSON.parse(item.tags);
    const matchingRow = ledgerRows.find(r => {
      try {
        return JSON.parse(r.domain_tags).some(t => itemTags.includes(t));
      } catch (e) {
        return false;
      }
    });

    return {
      contentId: item.id,
      persistContent: false,
      title: item.title,
      type: item.type,
      bucket: item.bucket,
      minutes: item.minutes,
      difficulty: item.difficulty,
      tags: itemTags,
      stance: item.stance,
      thumbnail_heat: item.thumbnail_heat,
      novelty: item.novelty,
      completion_condition: item.completion_condition,
      why_now: matchingRow
        ? `Because you said: "${matchingRow.claim}" (${matchingRow.id}).`
        : 'Because it challenges your current understanding.',
      cited_rows: matchingRow ? [matchingRow.id] : []
    };
  });
}

/**
 * Builds today's growth shelf for one user and persists it.
 *
 * Items are generated by Groq from the user's onboarding answers, ledger,
 * habits and artifacts, then written to content_items so the rest of the app
 * (scoring, proofs, artifacts) treats them like any other item.
 * Returns { items, source, shelf_note }.
 */
async function runCuratorAgent(userId, day, intervention = 'deliver') {
  const ctx = buildUserContext(userId, day);

  // Nothing said, nothing observed — there is nothing to personalize against.
  if (ctx.ledger.length === 0 && ctx.answers.length === 0) {
    return { items: persistShelf(userId, day, buildFallbackItems(userId, day)), source: 'fallback', shelf_note: null };
  }

  const stage = getStage(userId, day);
  const potential = getPotentialIndex(userId, day);

  const userPrompt = [
    formatUserContext(ctx, day),
    `\nStage: ${stage.stage} (${stage.explanation})`,
    `Potential index: ${potential}`,
    `Today's chosen intervention: ${intervention}`,
    '\nBuild today\'s 3-item shelf for this person.'
  ].join('\n');

  const response = await callLLM(CURATOR_SYSTEM_PROMPT, userPrompt, null);
  const generated = normalizeItems(response, ctx);

  if (generated.length === 0) {
    return { items: persistShelf(userId, day, buildFallbackItems(userId, day)), source: 'fallback', shelf_note: null };
  }

  const prepared = generated.map((item, slot) => ({
    ...item,
    contentId: `G${day}S${slot}U${userId}`,
    persistContent: true,
    // Curated items are chosen against the ledger, not engineered for clicks —
    // the attention terms that penalize bait content are zero by construction.
    thumbnail_heat: 0,
    novelty: 0.6
  }));

  return {
    items: persistShelf(userId, day, prepared),
    source: 'groq',
    shelf_note: cleanText(response?.shelf_note) || null
  };
}

// Writes generated items into content_items and (re)writes the day's growth
// deliveries, returning the rows in the shape /api/shelf serves.
function persistShelf(userId, day, items) {
  if (items.length === 0) return [];

  const activeRows = db.prepare(`SELECT * FROM ledger_rows WHERE user_id = ? AND status != 'purged'`).all(userId);
  const competences = getAllCompetences(userId, day);

  const upsertContent = db.prepare(`
    INSERT INTO content_items (id, title, url, source, bucket, type, minutes, difficulty, tags, stance, thumbnail_heat, novelty, completion_condition)
    VALUES (@id, @title, @url, @source, @bucket, @type, @minutes, @difficulty, @tags, @stance, @thumbnail_heat, @novelty, @completion_condition)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, bucket = excluded.bucket, type = excluded.type,
      minutes = excluded.minutes, difficulty = excluded.difficulty, tags = excluded.tags,
      stance = excluded.stance, completion_condition = excluded.completion_condition
  `);

  const insertDelivery = db.prepare(`
    INSERT INTO deliveries (user_id, day, item_id, ranker, slot, why_now, cited_rows, score, score_breakdown, opened, completed, dwell_minutes)
    VALUES (?, ?, ?, 'growth', ?, ?, ?, ?, ?, 0, 0, 0)
  `);

  const out = [];

  db.transaction(() => {
    db.prepare(`DELETE FROM deliveries WHERE user_id = ? AND day = ? AND ranker = 'growth'`).run(userId, day);

    items.forEach((item, slot) => {
      const tagsJson = JSON.stringify(item.tags);

      if (item.persistContent) {
        upsertContent.run({
          id: item.contentId,
          title: item.title,
          url: item.type === 'challenge' || item.type === 'mentor' || item.type === 'rest' ? `local:${item.type}` : '',
          source: 'Curated for you',
          bucket: item.bucket,
          type: item.type,
          minutes: item.minutes,
          difficulty: item.difficulty,
          tags: tagsJson,
          stance: item.stance,
          thumbnail_heat: item.thumbnail_heat ?? 0,
          novelty: item.novelty ?? 0.6,
          completion_condition: item.completion_condition || ''
        });
      }

      const { score, breakdown } = scoreItem(
        { tags: tagsJson, difficulty: item.difficulty, minutes: item.minutes, thumbnail_heat: item.thumbnail_heat ?? 0 },
        userId, day, activeRows, competences
      );

      const citedJson = JSON.stringify(item.cited_rows || []);
      const breakdownJson = JSON.stringify(breakdown);

      const inserted = insertDelivery.run(userId, day, item.contentId, slot, item.why_now, citedJson, score, breakdownJson);

      out.push({
        // The proof endpoint marks a delivery complete by row id, so the card
        // has to carry the delivery id, not just the content id.
        delivery_id: Number(inserted?.lastInsertRowid) || null,
        id: item.contentId,
        title: item.title,
        source: item.persistContent ? 'Curated for you' : 'The Shelf',
        bucket: item.bucket,
        type: item.type,
        minutes: item.minutes,
        difficulty: item.difficulty,
        tags: tagsJson,
        stance: item.stance,
        completion_condition: item.completion_condition || '',
        why_now: item.why_now,
        cited_rows: citedJson,
        score,
        score_breakdown: breakdownJson,
        opened: 0,
        completed: 0
      });
    });
  })();

  return out;
}

module.exports = { runCuratorAgent };
