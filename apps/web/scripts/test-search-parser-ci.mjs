import assert from 'node:assert/strict';
import { parseSearchQuery } from '../lib/searchParser.ts';
import { qualify, buildQualifReminder, detectTransaction, isListingOrPartnerOffer, isClientSearchIntent } from '../lib/ai/qualification.ts';

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

console.log('--- TEST 8 : Cas réels audit 60 conversations prospects ---');
// 1. Chamberlain Akereni : "2 plateaux" / "2 plateau" ne doit JAMAIS matcher la commune "Plateau"
const qChamberlain = qualify("Pourriez vous m'orienter sur une maison au 2 plateaux 2 pièces");
assert.notEqual(qChamberlain.zone, 'Plateau', '"2 plateaux" ne doit jamais matcher Plateau');
assert.equal(qChamberlain.zone, '2 plateaux', '"2 plateaux" reconnu comme quartier de Cocody');

const p2PlateauSingulier = parseSearchQuery('studio au 2 plateau');
assert.notEqual(p2PlateauSingulier.commune, 'Plateau', '"2 plateau" au singulier ne doit jamais matcher Plateau');

// 2. tontonkouamy : "dans la commune de Cocody : deux plateaux, aghien" -> Cocody (jamais Plateau)
const pTonton = parseSearchQuery('dans la commune de Cocody : deux plateaux, aghien');
assert.equal(pTonton.commune, 'Cocody', 'Cocody prime et deux plateaux ne matche pas Plateau');

// 3. Interconfimo Commercial : numéro de téléphone "0574176868" ne doit JAMAIS écraser le budget "500 000 FCFA"
const pInterconfimo = parseSearchQuery('💰 Budget : 450 000 à 500 000 FCFA / mois. Contactez nous au :0574176868');
assert.equal(pInterconfimo.prix_max, '500000', 'Le numéro 0574176868 est ignoré, budget = 500000');

// 4. Tyga : "J'ai un terrain de 1000m² à Assini que je veux vendre" après WELCOME_MESSAGE
const msgTyga = "J'ai un terrain de 1000m² à Assini que je veux vendre";
assert.equal(isListingOrPartnerOffer(msgTyga, true), true, 'Détecté comme offre vendeur même après WELCOME_MESSAGE');
const pTyga = parseSearchQuery(msgTyga);
assert.equal(pTyga.prix_max, undefined, '"1000m²" ne doit pas être lu comme un budget de 1000 FCFA');

// 5. rollins 01flan : annonce démarcheur avec commission après relance qualification
const msgRollins = 'Riviera palmeraie rosier programme2 une villa duplex de 5pieces 700milles 5mois Commission 40% bureau comme habitation';
assert.equal(isListingOrPartnerOffer(msgRollins, true), true, 'Annonce avec Commission 40% détectée même après relance');

// 6. al : URL avec UUID "17b41636-..." ne doit pas écraser le prix "(30 000 FCFA/mois)"
const pAl = parseSearchQuery("Bonjour, je souhaite plus d'infos sur Studio meublé Marcory (30 000 FCFA/mois) https://www.bogbesgroup.com/biens/17b41636-3b3b-4580-a0a7-7fc98c84a97c");
assert.equal(pAl.prix_max, '30000', 'Les chiffres dans l UUID de l URL sont ignorés');

// 7. Keita Mahoua : "70.000 x 4 = 300.000" -> garde le loyer mensuel 70 000 FCFA, pas la caution multipliée 300 000
const pKeitaCaution = parseSearchQuery('70.000 x 4 = 300.000');
assert.equal(pKeitaCaution.prix_max, '70000', 'Multiplication de caution x 4 ignorée au profit du loyer mensuel');

// 8. kouamealexander120 : "Yopougon Nouveau bureau" est un quartier de Yopougon, pas un type_bien "bureau"
const pNouveauBureau = parseSearchQuery('Yopougon Nouveau bureau');
assert.equal(pNouveauBureau.type_bien, undefined, '"Nouveau bureau" ne force pas type_bien = bureau');
assert.equal(pNouveauBureau.commune, 'Yopougon', '"Yopougon Nouveau bureau" -> commune Yopougon');

// 9. Tima : "WILLIAMSVILLE" reconnu comme zone
const qTima = qualify('WILLIAMSVILLE');
assert.equal(qTima.zone, 'Williamsville', '"WILLIAMSVILLE" reconnu comme quartier');

