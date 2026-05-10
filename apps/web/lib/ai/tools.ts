import { createClient } from '@/lib/supabase/server'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { parseSearchQuery } from '../searchParser'
import { formatFCFA } from '../format'

/**
 * Marge budgétaire appliquée autour du budget client (±15%).
 */
const BUDGET_MARGIN_PCT = 0.15

/** Max biens retournés par source (BOGBE'S + offres flash) */
const MAX_PER_SOURCE = 3
/** Total max envoyé à l'IA (toutes sources confondues) */
const SAPPHIRE_MAX_RESULTS = 5

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app'

interface BienCatalogue {
  source: 'bogbes' | 'offre_flash'
  id: string
  url: string
  reserve_url: string
  titre: string
  type_bien: string
  commune: string
  quartier: string | null
  prix: string
  prix_value: number | null
  surface_m2: number | null
  nb_pieces: number | null
  description: string | null
  is_verifie: boolean
  score_ia: number | null
  photos: string[]
  videos: string[]
}

function bogbesPrixLabel(b: any): { label: string; value: number | null } {
  if (b.prix_nuit_fcfa) return { label: `${formatFCFA(b.prix_nuit_fcfa)} / nuit`, value: b.prix_nuit_fcfa }
  if (b.prix_vente_fcfa) return { label: `${formatFCFA(b.prix_vente_fcfa)} (vente)`, value: b.prix_vente_fcfa }
  if (b.prix_mois_fcfa) return { label: `${formatFCFA(b.prix_mois_fcfa)} / mois`, value: b.prix_mois_fcfa }
  return { label: 'Prix à confirmer', value: null }
}

async function fetchBogbesBiens(
  supabase: any,
  p: { commune?: string; type_bien?: string; q?: string; equipements?: string[] },
  budgetMin: number | null,
  budgetMax: number | null
): Promise<BienCatalogue[]> {
  let dbQuery = supabase
    .from('biens')
    .select(`
      id, titre, commune, quartier, type_bien,
      prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
      nb_pieces, surface_m2, description, equipements,
      is_verifie, score_ia,
      biens_medias(id, url, type, est_couverture, ordre)
    `)
    .eq('statut', 'publie')
    .order('is_verifie', { ascending: false })
    .order('score_ia', { ascending: false, nullsFirst: false })
    .limit(MAX_PER_SOURCE)

  if (p.q?.trim()) dbQuery = dbQuery.textSearch('fts', p.q.trim(), { type: 'plain', config: 'french' })
  if (p.commune) dbQuery = dbQuery.ilike('commune', `%${p.commune}%`)
  if (p.type_bien) dbQuery = dbQuery.eq('type_bien', p.type_bien)
  if (budgetMin && budgetMax) {
    dbQuery = dbQuery.or(
      `and(prix_mois_fcfa.gte.${budgetMin},prix_mois_fcfa.lte.${budgetMax}),` +
      `and(prix_nuit_fcfa.gte.${budgetMin},prix_nuit_fcfa.lte.${budgetMax}),` +
      `and(prix_vente_fcfa.gte.${budgetMin},prix_vente_fcfa.lte.${budgetMax})`
    )
  }
  if (p.equipements && p.equipements.length > 0) dbQuery = dbQuery.contains('equipements', p.equipements)

  const { data: biens, error } = await dbQuery
  if (error || !biens) return []

  return (biens as any[]).map((b) => {
    const medias = (b.biens_medias || []).slice().sort((a: any, b: any) => {
      if (a.est_couverture) return -1
      if (b.est_couverture) return 1
      return (a.ordre ?? 0) - (b.ordre ?? 0)
    })
    const photos = medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url).slice(0, 5)
    const videos = medias.filter((m: any) => m.type === 'video').map((m: any) => m.url).slice(0, 2)
    const prix = bogbesPrixLabel(b)
    return {
      source: 'bogbes' as const,
      id: b.id,
      url: `${SITE_URL}/biens/${b.id}`,
      reserve_url: `${SITE_URL}/biens/${b.id}#reserver`,
      titre: b.titre,
      type_bien: b.type_bien,
      commune: b.commune,
      quartier: b.quartier ?? null,
      prix: prix.label,
      prix_value: prix.value,
      surface_m2: b.surface_m2 ?? null,
      nb_pieces: b.nb_pieces ?? null,
      description: b.description ?? null,
      is_verifie: !!b.is_verifie,
      score_ia: typeof b.score_ia === 'number' ? b.score_ia : null,
      photos,
      videos,
    }
  })
}

