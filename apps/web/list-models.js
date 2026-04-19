const OPENROUTER_API_KEY = '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';

async function listModels() {
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