// 10. Thread #1 (Jean Bedel) : "300 milles" (avec 's') et "Budjet" (avec 'j')
const qJeanBedel = qualify('Je veux une maison basse 4 pièces a Cocody riviera 2 Budjet 300 milles');
assert.equal(qJeanBedel.propertyType, 'villa', '"maison basse 4 pièces" -> villa');
assert.equal(qJeanBedel.zone, 'Cocody', '"Cocody riviera 2" -> Cocody');
assert.equal(qJeanBedel.budget, 300000, '"Budjet 300 milles" -> 300000');
assert.equal(qJeanBedel.hasAll3, true, 'Qualifié dès le 1er message');

// 11. Thread #10 (Fatima) : "3pices" (faute de frappe sans 'è')
const qFatima = qualify('Maison basse de 3pices ou 4 pièces à yopougon');
assert.equal(qFatima.propertyType, 'villa', '"Maison basse de 3pices" -> villa');
assert.equal(qFatima.nbPieces, 3, '"3pices" -> 3 pièces');

// 12. Thread #18 (Bamba) & Thread #62 (Elvis) : "taux de bail : 250 000" et "coût 100000"
const qBamba = qualify('À louer, magasin, Abobo, taux de bail : 250 000 f / mois');
assert.equal(qBamba.budget, 250000, '"taux de bail : 250 000 f" -> 250000');
const qElvis = qualify('En location maison de trois pièces Yopougon coût 100000');
assert.equal(qElvis.budget, 100000, '"coût 100000" -> 100000');
assert.equal(qElvis.hasAll3, true, 'Qualifié avec "coût 100000"');

// 13. Thread #36 (Constantin) & Thread #52 (Estelle) : réponse commençant par "À louer..." ne doit JAMAIS être classée comme offre partenaire
assert.equal(
  isListingOrPartnerOffer('À louer dans un premier temps', true),
  false,
  '"À louer dans un premier temps" est une réponse prospect, pas une annonce propriétaire',
);
assert.equal(
  isListingOrPartnerOffer('A louer \n Budget 180 000 (4 pièces)\n Ou 140 000 (3 pièces)\n Zone angré', true),
  false,
  '"A louer Budget 180 000..." est une réponse prospect, pas une annonce propriétaire',
);

// 14. Nouveaux quartiers détectés dans les discussions réelles (Bounoumin, Djibi, Siporex, Abobodoumé)
assert.equal(qualify('Riviera Bounoumin').zone, 'Riviera bonoumin', 'Riviera Bounoumin détecté');
assert.equal(qualify('Bounoumin').zone, 'Bonoumin', 'Bounoumin détecté');
assert.equal(qualify('Angré Djibi').zone, 'Angré', 'Angré Djibi détecté');
assert.equal(qualify('Siporex').zone, 'Siporex', 'Siporex détecté');
console.log('✓ Test 8 validé');

console.log('\n--- TEST 9 : Cas réels issus de l\'audit complet des 358 prospects & 4000 messages ---');
// 1. DZ : "les studios de 50 60 65 70" ne doit JAMAIS concaténer en 50 606 570 FCFA !
const qDZ = qualify('Est ce que vous trouvez les studios de 50 60 65 70 pour les gens à Yopougon');
assert.equal(qDZ.budget, 70000, '"50 60 65 70" -> 70 000 FCFA (et non 50 606 570)');

// 2. Oknel Assou : "De 80 90 100 120" -> 120 000 FCFA
const qOknel = qualify('De 80 90 100 120');
assert.equal(qOknel.budget, 120000, '"De 80 90 100 120" -> 120 000 FCFA');

// 3. Rachelle Bissou : "carrefour terminus 42 100.000f ko" -> "terminus 42" ignoré, budget = 100 000 FCFA
const qRachelle = qualify('Je veux à angré non loin du carrefour terminus 42 100.000f ko');
assert.equal(qRachelle.budget, 100000, '"terminus 42 100.000f" -> 100 000 FCFA (et non 42 100 000)');
assert.equal(qRachelle.zone, 'Angré', 'Zone Angré détectée');

// 4. Tra Lou : "budget 35 000 000 casch" -> 35 000 000 (et non "budget 35" = 35 000)
const qTraLou = qualify('Je veux une maison à acheter à Marcory budget 35 000 000 casch');
assert.equal(qTraLou.budget, 35000000, '"budget 35 000 000" -> 35 000 000 FCFA');
assert.equal(qTraLou.transaction, 'achat', 'Transaction achat');

