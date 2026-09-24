import { parseSearchQuery } from '../searchParser'
import { formatFCFA } from '../format'
import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import {
  getConsolidatedCatalogue,
  getConsolidatedBienById,
  extractBienIdFromText,
  type ConsolidatedBien,
} from '@/lib/catalogue/consolidated'
import type { Qualification } from './qualification'

/**
 * Outil de recherche Sapphire.
 *
 * Source unique : `getConsolidatedCatalogue` — qui fusionne déjà :
 *   • biens BOGBE'S (proprios + agences inscrites)
 *   • locaux scrapés depuis les groupes WhatsApp publics
 *
 * Sapphire ne fait JAMAIS sa propre query DB. Tout passe par le catalogue
 * consolidé pour garantir que la réponse Sapphire et la page /catalogue
 * voient exactement les mêmes biens.
 */

/** Plafond budgétaire strict (Règle 3) : prix ≤ budget (tolérance 0 %).
 *  JAMAIS de dépassement. Moins cher = toujours proposable. */
const BUDGET_CAP_FACTOR = 1.0

/** Max biens retournés par source (BOGBE'S + offres flash) */
const MAX_PER_SOURCE = 3
/** Total max envoyé à l'IA (toutes sources confondues) */
const SAPPHIRE_MAX_RESULTS = 5

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bogbesgroup.com'

/** Normalisation zone : minuscules sans accents pour comparer commune/quartier. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Quartiers fréquemment cités → commune de rattachement.
 */
const QUARTIER_COMMUNE: Record<string, string> = {
  angre: 'Cocody',
  'angré': 'Cocody',
  riviera: 'Cocody',
  bonoumin: 'Cocody',
  palmeraie: 'Cocody',
  'deux plateaux': 'Cocody',
  '2 plateaux': 'Cocody',
  vallon: 'Cocody',
  cocovico: 'Cocody',
  synacass: 'Cocody',
  djorobite: 'Cocody',
  'djorobité': 'Cocody',
  akouedo: 'Cocody',
  'akouédo': 'Cocody',
  danga: 'Cocody',
  faya: 'Cocody',
  attoban: 'Cocody',
  abatta: 'Bingerville',
  'zone 4': 'Marcory',
  bietry: 'Marcory',
  'biétry': 'Marcory',
  anoumabo: 'Marcory',
  niangon: 'Yopougon',
  selmer: 'Yopougon',
  'toits rouges': 'Yopougon',
  sicogi: 'Yopougon',
  vridi: 'Port-Bouët',
  gonzagueville: 'Port-Bouët',
  chateau: 'Yopougon',
  'château': 'Yopougon',
  bracodi: 'Adjamé',
}

/** Étiquette de provenance montrée au LLM. Doit rester honnête : une annonce web
 *  vient d'un site public — ses photos sont réelles (rapatriées chez nous) mais
 *  l'offre elle-même n'a PAS été vérifiée par BOGBE'S. */
function sourceTagOf(b: ConsolidatedBien): string {
  if (b.source === 'bogbes') return "[CATALOGUE BOGBE'S]"
  if (b.source === 'web') return '[ANNONCE WEB PUBLIQUE]'
  return '[OFFRE FLASH WhatsApp]'
}

function badgesOf(b: ConsolidatedBien): string[] {
  const badges: string[] = []
  if (b.is_verifie) badges.push('✓ VÉRIFIÉ')
  if (b.is_pending) badges.push("⏳ En cours de validation (enregistré, pas encore vérifié par BOGBE'S)")
  if (typeof b.score_ia === 'number' && b.score_ia >= 80) badges.push('★ Top qualité')
  if (b.source === 'flash') badges.push('⚡ Offre flash (récente, à valider rapidement)')
  if (b.source === 'web')
    badges.push("🌐 Annonce d'un site immo public — photos réelles, offre NON vérifiée par BOGBE'S")
  if (b.is_recent) badges.push('🆕 Nouveau (< 24h)')
  return badges
}

