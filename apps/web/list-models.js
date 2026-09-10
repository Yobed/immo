const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function listModels() {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    }
  });

  const data = await response.json();
  const gemmaModels = data.data.filter(m => m.id.includes('gemma') && m.id.includes(':free'));
  console.log(JSON.stringify(gemmaModels, null, 2));
}

listModels();