async function fetchOffreFlashBiens(
  p: { commune?: string; type_bien?: string; q?: string },
  budgetMin: number | null,
  budgetMax: number | null
): Promise<BienCatalogue[]> {
  try {
    const sb = createLocauxClient() as any
    // SECURITY: whitelist explicite — JAMAIS de telephone/telephone_bien
    // exposés au LLM (qui pourrait les répéter dans ses réponses).
    let q = sb
      .from('locaux')
      .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,publie_par,meubles,chambre,disponible,surface,groupe_whatsapp_origine,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
      .eq('status', 'active')
      .eq('is_duplicate', false)
      .order('date_publication', { ascending: false })
      .limit(MAX_PER_SOURCE * 2) // marge pour filtrer is_actif après mapping

    if (p.commune) q = q.ilike('commune', `%${p.commune}%`)
    if (p.type_bien) q = q.ilike('type_de_bien', `%${p.type_bien}%`)
    if (budgetMin && budgetMax) {
      q = q.gte('prix_normalise', budgetMin).lte('prix_normalise', budgetMax)
    }
    if (p.q?.trim()) {
      const term = p.q.trim()
      q = q.or(`caracteristiques.ilike.%${term}%,message_initial.ilike.%${term}%`)
    }

    const { data, error } = await q
    if (error || !data) return []

    const mapped = (data as LocauxRow[])
      .map(mapLocauxRow)
      .filter((b: BienExterne) => b.is_actif)
      .slice(0, MAX_PER_SOURCE)

    return mapped.map((b) => {
      const prix = b.prix_label ?? (b.prix_value ? formatFCFA(b.prix_value) : 'Prix à confirmer')
      return {
        source: 'offre_flash' as const,
        id: String(b.id),
        url: `${SITE_URL}/offre-flash/${b.id}`,
        reserve_url: `https://wa.me/2250544872051?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par l'offre flash ${b.ref} (${b.titre})`)}`,
        titre: b.titre,
        type_bien: b.type_bien,
        commune: b.commune,
        quartier: b.quartier ?? null,
        prix,
        prix_value: b.prix_value,
        surface_m2: b.surface_m2,
        nb_pieces: b.nb_chambres,
        description: b.description || b.caracteristiques,
        is_verifie: false,
        score_ia: null,
        photos: b.image_url ? [b.image_url] : [],
        videos: [],
      }
    })
  } catch {
    return []
  }
}

export async function getAIBienContext(
  userMessage: string,
  history?: { role: string; content: string }[]
) {
  const supabase = await createClient()
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
  const budgetMin = budget ? Math.round(budget * (1 - BUDGET_MARGIN_PCT)) : null
  const budgetMax = budget ? Math.round(budget * (1 + BUDGET_MARGIN_PCT)) : null

  // Recherche en parallèle dans les 2 sources
  const [bogbes, offresFlash] = await Promise.all([
    fetchBogbesBiens(supabase, p, budgetMin, budgetMax),
    fetchOffreFlashBiens(p, budgetMin, budgetMax),
  ])

  // Merge avec priorité aux biens vérifiés BOGBE'S, puis offres flash récentes
  const allBiens: BienCatalogue[] = [...bogbes, ...offresFlash].slice(0, SAPPHIRE_MAX_RESULTS)

  if (allBiens.length === 0) {
    return `Aucun bien ne correspond exactement à ces critères, ni dans le catalogue BOGBE'S, ni dans les offres flash WhatsApp.
Dis au client que tu vas faire une recherche manuelle et que tu le recontactes rapidement.`
  }

  // En-tête avec récap des critères
  const critereLines: string[] = []
  if (p.commune) critereLines.push(`- Zone : ${p.commune}`)
  if (p.type_bien) critereLines.push(`- Type : ${p.type_bien}`)
  if (budget) critereLines.push(`- Budget client : ${formatFCFA(budget)} (intervalle accepté ±15% : ${formatFCFA(budgetMin!)} – ${formatFCFA(budgetMax!)})`)
  if (p.equipements?.length) critereLines.push(`- Équipements : ${p.equipements.join(', ')}`)

  const counts = {
    bogbes: bogbes.length,
    flash: offresFlash.length,
  }

  let context = `${allBiens.length} bien(s) trouvé(s) (max ${SAPPHIRE_MAX_RESULTS})\n`
  context += `Sources interrogées : Catalogue BOGBE'S (${counts.bogbes}) + Offres Flash WhatsApp (${counts.flash})\n`
  if (critereLines.length) context += `\nCRITÈRES STRICTS APPLIQUÉS :\n${critereLines.join('\n')}\n`
  context += '\n'

  allBiens.forEach((b, i) => {
    const sourceTag = b.source === 'bogbes' ? '[CATALOGUE BOGBE\'S]' : '[OFFRE FLASH WhatsApp]'
    const badges: string[] = []
    if (b.is_verifie) badges.push('✓ VÉRIFIÉ')
    if (typeof b.score_ia === 'number' && b.score_ia >= 80) badges.push('★ Top qualité')
    if (b.source === 'offre_flash') badges.push('⚡ Offre flash (récente, à valider rapidement)')

    context += `--- BIEN ${i + 1} ${sourceTag} ---\n`
    context += `ID: ${b.id}\n`
    context += `Source: ${b.source}\n`
    if (badges.length) context += `Badges: ${badges.join(' | ')}\n`
    context += `Titre: ${b.titre}\n`
    context += `Type: ${b.type_bien}\n`
    context += `Localisation: ${b.commune}${b.quartier ? ' / ' + b.quartier : ''}\n`
    context += `Prix: ${b.prix}\n`
    if (b.nb_pieces) context += `Pièces/chambres: ${b.nb_pieces}\n`
    if (b.surface_m2) context += `Surface: ${b.surface_m2} m²\n`
    if (b.description) context += `Description: ${b.description.slice(0, 220)}\n`
    if (b.photos.length > 0) context += `Photos disponibles (${b.photos.length}): ${b.photos.slice(0, 3).join(' | ')}\n`
    else context += `Pas de photos dans le catalogue pour ce bien.\n`
    if (b.videos.length > 0) context += `Vidéos disponibles (${b.videos.length}): ${b.videos.slice(0, 2).join(' | ')}\n`
    context += `Lien fiche: ${b.url}\n`
    context += `CTA visite/contact: ${b.reserve_url}\n`
    context += '\n'
  })

  if (counts.flash > 0) {
    context += `\nNOTE OFFRES FLASH :
Les biens taggés [OFFRE FLASH WhatsApp] proviennent de canaux WhatsApp publics scrapés en temps réel.
- Ils tournent vite : annonce-les comme "à valider rapidement, possiblement déjà loué/vendu".
- Le lien #reserver est remplacé par un lien WhatsApp direct vers notre conseiller (pour ces biens uniquement).
- Tu peux les présenter dans le même message que les biens BOGBE'S, mais en signalant la source : "(Offre flash)" ou "⚡".\n`
  }

  if (demandeMedia) {
    context += `\nINSTRUCTION MÉDIA OBLIGATOIRE:
Le client demande des photos/vidéos.
- Vérifie si "Photos disponibles" est listé pour le bien concerné ci-dessus.
- Si oui : prends la PREMIÈRE URL et ajoute EXACTEMENT [MEDIA: <URL>] à la FIN de ta réponse.
- Si "Pas de photos dans le catalogue" : dis "Je n'ai pas encore de photos pour ce bien dans notre système."
- N'invente AUCUNE URL.\n`
  }

  return context
}