// 5. VICTOIRE ABSOLUE & Grizz K'win : "1 milliard" / "900 millions à 1 milliards"
const qVictoire = qualify('Superficie 1000 à 1500 m2 Budget du client 1 milliard au Plateau');
assert.equal(qVictoire.budget, 1000000000, '"1 milliard" -> 1 000 000 000 FCFA');
const qGrizz = qualify("immeuble R+4 d'une valeur allant de 900 millions à 1 milliards");
assert.equal(qGrizz.budget, 1000000000, '"900 millions à 1 milliards" -> 1 000 000 000 FCFA');

// 6. Mr. Donatien BLE & maxessoh1952 : caution mentionnée à côté du loyer mensuel
const qDonatien = qualify("J'ai une cotion de 200milles je voudrais un studio de 45 ou 50milles franc à Yopougon");
assert.equal(qDonatien.budget, 50000, 'Caution de 200 milles ignorée au profit du loyer de 50 milles');
const qMaxessoh = qualify('Budget 150 mille besoin de maison de 30 ou 35 milles francs CFA à abobo');
assert.equal(qMaxessoh.budget, 35000, 'Caution globale de 150 mille ignorée au profit du loyer de 35 milles');

// 7. Coffi Reine & Mireille Désirée : vraies clientes qui ne doivent JAMAIS être classées comme vendeuses
const msgCoffiReine = "Bonjour madame monsieur, est ce possible d'avoir une 2 pièces à 70 000 ou 80 000f en location à marcory ?";
assert.equal(isClientSearchIntent(msgCoffiReine), true, '"est ce possible d\'avoir..." est une recherche client');
assert.equal(isListingOrPartnerOffer(msgCoffiReine, false), false, 'Coffi Reine ne doit pas être classée comme vendeuse');
const msgMireille = 'Recherche un studio pour location\nLoyer: 50.000f\nZones souhaitées: Yopougon camp militaire';
assert.equal(isClientSearchIntent(msgMireille), true, '"Recherche un studio..." en début de message est une recherche client');
assert.equal(isListingOrPartnerOffer(msgMireille, false), false, 'Mireille Désirée ne doit pas être classée comme vendeuse');

// 8. Shorthands de pièces & types ("2 chambres salon", "2 PCS", "2p ou 3p", "180 maxi", "65/70 budget")
const qDaniel = qualify('Je cherche deux chambres salon à Yopougon 100 000');
assert.equal(qDaniel.propertyType, 'appartement', '"deux chambres salon" -> appartement');
assert.equal(qDaniel.nbPieces, 3, '"deux chambres salon" -> 3 pièces');
const qLebehi = qualify('2 PCS Yopougon 60 à 80mille');
assert.equal(qLebehi.propertyType, 'appartement', '"2 PCS" -> appartement');
assert.equal(qLebehi.nbPieces, 2, '"2 PCS" -> 2 pièces');
const qMaxi = qualify('Location 180 maxi');
assert.equal(qMaxi.budget, 180000, '"180 maxi" -> 180 000 FCFA');
const qRosine = qualify('65/70 budget');
assert.equal(qRosine.budget, 70000, '"65/70 budget" -> 70 000 FCFA');

// 9. Fautes de frappe communes/quartiers & protection "Man"
assert.equal(qualify('Studio a macory').zone, 'Marcory', '"macory" -> Marcory');
assert.equal(qualify('studios disponibles à yopougo Maroc').zone, 'Yopougon', '"yopougo" -> Yopougon');
assert.equal(qualify('Un studio à port Bouet').zone, 'Port-Bouet', '"port Bouet" -> Port-Bouet');
assert.equal(qualify('Maison à atecoubé').zone, 'Attécoubé', '"atecoubé" -> Attécoubé');
assert.equal(qualify('Besoin de 2 pièces à m badon').zone, "M'badon", '"m badon" -> M\'badon');
assert.equal(qualify('dans la zone de tout rouge').zone, 'Toits rouges', '"tout rouge" -> Toits rouges');
assert.equal(qualify('Gonzague en bordure de l autauroute').zone, 'Gonzagueville', '"Gonzague" -> Gonzagueville');
assert.equal(qualify('Bonjour man je cherche un studio').zone, null, '"Bonjour man" ne doit PAS matcher la ville de Man');
assert.equal(qualify('Je cherche un terrain à Man').zone, 'Man', '"à Man" matche bien la ville de Man');
console.log('✓ Test 9 validé');

console.log('\n========================================================');
console.log('TOUS LES TESTS DU MOTEUR DE QUALIFICATION SONT VALIDÉS !');
console.log('========================================================');

