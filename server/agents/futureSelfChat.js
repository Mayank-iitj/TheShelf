const Groq = require('groq-sdk');
const { db } = require('../db');

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Deterministic fallback so the chat never visibly breaks live, even without
// a live Groq call — mirrors the pattern used by the onboarding/daily agents.
function buildFallbackReply(portrait, markers) {
  const notYet = (markers || []).filter(m => m.status === 'not_yet');
  const target = notYet[0] || (markers || [])[0];
  if (target) {
    return `I'm still working on it too — "${target.marker}" isn't done yet. What matters is whether today moved you toward it or away from it.`;
  }
  return `${portrait || "I'm the version of you that kept going."} Ask me something more specific and I'll actually engage with it.`;
}

async function runFutureSelfChat({ message, history, portrait, markers, ledgerRows }) {
  const fallback = buildFallbackReply(portrait, markers);

  if (!groq) {
    return { reply: fallback };
  }

  const markerLines = (markers || [])
    .map(m => `- [${m.status}] ${m.marker}`)
    .join('\n');
  const ledgerLines = (ledgerRows || [])
    .map(r => `- (${r.id}, ${r.kind}, strength ${r.strength}) ${r.claim}`)
    .join('\n');

  const systemPrompt = `
You are roleplaying AS the user's own future self — the person they described becoming.
Speak in first person, as them, from that vantage point. Never say "as your future self" or
break character. Be specific and grounded in the real data below — never generic motivational
filler. It is fine, and often correct, to be honest about what still isn't done.

Your portrait (who you are, as described in onboarding):
"${portrait || 'unspecified'}"

Your markers (milestones on the way to becoming this):
${markerLines || '(none yet)'}

The user's current identity ledger (their stated aspirations/competencies/tensions today):
${ledgerLines || '(none yet)'}

Keep replies to 2-4 sentences. Reference a real marker or ledger row when relevant. Do not
invent facts about the user that aren't in the data above.
`.trim();

  const historyText = (history || [])
    .slice(-6)
    .map(h => `${h.role === 'user' ? 'User' : 'You'}: ${h.content}`)
    .join('\n');

  const userPrompt = `${historyText ? historyText + '\n' : ''}User: ${message}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 220
    });
    const reply = response.choices?.[0]?.message?.content?.trim();
    return { reply: reply || fallback };
  } catch (err) {
    console.error('Future Self chat call failed, using fallback:', err.message);
    return { reply: fallback };
  }
}

module.exports = { runFutureSelfChat };
