
const WASSENDER_API_KEY = process.env.WASSENDER_API_KEY || '5bad69e29793e748f2fea9043435cd4844aadd6b0947b650b2efb82c86c34017';
const BASE_URL = 'https://www.wasenderapi.com/api';

async function checkStatus() {
  const url = `${BASE_URL}/status`;
  const headers = {
    'Authorization': `Bearer ${WASSENDER_API_KEY}`,
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    console.log('Wasender Status:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Wasender Status Check Failed:', err);
  }
}

checkStatus();
