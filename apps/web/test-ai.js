const OPENROUTER_API_KEY = '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';
const MODEL = 'google/gemma-4-26b-a4b-it:free';

async function test() {
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
