export default async () => {
  try {
    const [waRes, n8nRes] = await Promise.allSettled([
      fetch('https://bogbes-whatsapp-gateway.onrender.com/status', {
        headers: { 'User-Agent': 'Netlify-AntiSleep-Watchdog/1.0' },
        signal: AbortSignal.timeout(15000),
      }),
      fetch('https://kassio1-n8n-free.hf.space/healthz', {
        headers: { 'User-Agent': 'Netlify-AntiSleep-Watchdog/1.0' },
        signal: AbortSignal.timeout(15000),
      }),
    ]);

    const waOk = waRes.status === 'fulfilled' && waRes.value.ok;
    const n8nOk = n8nRes.status === 'fulfilled' && n8nRes.value.ok;

    console.log(`[Anti-Sleep Ping] WhatsApp Render: ${waOk ? 'OK' : 'ERR'}, n8n HF Space: ${n8nOk ? 'OK' : 'ERR'}`);

    return new Response(
      JSON.stringify({
        ok: true,
        whatsapp_gateway: waOk,
        n8n_scraper: n8nOk,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Anti-Sleep Ping] Error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
};

export const config = {
  schedule: '@every 5m',
};
