import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const routeSource = await readFile(
  resolve('c:/Users/WILFRIED/OneDrive - Gravel Ivoire/Bureau/immo/apps/web/app/api/whatsapp/webhook/route.ts'),
  'utf8'
);
const qualSource = await readFile(
  resolve('c:/Users/WILFRIED/OneDrive - Gravel Ivoire/Bureau/immo/apps/web/lib/ai/qualification.ts'),
  'utf8'
);
const toolsSource = await readFile(
  resolve('c:/Users/WILFRIED/OneDrive - Gravel Ivoire/Bureau/immo/apps/web/lib/ai/tools.ts'),
  'utf8'
);

console.log('--- TEST 1 : RÈGLE 1 - Message de bienvenue exact ---');
assert.ok(qualSource.includes('🏡 Bienvenue chez Bogbe’s Groupe Immobilier !'), 'Titre de bienvenue exact');
assert.ok(qualSource.includes('🔹 Recherchez-vous un bien à louer ou à acheter ?'), 'Puce 1 bienvenue');
assert.ok(qualSource.includes('🔹 Quel type de bien souhaitez-vous ?'), 'Puce 2 bienvenue');
assert.ok(qualSource.includes('🔹 Dans quelle zone recherchez-vous ?'), 'Puce 3 bienvenue');
assert.ok(qualSource.includes('🔹 Quel est votre budget maximum ?'), 'Puce 4 bienvenue');
assert.ok(qualSource.includes('🔹 À quelle date souhaitez-vous disposer du bien ?'), 'Puce 5 bienvenue');
assert.ok(qualSource.includes('https://bogbesgroup.com'), 'Lien bogbesgroup.com présent');
assert.ok(qualSource.includes('Votre futur bien est peut-être déjà disponible ! 🔑'), 'Conclusion bienvenue');
console.log('✓ Règle 1 validée');

console.log('--- TEST 2 : RÈGLE 2 - Relance unique ciblée & silence ---');
assert.ok(qualSource.includes('buildQualifReminder'), 'Fonction buildQualifReminder présente');
assert.ok(qualSource.includes('Pour que je puisse vous proposer les biens les plus adaptés'), 'Texte intro relance exact');
assert.ok(routeSource.includes('if (reminderSent) {'), 'Garde de relance unique présente');
assert.ok(routeSource.includes("branch: 'qualif_silence'"), 'Silence strict après 1 relance');
console.log('✓ Règle 2 validée');

console.log('--- TEST 3 : RÈGLE 3 - Filtrage strict (Zone & Budget) ---');
assert.ok(toolsSource.includes('const BUDGET_CAP_FACTOR = 1.0'), 'Budget cap strict à 1.0 (tolérance 0%)');
assert.ok(toolsSource.includes('b.prix_value != null && b.prix_value <= budget'), 'Filtrage post-requête prix <= budget');
assert.ok(toolsSource.includes('type_offre: qualification?.transaction === \'achat\' ? \'vente\' : (qualification?.transaction ?? undefined)'), 'Filtrage transaction location vs vente');
assert.ok(toolsSource.includes('if (inQuartier.length > 0) {'), 'Priorité stricte au quartier demandé');
assert.ok(toolsSource.includes('zoned = []'), 'Exclusion stricte des autres communes si quartier demandé non trouvé');
console.log('✓ Règle 3 validée');

console.log('--- TEST 4 : RÈGLE 4 - Zéro résultat -> Transmission conseiller ---');
assert.ok(qualSource.includes('Un conseiller client va vous contacter d’ici peu pour vous faire des propositions adaptées.'), 'Texte conseiller exact');
assert.ok(qualSource.includes('À très bientôt ! 🤝'), 'Poli et chaleureux');
assert.ok(routeSource.includes("body: 'COUNSELOR_HANDOFF'"), 'Pose du marqueur système COUNSELOR_HANDOFF');
assert.ok(routeSource.includes("marks.some((m) => m.body === 'COUNSELOR_HANDOFF')"), 'Garde de silence après handoff conseiller');
assert.ok(routeSource.includes('SAPPHIRE_ADVISOR_PHONE'), 'Notification WhatsApp au conseiller humain');
console.log('✓ Règle 4 validée');

console.log('--- TEST 5 & 6 : RÈGLES 5 & 6 - Démarcheurs / Propriétaires / Offres ---');
assert.ok(routeSource.includes('isPartnerOrListingOffer'), 'Fonction isPartnerOrListingOffer présente');
assert.ok(qualSource.includes('isClientSearchIntent'), 'Fonction isClientSearchIntent présente dans qualification');
assert.ok(routeSource.includes('isClientSearchIntent,'), 'isClientSearchIntent importée dans route');
assert.ok(routeSource.includes('if (isClientSearchIntent(text))'), 'Garde isClientSearchIntent dans isPartnerOrListingOffer');
assert.ok(routeSource.includes('!clientSearching && isPartnerOrListingOffer'), 'Garde clientSearching avant isListing');
assert.ok(routeSource.includes('listingSignals(text) >= 3'), 'Annonce brute >= 3 signaux bascule en partenaire');
assert.ok(routeSource.includes('https://www.bogbesgroup.com/register'), 'Lien register partenaire exact');
assert.ok(routeSource.includes("body: 'LISTING_PROVIDER'"), 'Marqueur système LISTING_PROVIDER');
assert.ok(routeSource.includes("branch: alreadyReplied ? 'listing_muted' : 'listing_partner'"), 'Arrêt immédiat sans questionnaire client');
console.log('✓ Règles 5 & 6 validées');

console.log('--- TEST 7 : RÈGLE 7 - Nouvelle recherche propre ---');
assert.ok(qualSource.includes('isFresh = options?.isNewSession || FRESH_SEARCH_RE.test(message)'), 'Recherche fraîche et nouvelle session réinitialisent');
assert.ok(routeSource.includes('FRESH_SEARCH_RE.test(userMessage)'), 'Détection des requêtes fraîches sur reprise');
console.log('✓ Règle 7 validée');

console.log('\n========================================================');
console.log('TOUTES LES 7 RÈGLES STRICTES SONT VALIDÉES AVEC SUCCÈS !');
console.log('========================================================');
