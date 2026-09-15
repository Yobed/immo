import assert from 'node:assert/strict'

import {
  getN8nScraperWebhookUrl,
  shouldForwardGroupMessageToScraper,
} from '../lib/wasender-scraper-forward.ts'

assert.equal(
  shouldForwardGroupMessageToScraper('messages-group.received', '120363287041460977@g.us', false),
  true,
)
assert.equal(
  shouldForwardGroupMessageToScraper('messages.received', '120363287041460977@g.us', false),
  true,
)
assert.equal(
  shouldForwardGroupMessageToScraper('messages.received', '2250102030405@s.whatsapp.net', false),
  false,
)
assert.equal(
  shouldForwardGroupMessageToScraper('messages.upsert', '120363287041460977@g.us', false),
  false,
)
assert.equal(
  shouldForwardGroupMessageToScraper('messages-group.received', '2250102030405@s.whatsapp.net', false),
  false,
)
assert.equal(
  shouldForwardGroupMessageToScraper('messages-group.received', '120363287041460977@g.us', true),
  false,
)

assert.equal(
  getN8nScraperWebhookUrl('https://automation.example.com/webhook/immo'),
  'https://automation.example.com/webhook/immo',
)
assert.equal(
  getN8nScraperWebhookUrl('http://automation.example.com/webhook/immo'),
  null,
)

console.log('Wasender group scraper forwarding policy: OK')
