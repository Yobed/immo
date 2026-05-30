import { parseSearchQuery } from '../searchParser'
import { formatFCFA } from '../format'
import {
  getConsolidatedCatalogue,
  getConsolidatedBienById,
  extractBienIdFromText,
  type ConsolidatedBien,
} from '@/lib/catalogue/consolidated'

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

/** Marge budgétaire appliquée autour du budget client (±15%). */
const BUDGET_MARGIN_PCT = 0.15

/** Max biens retournés par source (BOGBE'S + offres flash) */
const MAX_PER_SOURCE = 3
/** Total max envoyé à l'IA (toutes sources confondues) */
const SAPPHIRE_MAX_RESULTS = 5

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app'

function formatBienBlock(b: ConsolidatedBien, i: number | null): string {
  const sourceTag = b.source === 'bogbes' ? "[CATALOGUE BOGBE'S]" : '[OFFRE FLASH WhatsApp]'
  const badges: string[] = []
  if (b.is_verifie) badges.push('✓ VÉRIFIÉ')
  if (b.is_pending) badges.push("⏳ En cours de validation (enregistré, pas encore vérifié par BOGBE'S)")
  if (typeof b.score_ia === 'number' && b.score_ia >= 80) badges.push('★ Top qualité')
  if (b.source === 'flash') badges.push('⚡ Offre flash (récente, à valider rapidement)')
  if (b.is_recent) badges.push('🆕 Nouveau (< 24h)')

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
  if (b.description) out += `Description: ${b.description.slice(0, 280)}\n`
  if (b.photos.length > 0) out += `Photos disponibles (${b.photos.length}): ${b.photos.slice(0, 3).join(' | ')}\n`
  else out += `Pas de photos dans le catalogue pour ce bien.\n`
  if (b.videos.length > 0) out += `Vidéos disponibles (${b.videos.length}): ${b.videos.slice(0, 2).join(' | ')}\n`
  out += `Lien fiche: ${b.url}\n`
  out += `CTA visite/contact: ${b.cta_url}\n`
  return out
}

export async function getAIBienContext(
  userMessage: string,
  history?: { role: string; content: string }[],
) {
  // ─── PRIORITÉ 1 : URL d'un bien dans le message ────────────────────────────
  // Si le client envoie un lien comme bogbes-groupe.vercel.app/biens/<UUID> ou
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

  // Si toujours aucun critère et pas de demande de média, pas de recherche
  if (!p.commune && !p.type_bien && !p.prix_max && !p.q && !demandeMedia) {
    return null
  }

  // Marge budgétaire : ±15%
  const budget = p.prix_max ? parseInt(p.prix_max) : null
  const budgetMin = budget ? Math.round(budget * (1 - BUDGET_MARGIN_PCT)) : undefined
  const budgetMax = budget ? Math.round(budget * (1 + BUDGET_MARGIN_PCT)) : undefined

  // ─── Unique appel au catalogue consolidé ────────────────────────────────────
  // ⚠️ ON NE PASSE PAS `p.q` au catalogue : c'est une recherche full-text trop stricte
  // (ilike %louer riviera 3 03 pièces% ne matche jamais une description réelle).
  // La combinaison commune + type + budget ±15% suffit pour trouver les biens pertinents,
  // et le LLM peut ensuite mentionner le quartier (Riviera 3) à partir des biens retournés.
  const { items, counts } = await getConsolidatedCatalogue({
    commune: p.commune,
    type_bien: p.type_bien,
    equipements: p.equipements,
    prix_min: budgetMin,
    prix_max: budgetMax,
    sort: 'verified_first',
    limitPerSource: MAX_PER_SOURCE,
  })

  const top = items.slice(0, SAPPHIRE_MAX_RESULTS)

  if (top.length === 0) {
    return `Aucun bien ne correspond exactement à ces critères, ni dans le catalogue BOGBE'S, ni dans les offres flash WhatsApp.
Dis au client que tu vas faire une recherche manuelle et que tu le recontactes rapidement.`
  }

  // En-tête avec récap des critères
  const critereLines: string[] = []
  if (p.commune) critereLines.push(`- Zone : ${p.commune}`)
  if (p.type_bien) critereLines.push(`- Type : ${p.type_bien}`)
  if (budget && budgetMin != null && budgetMax != null) {
    critereLines.push(
      `- Budget client : ${formatFCFA(budget)} (intervalle accepté ±15% : ${formatFCFA(budgetMin)} – ${formatFCFA(budgetMax)})`,
    )
  }
  if (p.equipements?.length) critereLines.push(`- Équipements : ${p.equipements.join(', ')}`)

  let context = `${top.length} bien(s) trouvé(s) (max ${SAPPHIRE_MAX_RESULTS}) via catalogue consolidé\n`
  context += `Sources : BOGBE'S vérifiés (${counts.bogbes}) + Offres Flash WhatsApp (${counts.flash})\n`
  if (critereLines.length) context += `\nCRITÈRES STRICTS APPLIQUÉS :\n${critereLines.join('\n')}\n`
  context += '\n'

  top.forEach((b: ConsolidatedBien, i: number) => {
    const sourceTag = b.source === 'bogbes' ? '[CATALOGUE BOGBE\'S]' : '[OFFRE FLASH WhatsApp]'
    const badges: string[] = []
    if (b.is_verifie) badges.push('✓ VÉRIFIÉ')
    if (b.is_pending) badges.push("⏳ En cours de validation (enregistré, pas encore vérifié par BOGBE'S)")
    if (typeof b.score_ia === 'number' && b.score_ia >= 80) badges.push('★ Top qualité')
    if (b.source === 'flash') badges.push('⚡ Offre flash (récente, à valider rapidement)')
    if (b.is_recent) badges.push('🆕 Nouveau (< 24h)')

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
    context += `CTA visite/contact: ${b.cta_url}\n`
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

  return context
}
