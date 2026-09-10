import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const routePath = resolve(process.cwd(), 'app/api/whatsapp/webhook/route.ts');
const source = await readFile(routePath, 'utf8');

for (const event of ['messages.upsert', 'messages.received', 'messages-group.received']) {
  if (!source.includes(`'${event}'`)) {
    throw new Error(`Webhook route no longer accepts Wasender event ${event}`);
  }
}

if (!source.includes('inboundMessageEvents.has(normalizedEvent)')) {
  throw new Error('Webhook route must gate events through the inbound message allowlist');
}

console.log('Wasender inbound event contract: OK');