function formatBienBlock(b: ConsolidatedBien, i: number | null): string {
  const sourceTag = sourceTagOf(b)
  const badges = badgesOf(b)

  let out = i !== null ? `--- BIEN ${i + 1} ${sourceTag} ---\n` : `--- BIEN DEMANDÉ ${sourceTag} ---\n`
  out += `ID: ${b.sourceId}\n`
  out += `Source: ${b.source}\n`
  if (badges.length) out += `Badges: ${badges.join(' | ')}\n`
  out += `Titre: ${b.titre}\n`
  out += `Type: ${b.type_bien}\n`
  out += `Localisation: ${b.commune}${b.quartier ? ' / ' + b.quartier : ''}\n`
  out += `Prix: ${b.prix_label}\n`
  if (b.nb_pieces) out += `Pièces/chambres: ${b.nb_pieces}\n`
  if (b.surface_m2) out += `Surface: ${b.surface_m2} m²\n`
  if (b.equipements.length) out += `Équipements: ${b.equipements.join(', ')}\n`
  if (b.description) out += `Description: ${b.description.slice(0, 150)}\n`
  if (b.photos.length > 0) out += `Photos disponibles (${b.photos.length}): ${b.photos.slice(0, 1).join(' | ')}\n`
  else out += `Pas de photos dans le catalogue pour ce bien.\n`
  if (b.videos.length > 0) out += `Vidéos disponibles (${b.videos.length}): ${b.videos.slice(0, 2).join(' | ')}\n`
  out += `Lien fiche: ${b.url}\n`
  // ⚠️ `cta_url` (wa.me) volontairement RETIRÉ du contexte LLM : Sapphire
  // hallucinait des templates avec placeholders (`https://wa.me/[contact via...`).
  // À la place, on lui dit dans le prompt de pointer vers la fiche (où il y a
  // un vrai bouton "Demander une visite").
  return out
}

