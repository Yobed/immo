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
  angree: 'Cocody',
  'angrée': 'Cocody',
  angre: 'Cocody',
  'angré': 'Cocody',
  'belle ville': 'Cocody',
  belleville: 'Cocody',
  abobote: 'Cocody',
  'aboboté': 'Cocody',
  dokui: 'Cocody',
  gestoci: 'Cocody',
  mahou: 'Cocody',
  '7e tranche': 'Cocody',
  '8e tranche': 'Cocody',
  '9e tranche': 'Cocody',
  '7eme tranche': 'Cocody',
  '8eme tranche': 'Cocody',
  '9eme tranche': 'Cocody',
  'riviera golf': 'Cocody',
  'riviera 2': 'Cocody',
  'riviera 3': 'Cocody',
  'riviera 4': 'Cocody',
  'riviera palmeraie': 'Cocody',
  'riviera bonoumin': 'Cocody',
  'riviera faya': 'Cocody',
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
  chateau: 'Cocody',
  'château': 'Cocody',
  mbadon: 'Cocody',
  'm\'badon': 'Cocody',
  mpouto: 'Cocody',
  'm\'pouto': 'Cocody',
  abatta: 'Bingerville',
  'jules verne': 'Bingerville',
  'zone 4': 'Marcory',
  bietry: 'Marcory',
  'biétry': 'Marcory',
  anoumabo: 'Marcory',
  remblais: 'Koumassi',
  sogephia: 'Koumassi',
  niangon: 'Yopougon',
  selmer: 'Yopougon',
  'toits rouges': 'Yopougon',
  'toit rouge': 'Yopougon',
  sicogi: 'Yopougon',
  maroc: 'Yopougon',
  anador: 'Yopougon',
  sopim: 'Yopougon',
  ananeraie: 'Yopougon',
  sideci: 'Yopougon',
  banco: 'Yopougon',
  gesco: 'Yopougon',
  azito: 'Yopougon',
  wassakara: 'Yopougon',
  andokoi: 'Yopougon',
  koute: 'Yopougon',
  'kouté': 'Yopougon',
  millionnaire: 'Yopougon',
  koweit: 'Yopougon',
  'koweït': 'Yopougon',
  'cite ado': 'Yopougon',
  'cité ado': 'Yopougon',
  pk18: 'Abobo',
  'pk 18': 'Abobo',
  avocatier: 'Abobo',
  ndotre: 'Abobo',
  'ndotré': 'Abobo',
  vridi: 'Port-Bouët',
  gonzagueville: 'Port-Bouët',
  bracodi: 'Adjamé',
  williamsville: 'Adjamé',
  paillet: 'Adjamé',
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
    if (qualification.nbPieces) p.nb_pieces = qualification.nbPieces
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
    if (pFromHistory.nb_pieces) p.nb_pieces = pFromHistory.nb_pieces
  }

  // ZONE STRICTE — étape 1 : détection de TOUTES les zones (communes et quartiers)
  // mentionnées dans le message et l'historique récent (gestion multi-zones ex: "Cocody, Faya, Bingerville").
  const zoneTerms: string[] = []
  const msgNorm = norm(
    userMessage + ' ' + (history?.slice(-8).map((m) => m.content).join(' ') ?? ''),
  )

  // 1. Communes citées (avec frontières de mots pour éviter que "Aboboté" matche "Abobo")
  for (const c of COMMUNES_CI) {
    const clean = norm(c === 'Bassam (Grand-Bassam)' ? 'bassam' : c)
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const communeRe = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i')
    if (communeRe.test(msgNorm) && !zoneTerms.includes(clean)) {
      zoneTerms.push(clean)
    }
  }

  // 2. Quartiers cités
  for (const [quartier, commune] of Object.entries(QUARTIER_COMMUNE)) {
    const normQ = norm(quartier)
    const escapedQ = normQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const qRe = new RegExp(`(?<![a-z0-9])${escapedQ}(?![a-z0-9])`, 'i')
    if (qRe.test(msgNorm)) {
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
      ? distinctCommunesInTerms[0]
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

  // Post-filtrage strict sur la transaction (location vs vente) :
  // Ne jamais proposer un bien en vente (25M, 90M) à quelqu'un qui cherche une location
  const requestedTransaction = qualification?.transaction
  if (requestedTransaction === 'location') {
    validItems = validItems.filter(
      (b) => b.prix_period !== 'vente' && !/\b(vente|[àa]\s+vendre)\b/i.test(`${b.titre} ${b.prix_label}`),
    )
  } else if (requestedTransaction === 'achat') {
    validItems = validItems.filter(
      (b) => b.prix_period === 'vente' || /\b(vente|[àa]\s+vendre)\b/i.test(`${b.titre} ${b.prix_label}`),
    )
  }

  // Post-filtrage strict sur le type de bien :
  // Ne JAMAIS proposer un terrain, un hôtel, un commerce ou un bureau quand le client demande un logement résidentiel
  if (p.type_bien) {
    const reqType = norm(p.type_bien)
    validItems = validItems.filter((b) => {
      const bType = norm(`${b.type_bien ?? ''} ${b.titre ?? ''}`)
      if (['appartement', 'villa', 'maison', 'studio', 'residence_meublee'].includes(reqType)) {
        if (/\b(terrain|lotissement|parcelle|hotel|hôtel|magasin|entrepot|entrepôt|fonds de commerce|bureau)\b/i.test(bType)) {
          return false
        }
      }
      if (reqType === 'villa' || reqType === 'maison') {
        return /\b(villa|maison|duplex|triplex)\b/i.test(bType)
      }
      if (reqType === 'appartement') {
        return /\b(appartement|appart|f[2-6]|[2-6]\s*pi[eè]ces?)\b/i.test(bType)
      }
      if (reqType === 'studio') {
        return /\b(studio|chambre|1\s*pi[eè]ce|f1)\b/i.test(bType)
      }
      if (reqType === 'terrain') {
        return /\b(terrain|lot|parcelle|acd|tf)\b/i.test(bType)
      }
      return bType.includes(reqType)
    })
  }

  // Post-filtrage sur le nombre de pièces (ex: 2 pièces demandé -> exclure 4+ pièces)
  const reqPieces = p.nb_pieces || qualification?.nbPieces
  if (reqPieces) {
    validItems = validItems.filter((b) => {
      if (b.nb_pieces != null) {
        return Math.abs(b.nb_pieces - reqPieces) <= 1
      }
      return true
    })
  }

  // ZONE STRICTE — étape 2 (Règle 3) : JAMAIS un bien d'une autre zone ou commune.
  let zoned = validItems
  if (zoneTerms.length > 0) {
    const bienZone = (b: ConsolidatedBien) => norm(`${b.commune ?? ''} ${b.quartier ?? ''} ${b.titre} ${b.description ?? ''}`)
    // Détecter tous les quartiers précis cités par le client (ex: 'maroc', 'faya', 'riviera 2', 'angre')
    const quartiersDemandes = zoneTerms.filter((t) => QUARTIER_COMMUNE[t] != null)
    const quartierDemande = quartiersDemandes[0]
    const hasOnlyQuartier = quartiersDemandes.length > 0
    if (hasOnlyQuartier && quartierDemande) {
      const inQuartier = validItems.filter((b) =>
        quartiersDemandes.some((q) => bienZone(b).includes(q)),
      )
      if (inQuartier.length > 0) {
        zoned = inQuartier
      } else {
        // Si aucun bien dans ce(s) quartier(s) précis, interdiction stricte de proposer un autre quartier ou une autre commune
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
