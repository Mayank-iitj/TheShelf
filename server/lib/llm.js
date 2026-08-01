const Groq = require('groq-sdk');

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

/**
 * Calls Groq with the given prompt and system instructions.
 * Requires the output to be JSON.
 */
async function callLLM(systemPrompt, userPrompt, fallback) {
  if (!groq) {
    console.warn("No GROQ_API_KEY provided. Using deterministic fallback.");
    return fallback;
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content;
    
    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error("LLM call failed, using deterministic fallback:", err.message);
    return fallback;
  }
}

module.exports = { callLLM };
