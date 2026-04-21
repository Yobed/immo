import { createClient } from '@/lib/supabase/server'
import { parseSearchQuery } from '../searchParser'

export async function getAIBienContext(userMessage: string) {
  const supabase = await createClient()
  const p = parseSearchQuery(userMessage)
  
  // Si aucun critère n'est détecté et que la phrase est trop courte, on ne cherche pas
  if (!p.commune && !p.type_bien && !p.prix_max && (!p.q || p.q.length < 3)) {
    return null
  }

  let dbQuery = (supabase as any)
    .from('biens')
    .select(`
      id, titre, commune, quartier, type_bien, 
      prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, 
      nb_pieces, surface_m2, 
      biens_medias(id, url, type, est_couverture)
    `)
    .eq('statut', 'publie')
    .limit(5)

  if (p.q?.trim()) {
    dbQuery = dbQuery.textSearch('fts', p.q.trim(), { type: 'plain', config: 'french' })
  }
  if (p.commune) dbQuery = dbQuery.ilike('commune', `%${p.commune}%`)
  if (p.type_bien) dbQuery = dbQuery.eq('type_bien', p.type_bien)
  if (p.prix_max) {
      dbQuery = dbQuery.lte('prix_mois_fcfa', parseInt(p.prix_max))
  }
  if (p.equipements && p.equipements.length > 0) {
      dbQuery = dbQuery.contains('equipements', p.equipements)
  }

  const { data: biens } = await dbQuery

  if (!biens || biens.length === 0) return "Aucun bien ne correspond exactement à ces critères dans notre catalogue actuel."

  let context = "Voici les biens trouvés dans notre catalogue qui pourraient intéresser le client :\n"
  biens.forEach((b: any, i: number) => {
    const prix = b.prix_nuit_fcfa ? `${b.prix_nuit_fcfa} FCFA/nuit` : (b.prix_vente_fcfa ? `${b.prix_vente_fcfa} FCFA` : `${b.prix_mois_fcfa} FCFA/mois`)
    const medias = b.biens_medias || [];
    const photos = medias.filter((m: any) => m.type === 'photo');
    const videos = medias.filter((m: any) => m.type === 'video');
    
    // Fournir de vrais liens médias afin que l'IA puisse les répondre
    const photosStr = photos.length > 0 ? ` [Photos: ${photos.map((m:any) => m.url).slice(0,2).join(', ')}]` : '';
    const videoStr = videos.length > 0 ? ` [Vidéo: ${videos.map((m:any) => m.url)[0]}]` : '';
    
    context += `${i+1}. [ID: ${b.id}] ${b.titre} à ${b.commune}${b.quartier ? ' ('+b.quartier+')' : ''}. Type: ${b.type_bien}. Prix: ${prix}. ${b.nb_pieces ? b.nb_pieces+' pièces' : ''} ${b.surface_m2 ? b.surface_m2+'m²' : ''}.${photosStr}${videoStr}\n`
  })
  context += "\nImportant: Si le client te demande des photos ou des vidéos, renvoie-lui l'un des liens d'images (se terminant par .jpg, .png, etc.) ou de vidéos (.mp4) présents dans le catalogue. Mets le lien en fin de message pour qu'il soit détecté. Propose également le lien vers la plateforme: https://immo-ci.com/biens/[ID]."
  
  return context
}
