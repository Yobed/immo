import assert from 'node:assert/strict';
import { parseSearchQuery } from '../lib/searchParser.ts';
import { qualify, buildQualifReminder, detectTransaction } from '../lib/ai/qualification.ts';

console.log('--- TEST 1 : Parser Shorthands & Aliases ---');
const p1 = parseSearchQuery('de 4 pièces avec une grande cour');
console.log('p1:', p1);
assert.equal(p1.type_bien, 'villa', 'cour -> villa');

const p2 = parseSearchQuery('Au alentours de Abidjan');
console.log('p2:', p2);
assert.equal(p2.commune, "Périphérie d'Abidjan", 'alentours abidjan -> peripherie');

const p3 = parseSearchQuery('250');
console.log('p3:', p3);
assert.equal(p3.prix_max, '250000', '250 -> 250000');

const p4 = parseSearchQuery('mon budget c’est 250');
console.log('p4:', p4);
assert.equal(p4.prix_max, '250000', 'budget 250 -> 250000');
console.log('✓ Test 1 validé');

console.log('--- TEST 2 : Inférence Transaction (Location vs Vente) ---');
const qTrans1 = detectTransaction('villa 4 pièces', 250000, 'villa');
assert.equal(qTrans1, 'location', 'Budget <= 5M sans mot-clé achat infère location');

const qTrans2 = detectTransaction('villa à vendre', 250000, 'villa');
assert.equal(qTrans2, 'achat', 'Mot-clé à vendre prime');

const qTrans3 = detectTransaction('terrain 500m2', 3000000, 'terrain');
assert.equal(qTrans3, null, 'Terrain avec budget <= 5M ne force pas location');
console.log('✓ Test 2 validé');

console.log('--- TEST 3 : Qualification multi-messages Sapphire ---');
// Simulation de l'échange réel du screenshot :
// 1. "de 4 pièces avec une grande cour"
// 2. "Au alentours de Abidjan"
// 3. "250"
const qual1 = qualify('de 4 pièces avec une grande cour');
assert.equal(qual1.propertyType, 'villa');
assert.equal(qual1.zone, null);
assert.equal(qual1.budget, null);
assert.equal(qual1.hasAll3, false);

const qual2 = qualify('Au alentours de Abidjan', [
  { role: 'user', content: 'de 4 pièces avec une grande cour' },
  { role: 'assistant', content: 'Message' },
]);
assert.equal(qual2.propertyType, 'villa');
assert.equal(qual2.zone, "Périphérie d'Abidjan");
assert.equal(qual2.budget, null);
assert.equal(qual2.hasAll3, false);

const qual3 = qualify('250', [
  { role: 'user', content: 'de 4 pièces avec une grande cour' },
  { role: 'assistant', content: 'Message' },
  { role: 'user', content: 'Au alentours de Abidjan' },
  { role: 'assistant', content: 'Message' },
]);
assert.equal(qual3.propertyType, 'villa');
assert.equal(qual3.zone, "Périphérie d'Abidjan");
assert.equal(qual3.budget, 250000);
assert.equal(qual3.transaction, 'location');
assert.equal(qual3.hasAll3, true);
console.log('✓ Test 3 validé');

console.log('--- TEST 4 : Relance humanisée avec accusé de réception ---');
const reminderWithKnown = buildQualifReminder(['zone', 'budget'], { propertyType: 'villa' });
console.log('Reminder preview:\n' + reminderWithKnown);
assert.ok(reminderWithKnown.includes('villa'), 'Accuse réception de la villa');
assert.ok(reminderWithKnown.includes('Pour que je puisse vous proposer les biens les plus adaptés'), 'Garde le marqueur strict');
assert.ok(reminderWithKnown.includes('zone'), 'Demande la zone');
assert.ok(reminderWithKnown.includes('budget'), 'Demande le budget');

const reminderNoKnown = buildQualifReminder(['type', 'zone', 'budget']);
assert.ok(!reminderNoKnown.includes("C'est bien noté"), 'Pas d accusé si rien de connu');
assert.ok(reminderNoKnown.includes('Pour que je puisse vous proposer les biens les plus adaptés'), 'Garde le marqueur strict');
console.log('✓ Test 4 validé');

console.log('\n========================================================');
console.log('TOUS LES TESTS DU MOTEUR DE QUALIFICATION SONT VALIDÉS !');
console.log('========================================================');
