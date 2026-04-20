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
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, nb_pieces, surface_m2')
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
    context += `${i+1}. [ID: ${b.id}] ${b.titre} à ${b.commune}${b.quartier ? ' ('+b.quartier+')' : ''}. Type: ${b.type_bien}. Prix: ${prix}. ${b.nb_pieces ? b.nb_pieces+' pièces' : ''} ${b.surface_m2 ? b.surface_m2+'m²' : ''}.\n`
  })
  context += "\nImportant: Si le client est intéressé par l'un de ces biens, propose-lui de cliquer sur le lien direct ou de passer sur WhatsApp."
  
  return context
}