export async function getAIBienContext(
  userMessage: string,
  history?: { role: string; content: string }[],
  qualification?: Qualification,
) {
  // ─── PRIORITÉ 1 : URL d'un bien dans le message ────────────────────────────
  // Si le client envoie un lien comme www.bogbesgroup.com/biens/<UUID> ou
  // /offre-flash/<id>, on fetch CE bien et on cherche aussi des similaires.
  const detected = extractBienIdFromText(userMessage)
  if (detected) {
    const requested = await getConsolidatedBienById(detected.source, detected.id)
    if (requested) {
      let context = `INSTRUCTION SPÉCIALE — Le client envoie un lien vers un bien précis. Tu DOIS :
1. D'abord présenter en détail LE BIEN DEMANDÉ ci-dessous (titre, prix, localisation, surface, équipements, description courte si utile).
2. Répondre à sa question (s'il en pose une) en t'appuyant uniquement sur les infos du contexte.
3. Ensuite, et SEULEMENT ensuite, proposer 2-3 biens similaires en disant "Voici aussi des biens du même type / zone / budget qui pourraient t'intéresser :"
4. Ne JAMAIS proposer les biens similaires AVANT de répondre sur le bien demandé.

`
      context += formatBienBlock(requested, null) + '\n'

      // Fetch des similaires : même type, même commune, prix ±15%
      const margin = 0.15
      const prixMin = requested.prix_value ? Math.round(requested.prix_value * (1 - margin)) : undefined
      const prixMax = requested.prix_value ? Math.round(requested.prix_value * (1 + margin)) : undefined
      const { items: similar } = await getConsolidatedCatalogue({
        commune: requested.commune,
        type_bien: requested.type_bien,
        prix_min: prixMin,
        prix_max: prixMax,
        sort: 'verified_first',
        limitPerSource: 3,
      })
      const similarFiltered = similar.filter((s) => s.sourceId !== requested.sourceId).slice(0, 3)

      if (similarFiltered.length > 0) {
        context += `\n=== BIENS SIMILAIRES (à proposer APRÈS la réponse sur le bien demandé) ===\n\n`
        similarFiltered.forEach((b, i) => {
          context += formatBienBlock(b, i) + '\n'
        })
      }

      // Lien catalogue filtré
      const params = new URLSearchParams()
      params.append('commune', requested.commune)
      params.append('type_bien', requested.type_bien)
      const catalogueUrl = `${SITE_URL}/catalogue?${params.toString()}`
      context += `\nLIEN CATALOGUE FILTRÉ (à proposer en fin de message) : ${catalogueUrl}\n`

      return context
    }
  }

  const p = parseSearchQuery(userMessage)

  // Alignement direct avec l'objet de qualification déterministe
  if (qualification) {
    if (qualification.propertyType) p.type_bien = qualification.propertyType
    if (qualification.zone) p.commune = qualification.zone
    if (qualification.budget) p.prix_max = String(qualification.budget)
  }

  // Détecter si le client demande des images/photos/vidéos
  const demandeMedia = /photo|image|voir|envoie|montre|aper[cç]u|visu|vid[eé]o/i.test(userMessage)

  // Si aucun critère dans le message courant, chercher dans l'historique récent
  if (!p.commune && !p.type_bien && !p.prix_max && !p.q && history && history.length > 0) {
    const recentContent = history
      .slice(-8)
      .map((m) => m.content)
      .join(' ')
    const pFromHistory = parseSearchQuery(recentContent)
    if (pFromHistory.commune) p.commune = pFromHistory.commune
    if (pFromHistory.type_bien) p.type_bien = pFromHistory.type_bien
    if (pFromHistory.prix_max) p.prix_max = pFromHistory.prix_max
    if (pFromHistory.q) p.q = pFromHistory.q
    if (pFromHistory.equipements?.length) p.equipements = pFromHistory.equipements
  }

  // ZONE STRICTE — étape 1 : détection de TOUTES les zones (communes et quartiers)
  // mentionnées dans le message et l'historique récent (gestion multi-zones ex: "Cocody, Faya, Bingerville").
  const zoneTerms: string[] = []
  const msgNorm = norm(
    userMessage + ' ' + (history?.slice(-8).map((m) => m.content).join(' ') ?? ''),
  )

  // 1. Communes citées
  for (const c of COMMUNES_CI) {
    const clean = norm(c === 'Bassam (Grand-Bassam)' ? 'bassam' : c)
    if (msgNorm.includes(clean) && !zoneTerms.includes(clean)) {
      zoneTerms.push(clean)
    }
  }

  // 2. Quartiers cités
  for (const [quartier, commune] of Object.entries(QUARTIER_COMMUNE)) {
    const normQ = norm(quartier)
    if (msgNorm.includes(normQ)) {
      if (!zoneTerms.includes(normQ)) zoneTerms.push(normQ)
      const normC = norm(commune)
      if (!zoneTerms.includes(normC)) zoneTerms.push(normC)
    }
  }

  // 2b. Périphérie / alentours d'Abidjan
  if (
    /(aux?\s+)?alentours?\s+(d['’]|de\s+)?abidjan|autour\s+d['’]abidjan|peripherie/i.test(msgNorm) ||
    (p.commune && norm(p.commune).includes('peripherie'))
  ) {
    for (const periph of ['bingerville', 'bassam', 'grand-bassam', 'songon', 'anyama']) {
      if (!zoneTerms.includes(periph)) zoneTerms.push(periph)
    }
  }

  // 3. Fallback sur p.commune si le scan direct n'a rien donné
  if (p.commune && zoneTerms.length === 0) {
    const normCommune = norm(p.commune)
    zoneTerms.push(normCommune)
    if (QUARTIER_COMMUNE[normCommune]) {
      zoneTerms.push(norm(QUARTIER_COMMUNE[normCommune]))
    }
  }

  // Si toujours aucun critère et pas de demande de média, pas de recherche
  if (zoneTerms.length === 0 && !p.commune && !p.type_bien && !p.prix_max && !p.q && !demandeMedia) {
    return null
  }

  // Plafond budgétaire strict (Règle 3) : budgetMax = budget
  const budget = p.prix_max ? parseInt(p.prix_max, 10) : null
  const budgetMin = undefined
  const budgetMax = budget ? budget * BUDGET_CAP_FACTOR : undefined

  // Si plusieurs communes sont demandées (ex: Cocody + Bingerville), on ne filtre pas par
  // une commune unique au niveau SQL : on interroge le catalogue et on filtre en mémoire.
  const allKnownCommunesNorm = COMMUNES_CI.map((c) => norm(c === 'Bassam (Grand-Bassam)' ? 'bassam' : c))
  const distinctCommunesInTerms = allKnownCommunesNorm.filter((c) => zoneTerms.includes(c))
  const isPeripherieOnly = !!(p.commune && norm(p.commune).includes('peripherie'))
  const singleCommuneFilter = isPeripherieOnly
    ? p.commune
    : distinctCommunesInTerms.length === 1
      ? (p.commune || distinctCommunesInTerms[0])
      : undefined

  // ─── Unique appel au catalogue consolidé ────────────────────────────────────
  const { items, counts } = await getConsolidatedCatalogue({
    commune: singleCommuneFilter,
    type_bien: p.type_bien,
    type_offre: qualification?.transaction === 'achat' ? 'vente' : (qualification?.transaction ?? undefined),
    equipements: p.equipements,
    prix_min: budgetMin,
    prix_max: budgetMax,
    sort: 'verified_first',
    limitPerSource: distinctCommunesInTerms.length > 1 ? MAX_PER_SOURCE * 2 : MAX_PER_SOURCE,
  })

  // Post-filtrage strict sur le budget (Règle 3) :
  // Si budget spécifié, JAMAIS de bien dont le prix est supérieur au budget,
  // et exclusion des biens avec prix inconnu / sur demande pour éviter les dépassements.
  let validItems = items
  if (budget != null) {
    validItems = items.filter((b) => b.prix_value != null && b.prix_value <= budget)
  }

  // ZONE STRICTE — étape 2 (Règle 3) : JAMAIS un bien d'une autre zone ou commune.
  let zoned = validItems
  if (zoneTerms.length > 0) {
    const bienZone = (b: ConsolidatedBien) => norm(`${b.commune ?? ''} ${b.quartier ?? ''} ${b.titre} ${b.description ?? ''}`)
    // Détecter si l'utilisateur a cité uniquement un quartier précis (ex: juste 'angre') sans commune
    const quartierDemande = zoneTerms.find((t) => QUARTIER_COMMUNE[t] != null)
    const hasOnlyQuartier = !!quartierDemande && distinctCommunesInTerms.length === 0
    if (hasOnlyQuartier) {
      const inQuartier = validItems.filter((b) => bienZone(b).includes(quartierDemande))
      if (inQuartier.length > 0) {
        zoned = inQuartier
      } else {
        // Si aucun bien dans ce quartier précis, interdiction stricte de proposer une autre commune
        zoned = []
      }
    } else {
      zoned = validItems.filter((b) => zoneTerms.some((t) => bienZone(b).includes(t)))
    }
  }

  const top = zoned.slice(0, SAPPHIRE_MAX_RESULTS)

  if (top.length === 0) {
    return `Aucun bien ne correspond exactement à ces critères (zone comprise), ni dans le catalogue BOGBE'S, ni dans les offres flash WhatsApp.
INSTRUCTION : remercie brièvement le client puis dis EXACTEMENT : "Un conseiller client va prendre le relais et vous recontacter." Rien d'autre. Ne propose JAMAIS un bien d'une autre zone.`
  }

  // En-tête avec récap des critères
  const critereLines: string[] = []
  if (p.commune) critereLines.push(`- Zone : ${p.commune}`)
  if (p.type_bien) critereLines.push(`- Type : ${p.type_bien}`)
  if (budget && budgetMax != null) {
    critereLines.push(
      `- Budget client : ${formatFCFA(budget)} (plafond strict appliqué : aucun bien au-delà de ${formatFCFA(budgetMax)})`,
    )
  }
  if (p.equipements?.length) critereLines.push(`- Équipements : ${p.equipements.join(', ')}`)

  let context = `${top.length} bien(s) trouvé(s) (max ${SAPPHIRE_MAX_RESULTS}) via catalogue consolidé\n`
  context += `Sources : BOGBE'S vérifiés (${counts.bogbes}) + Offres Flash WhatsApp (${counts.flash}) + Annonces web (${counts.web})\n`
  if (critereLines.length) context += `\nCRITÈRES STRICTS APPLIQUÉS :\n${critereLines.join('\n')}\n`
  context += '\n'

  top.forEach((b: ConsolidatedBien, i: number) => {
    const sourceTag = sourceTagOf(b)
    const badges = badgesOf(b)

    context += `--- BIEN ${i + 1} ${sourceTag} ---\n`
    context += `ID: ${b.sourceId}\n`
    context += `Source: ${b.source}\n`
    if (badges.length) context += `Badges: ${badges.join(' | ')}\n`
    context += `Titre: ${b.titre}\n`
    context += `Type: ${b.type_bien}\n`
    context += `Localisation: ${b.commune}${b.quartier ? ' / ' + b.quartier : ''}\n`
    context += `Prix: ${b.prix_label}\n`
    if (b.nb_pieces) context += `Pièces/chambres: ${b.nb_pieces}\n`
    if (b.surface_m2) context += `Surface: ${b.surface_m2} m²\n`
    if (b.equipements.length) context += `Équipements: ${b.equipements.join(', ')}\n`
    if (b.description) context += `Description: ${b.description.slice(0, 220)}\n`
    if (b.photos.length > 0) context += `Photos disponibles (${b.photos.length}): ${b.photos.slice(0, 3).join(' | ')}\n`
    else context += `Pas de photos dans le catalogue pour ce bien.\n`
    if (b.videos.length > 0) context += `Vidéos disponibles (${b.videos.length}): ${b.videos.slice(0, 2).join(' | ')}\n`
    if (b.date_scraping) context += `Récupéré dans notre système : ${new Date(b.date_scraping).toISOString()}\n`
    context += `Lien fiche: ${b.url}\n`
    // cta_url retiré : voir formatBienBlock ci-dessus pour le rationnel.
    context += '\n'
  })

  if (counts.flash > 0) {
    context += `\nNOTE OFFRES FLASH :
Les biens taggés [OFFRE FLASH WhatsApp] proviennent de canaux WhatsApp publics scrapés en temps réel.
- Ils tournent vite : annonce-les comme "à valider rapidement, possiblement déjà loué/vendu".
- Le CTA n'est PAS un lien #reserver — c'est un lien wa.me direct vers notre conseiller, qui valide l'offre avant tout engagement.
- Tu peux les présenter dans le même message que les biens BOGBE'S, mais signale la source avec ⚡.\n`
  }

  if (top.some((b) => b.is_pending)) {
    context += `\nNOTE BIENS EN VALIDATION :
Les biens taggés "⏳ En cours de validation" sont enregistrés sur la plateforme par leur propriétaire mais pas encore vérifiés par l'équipe BOGBE'S.
- Présente-les normalement, mais précise honnêtement qu'ils sont "en cours de vérification par notre équipe".
- Privilégie et mets en avant les biens "✓ VÉRIFIÉ" quand il y en a.\n`
  }

  if (demandeMedia) {
    context += `\nINSTRUCTION MÉDIA OBLIGATOIRE:
Le client demande des photos/vidéos.
- Vérifie si "Photos disponibles" est listé pour le bien concerné ci-dessus.
- Si oui : prends la PREMIÈRE URL et ajoute EXACTEMENT [MEDIA: <URL>] à la FIN de ta réponse.
- Si "Pas de photos dans le catalogue" : dis "Je n'ai pas encore de photos pour ce bien dans notre système."
- N'invente AUCUNE URL.\n`
  }

  // --- LIEN DE RECHERCHE PRÉ-FILTRÉ (CATALOGUE CONSOLIDÉ) ---
  const params = new URLSearchParams()
  if (p.commune) params.append('commune', p.commune)
  if (p.type_bien) params.append('type_bien', p.type_bien)
  if (p.prix_max) params.append('prix_max', p.prix_max)

  const catalogueUrl = params.toString()
    ? `${SITE_URL}/catalogue?${params.toString()}`
    : `${SITE_URL}/catalogue`

  context += `\nLIEN DE RECHERCHE PERSONNALISÉ (CATALOGUE CONSOLIDÉ) :
Propose ce lien au client pour qu'il explore l'intégralité de notre catalogue (biens vérifiés BOGBE'S + offres flash WhatsApp) correspondant à sa recherche : ${catalogueUrl}\n`

  context += `\nINSTRUCTION PRÉSENTATION OBLIGATOIRE :
- Introduis les biens par EXACTEMENT : "Voici ce qui est disponible dans notre catalogue correspondant à votre recherche :"
- Termine le message par EXACTEMENT : "Merci de patienter, un conseiller commercial va prendre la relève pour la suite."\n`

  return context
}
