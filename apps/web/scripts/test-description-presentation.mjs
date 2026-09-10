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
assert.equal(
  presented.text,
  'Située dans un environnement calme: salon lumineux; 04 chambres; Loyer: 1.600.000 FCFA;',
  'la description complète doit rester intacte après nettoyage public',
)
assert.deepEqual(presented.blocks, [
  'Située dans un environnement calme: salon lumineux;',
  '04 chambres;',
  'Loyer: 1.600.000 FCFA;',
])

const amount = presentDescription('Villa disponible. Composition: séjour; jardin; Montant: 45.000.000 FCFA')
assert.equal(amount.text, 'Villa disponible. Composition: séjour; jardin; Montant: 45.000.000 FCFA')
assert.deepEqual(amount.blocks, [
  'Villa disponible. Composition: séjour;',
  'jardin;',
  'Montant: 45.000.000 FCFA',
])

const unmarked = presentDescription('Appartement agréable\nCuisine équipée\nTerrasse')
assert.equal(unmarked.text, 'Appartement agréable\nCuisine équipée\nTerrasse')
assert.deepEqual(unmarked.blocks, ['Appartement agréable', 'Cuisine équipée', 'Terrasse'])

const original = 'Texte source #Cocody +225 0700000000'
publicDescription(original)
assert.equal(original, 'Texte source #Cocody +225 0700000000')

console.log('description presentation: ok')
