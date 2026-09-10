const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3.7-flash';

async function test() {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://immodash.ci",
      "X-Title": "ImmoDash Pro",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'user', content: 'hello' }
      ],
    })
  });

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);
}

test();
