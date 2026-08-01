require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const Groq = require('groq-sdk');

console.log("GROQ_API_KEY in process.env:", process.env.GROQ_API_KEY);

if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY is not defined in process.env");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    console.log("SUCCESS:", chatCompletion.choices[0].message.content);
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

main();
