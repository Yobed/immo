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

console.log('--- TEST 5 : Cas réel prospect b20dae3c (Maman De Néroi) ---');
// 1. "Apparemment deux pièces" (faute de frappe mobile pour "Appartement deux pièces")
const pApparemment = parseSearchQuery('Apparemment deux pièces');
assert.equal(pApparemment.type_bien, 'appartement', '"Apparemment deux pièces" -> appartement');

// 2. "Excusez est ce que je peux avoir une deux pièces de 90 mill"
const p90mill = parseSearchQuery('Excusez est ce que je peux avoir une deux pièces de 90 mill');
assert.equal(p90mill.type_bien, 'appartement', '"une deux pièces" -> appartement');
assert.equal(p90mill.prix_max, '90000', '"90 mill" -> 90000');

// 3. "Aboboté" ne doit JAMAIS matcher la commune "Abobo" (rattaché à Cocody)
const pAbobote = parseSearchQuery('Aboboté');
assert.equal(pAbobote.commune, 'Cocody', '"Aboboté" -> Cocody (jamais Abobo)');
const qAbobote = qualify('Aboboté');
assert.equal(qAbobote.zone, 'Cocody', '"Aboboté" qualifié sur Cocody');

// 4. "Belle ville" reconnu comme quartier
const qBelleville = qualify('Belle ville');
assert.equal(qBelleville.zone, 'Belle ville', '"Belle ville" reconnu comme quartier');

// 5. Qualification complète dès le 3e message de Maman De Néroi (Zone -> Type -> Budget)
const qMaman = qualify('Et mon budget c’est maximum est de 80000', [
  { role: 'user', content: 'Angrée château , angrée deux plateaux,' },
  { role: 'assistant', content: 'Relance' },
  { role: 'user', content: 'Apparemment deux pièces' },
]);
assert.equal(qMaman.propertyType, 'appartement');
assert.equal(qMaman.zone, 'Angré');
assert.equal(qMaman.budget, 80000);
assert.equal(qMaman.transaction, 'location');
assert.equal(qMaman.hasAll3, true);
console.log('✓ Test 5 validé');

console.log('--- TEST 6 : Cas réel Screenshot 1 (Pasteur Gboto Christophe) ---');
// Message 1 : "Loyer 4 pièces 200 à 250 Faya \n\nBonjour ! Puis-je en savoir plus à ce sujet ?"
const qGboto1 = qualify('Loyer 4 pièces 200 à 250 Faya \n\nBonjour ! Puis-je en savoir plus à ce sujet ?');
assert.equal(qGboto1.transaction, 'location');
assert.equal(qGboto1.propertyType, 'appartement');
assert.equal(qGboto1.nbPieces, 4);
assert.equal(qGboto1.zone, 'Faya');
assert.equal(qGboto1.budget, 250000);
assert.equal(qGboto1.hasAll3, true, 'Qualifié dès le 1er message complet');

// Message 2 & 3 : "Une petite villa basse ou maison basse" puis "Zone Faya cocody centre Riviera golf Riviera 2 palmeraie"
const t0 = new Date('2026-08-19T06:09:49Z').toISOString(); // vieux message de 37 jours (doit être coupé !)
const t1 = new Date('2026-09-25T23:47:20Z').toISOString();
const t2 = new Date('2026-09-25T23:49:08Z').toISOString();
const t3 = new Date('2026-09-25T23:51:53Z').toISOString();
const qGboto3 = qualify(
  'Zone Faya cocody centre Riviera golf Riviera 2 palmeraie',
  [
    { role: 'user', content: 'Ancien message août', created_at: t0 },
    { role: 'user', content: 'Loyer 4 pièces 200 à 250 Faya', created_at: t1 },
    { role: 'user', content: 'Une petite villa basse ou maison basse', created_at: t2 },
    { role: 'user', content: 'Zone Faya cocody centre Riviera golf Riviera 2 palmeraie', created_at: t3 },
  ],
  { isNewSession: false },
);
assert.equal(qGboto3.propertyType, 'villa', 'Retient "villa basse / maison basse" du message précédent');
assert.equal(qGboto3.zone, 'Cocody', 'Retient la zone Cocody / Faya');
assert.equal(qGboto3.budget, 250000, 'Retient le budget 250 000 FCFA');
assert.equal(qGboto3.hasAll3, true, 'Qualifié sans redemander le type de bien');
console.log('✓ Test 6 validé');

console.log('--- TEST 7 : Cas réel Screenshot 2 (Keita Mahoua - 2pieces a Yopougon maroc) ---');
const qKeita = qualify('Bonjour je veux 2pieces a Yopougon maroc');
assert.equal(qKeita.propertyType, 'appartement', '"2pieces" sans espace -> appartement');
assert.equal(qKeita.nbPieces, 2, '"2pieces" -> nbPieces = 2');
assert.equal(qKeita.zone, 'Yopougon', '"Yopougon maroc" -> Yopougon');
assert.equal(qKeita.budget, null, 'Pas de budget fourni');
assert.equal(qKeita.hasAll3, false, 'Doit bloquer en qualification (budget manquant)');
assert.deepEqual(qKeita.missing, ['budget'], 'Seul le budget manque');
const reminderKeita = buildQualifReminder(qKeita.missing, {
  propertyType: qKeita.propertyType,
  zone: qKeita.zone,
  budget: qKeita.budget,
});
assert.ok(
  reminderKeita.includes("C'est bien noté pour votre recherche de *appartement* dans le secteur de *Yopougon*"),
  'Français fluide sans "pour dans le secteur de"',
);
console.log('✓ Test 7 validé');

console.log('\n========================================================');
console.log('TOUS LES TESTS DU MOTEUR DE QUALIFICATION SONT VALIDÉS !');
console.log('========================================================');
