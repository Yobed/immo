import assert from 'node:assert/strict'
import { presentDescription } from '../lib/catalogue/description-presentation.ts'
import { publicDescription } from '../lib/catalogue/public-description.ts'

const source = 'Située dans un environnement calme : salon lumineux; 04 chambres; Loyer: 1.600.000 FCFA; #Abidjan https://example.com +225 07 00 00 00 00'
const clean = publicDescription(source)

assert.ok(clean)
assert.equal(clean.includes('#'), false, 'les hashtags ne doivent pas être publics')
assert.equal(clean.includes('https://'), false, 'les URLs doivent être retirées')
assert.equal(clean.includes('+225'), false, 'les numéros doivent être retirés')
assert.equal(clean.includes('[contact retiré]'), false, 'les placeholders techniques sont interdits')

const presented = presentDescription(source)
assert.equal(presented.note, 'Loyer: 1.600.000 FCFA')
assert.deepEqual(presented.highlights, ['salon lumineux', '04 chambres'])
assert.equal(presented.intro, 'Située dans un environnement calme')

const amount = presentDescription('Villa disponible. Composition: séjour; jardin; Montant: 45.000.000 FCFA')
assert.equal(amount.note, 'Montant: 45.000.000 FCFA')
assert.equal((amount.note.match(/Montant/gi) ?? []).length, 1)

const unmarked = presentDescription('Appartement agréable\nCuisine équipée\nTerrasse')
assert.equal(unmarked.intro, 'Appartement agréable')
assert.deepEqual(unmarked.highlights, ['Cuisine équipée', 'Terrasse'])

const original = 'Texte source #Cocody +225 0700000000'
publicDescription(original)
assert.equal(original, 'Texte source #Cocody +225 0700000000')

console.log('description presentation: ok')
