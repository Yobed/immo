import { createClient } from '@/lib/supabase/server'
import { parseSearchQuery } from '../searchParser'

export async function getAIBienContext(userMessage: string) {
  const supabase = await createClient()
  const p = parseSearchQuery(userMessage)

  // Détecter si le client demande des images/photos/vidéos
  const demandeMedia = /photo|image|voir|envoie|montre|aperçu|visu|vid[eé]o/i.test(userMessage)

  // Si aucun critère immobilier détecté et pas de demande de média, pas de recherche
  if (!p.commune && !p.type_bien && !p.prix_max && !p.q && !demandeMedia) {
    return null
  }

  let dbQuery = (supabase as any)
    .from('biens')
    .select(`
      id, titre, commune, quartier, type_bien,
      prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
      nb_pieces, surface_m2, description, equipements,
      biens_medias(id, url, type, est_couverture, ordre)
    `)
    .eq('statut', 'publie')
    .limit(5)

  if (p.q?.trim()) {
    dbQuery = dbQuery.textSearch('fts', p.q.trim(), { type: 'plain', config: 'french' })
  }
  if (p.commune) dbQuery = dbQuery.ilike('commune', `%${p.commune}%`)
  if (p.type_bien) dbQuery = dbQuery.eq('type_bien', p.type_bien)
  if (p.prix_max) dbQuery = dbQuery.lte('prix_mois_fcfa', parseInt(p.prix_max))
  if (p.equipements && p.equipements.length > 0) dbQuery = dbQuery.contains('equipements', p.equipements)

  const { data: biens } = await dbQuery

  if (!biens || biens.length === 0) {
    return `Aucun bien ne correspond exactement à ces critères dans notre catalogue actuellement publié.
Dis au client que tu vas faire une recherche manuelle et que tu le recontactes rapidement.`
  }

  let context = `${biens.length} bien(s) trouvé(s) dans notre catalogue :\n\n`

  biens.forEach((b: any, i: number) => {
    const prix = b.prix_nuit_fcfa
      ? `${b.prix_nuit_fcfa.toLocaleString()} FCFA/nuit`
      : b.prix_vente_fcfa
        ? `${b.prix_vente_fcfa.toLocaleString()} FCFA (vente)`
        : b.prix_mois_fcfa
          ? `${b.prix_mois_fcfa.toLocaleString()} FCFA/mois`
          : 'Prix à confirmer'

    const medias = (b.biens_medias || []).sort((a: any, b: any) => {
      if (a.est_couverture) return -1
      if (b.est_couverture) return 1
      return a.ordre - b.ordre
    })

    const photos = medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url)
    const videos = medias.filter((m: any) => m.type === 'video').map((m: any) => m.url)

    context += `--- BIEN ${i + 1} ---\n`
    context += `ID: ${b.id}\n`
    context += `Titre: ${b.titre}\n`
    context += `Type: ${b.type_bien}\n`
    context += `Localisation: ${b.commune}${b.quartier ? ' / ' + b.quartier : ''}\n`
    context += `Prix: ${prix}\n`
    if (b.nb_pieces) context += `Pièces: ${b.nb_pieces}\n`
    if (b.surface_m2) context += `Surface: ${b.surface_m2} m²\n`
    if (b.description) context += `Description: ${b.description.slice(0, 200)}\n`
    if (photos.length > 0) context += `Photos disponibles (${photos.length}): ${photos.slice(0, 5).join(' | ')}\n`
    if (videos.length > 0) context += `Vidéos disponibles (${videos.length}): ${videos.slice(0, 2).join(' | ')}\n`
    if (photos.length === 0 && videos.length === 0) context += `Pas encore de médias pour ce bien.\n`
    context += `Lien fiche: https://immo-sigma.vercel.app/biens/${b.id}\n`
    context += '\n'
  })

  if (demandeMedia) {
    context += `IMPORTANT: Le client demande des photos/vidéos. Envoie-lui UNE photo réelle depuis les URLs ci-dessus en utilisant le format [MEDIA: URL] à la fin de ton message. N'invente aucune URL.\n`
  }

  return context
}
