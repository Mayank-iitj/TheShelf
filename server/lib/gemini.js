const { GoogleGenAI } = require('@google/genai');

let genai = null;
if (process.env.GEMINI_API_KEY) {
  genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Calls Gemini with Google Search grounding enabled, expecting a JSON object
 * back inside the model's text response.
 *
 * Deliberately does NOT set responseMimeType/responseSchema: several Gemini
 * API versions don't support combining tool use (search grounding) with
 * strict structured-output mode in the same call. Same workaround llm.js
 * already uses for markdown fences: instruct via system prompt to return
 * ONLY JSON, then parse defensively. On ANY failure (no key, network error,
 * malformed JSON) this returns the caller-supplied fallback and never throws.
 */
async function callGeminiWithGrounding(systemPrompt, userPrompt, fallback) {
  if (!genai) {
    console.warn("No GEMINI_API_KEY provided. Using deterministic fallback.");
    return fallback;
  }

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const text = response.text;
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error("Gemini call failed, using deterministic fallback:", err.message);
    return fallback;
  }
}

module.exports = { callGeminiWithGrounding };
