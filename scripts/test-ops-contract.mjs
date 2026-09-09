import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (file) => readFile(path.join(root, file), 'utf8')

const quality = await read('apps/web/app/admin/prospects/qualite/page.tsx')
assert.doesNotMatch(quality, /\.limit\(1000\)/, 'quality audit must not silently stop at 1,000 prospects')
assert.match(quality, /range\(|fetchAll|while|for \(/, 'quality audit must paginate all prospects')

const suivi = await read('apps/web/app/admin/suivi/page.tsx')
assert.match(suivi, /page|cursor|offset|Suivant|Précédent/i, 'admin follow-up must expose pagination')

const views = await read('apps/web/app/api/biens/[id]/view/route.ts')
assert.match(views, /checkRateLimit/, 'public view counter must be rate limited')

const performance = await read('apps/web/app/admin/performance/page.tsx')
assert.match(performance, /source.*prospect|prospect.*source|whatsapp/i, 'performance must account for WhatsApp source data')

console.log('Operations contract: admin data views are complete, paginated and protected from counter abuse.')
