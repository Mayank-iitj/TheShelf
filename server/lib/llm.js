const Anthropic = require('@anthropic-ai/sdk');

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Calls Anthropic Claude with the given prompt and system instructions.
 * Requires the output to be JSON.
 */
async function callLLM(systemPrompt, userPrompt, fallback) {
  if (!anthropic) {
    console.warn("No ANTHROPIC_API_KEY provided. Using deterministic fallback.");
    return fallback;
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    });

    const text = response.content[0].text;
    
    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error("LLM call failed, using deterministic fallback:", err.message);
    return fallback;
  }
}

module.exports = { callLLM };
