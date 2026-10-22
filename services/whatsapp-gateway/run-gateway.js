import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = 5685;

// Vérifier si la passerelle tourne déjà sur le port 5685
const tester = createServer();
tester.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Bogbes Gateway] Le port ${PORT} est déjà actif. Une instance tourne déjà.`);
    process.exit(0);
  } else {
    console.error('[Bogbes Gateway] Erreur test port:', err);
  }
});

tester.once('listening', () => {
  tester.close(() => {
    startGateway();
  });
});

tester.listen(PORT, '127.0.0.1');

async function startGateway() {
  const rootDir = 'C:/Users/WILFRIED/OneDrive - Gravel Ivoire/Bureau/immo';
  process.env.PORT = '5685';
  process.env.AUTH_DIR = resolve(rootDir, 'scratch/wa_auth');
  process.env.WEBHOOK_URL = 'https://www.bogbesgroup.com/api/whatsapp/webhook';
  process.env.WEBHOOK_SECRET = 'a8271744c3bba421d49850cd785ff068';
  process.env.N8N_SCRAPER_URL = 'https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier';

  console.log(`[Bogbes Gateway] Démarrage de la passerelle WhatsApp (0 FCFA)...`);
  console.log(`[Bogbes Gateway] Dossier session : ${process.env.AUTH_DIR}`);
  console.log(`[Bogbes Gateway] Destination scraping : ${process.env.N8N_SCRAPER_URL}`);

  try {
    const gatewayPath = resolve(rootDir, 'scratch/hf-n8n-test/wa-gateway/gateway.js');
    const gatewayUrl = pathToFileURL(gatewayPath).href;
    await import(gatewayUrl);
  } catch (err) {
    console.error('[Bogbes Gateway] Erreur critique lors du chargement de la passerelle:', err);
  }
}
