import assert from 'node:assert/strict'
import { publicDescription } from '../apps/web/lib/catalogue/public-description.ts'

assert.equal(
  publicDescription('<p style="color:red">Belle villa <strong>meublée</strong></p>'),
  'Belle villa meublée',
)
assert.equal(
  publicDescription('Appelez le +225 07 08 09 10 11 ou écrivez à proprio@example.com — https://example.com/annonce'),
  'Appelez le [contact retiré] ou écrivez à [contact retiré] — [lien retiré]',
)
assert.equal(publicDescription('WhatsApp : 05-01-02-03-04. Prix : 65 000 000 FCFA.'), 'WhatsApp : [contact retiré]. Prix : 65 000 000 FCFA.')
assert.equal(publicDescription('<script>alert(1)</script>   '), null)
assert.equal(publicDescription(12), null)

console.log('Public descriptions: HTML and direct owner contacts are removed.')
