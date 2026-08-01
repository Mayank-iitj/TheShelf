// The tag vocabulary the content pool is built from (see seed/generateItems.js).
// Ranking, competence and content matching all key off these exact strings, so a
// free-form tag from the LLM — "postgres", "performance" — silently scores zero
// relevance. Everything the model produces is mapped back into this vocabulary.
const TAG_KEYWORDS = {
  'http': ['http', 'web server', 'request', 'protocol', 'rest api'],
  'security': ['security', 'auth', 'vulnerab', 'exploit', 'encrypt', 'crypto'],
  'databases': ['database', 'db', 'postgres', 'mysql', 'mongo', 'sqlite', 'schema', 'transaction', 'acid'],
  'sql': ['sql', 'query', 'queries', 'join', 'explain'],
  'indexing': ['index', 'search', 'b-tree', 'btree'],
  'caching': ['cache', 'caching', 'redis', 'memcach'],
  'concurrency': ['concurren', 'thread', 'async', 'parallel', 'lock', 'race condition'],
  'distributed-systems': ['distributed', 'microservice', 'cluster', 'consensus', 'replica', 'shard', 'scale', 'scalab'],
  'systems-thinking': ['systems', 'architecture', 'design pattern', 'internals', 'tradeoff', 'performance'],
  'deployment': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'infra', 'devops'],
  'api-design': ['api', 'rest', 'graphql', 'endpoint', 'interface'],
  'debugging': ['debug', 'bug', 'incident', 'troubleshoot', 'profil', 'root cause'],
  'observability': ['observab', 'logging', 'metrics', 'monitor', 'tracing', 'telemetry'],
  'testing': ['test', 'qa', 'coverage'],
  'career': ['career', 'job', 'company', 'engineer', 'role', 'promotion', 'team', 'ship', 'shipping'],
  'communication': ['communicat', 'writing', 'essay', 'talk', 'present', 'document'],
  'learning-how-to-learn': ['learn', 'study', 'read', 'practice', 'habit', 'focus'],
  'burnout': ['burnout', 'tired', 'exhaust', 'overwhelm', 'rest', 'stress']
};

const VOCAB = Object.keys(TAG_KEYWORDS);

// Pulls known tags out of free text by keyword match.
function extractTags(text, fallbackTags = []) {
  const lower = (text || '').toLowerCase();
  const found = VOCAB.filter(tag => TAG_KEYWORDS[tag].some(kw => lower.includes(kw)));
  return found.length > 0 ? found.slice(0, 3) : fallbackTags;
}

/**
 * Maps whatever tags the model produced into the content vocabulary.
 * A tag already in the vocabulary is kept; anything else is matched by keyword
 * (so "postgres" becomes "databases"); if nothing survives, the tags are
 * re-derived from the surrounding text so the row still connects to content.
 */
function normalizeTags(tags, contextText = '', fallbackTags = ['learning-how-to-learn']) {
  const input = Array.isArray(tags) ? tags : [];
  const mapped = [];

  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const tag = raw.toLowerCase().trim();
    if (VOCAB.includes(tag)) {
      mapped.push(tag);
    } else {
      mapped.push(...extractTags(tag, []));
    }
  }

  const unique = [...new Set(mapped)];
  if (unique.length > 0) return unique.slice(0, 3);

  const derived = extractTags(contextText, []);
  return derived.length > 0 ? derived.slice(0, 3) : fallbackTags;
}

module.exports = { TAG_KEYWORDS, VOCAB, extractTags, normalizeTags };
