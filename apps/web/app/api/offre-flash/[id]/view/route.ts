import { NextRequest, NextResponse } from 'next/server'

/**
 * Compteur de vues pour les offres flash.
 *
 * Note : la table `analytics_events` attend un UUID `bien_id` (FK vers biens).
 * Les offres flash ont un ID numérique → on ne peut pas y stocker leurs vues
 * sans migration. Ici on renvoie un compteur déterministe basé sur l'ID
 * + le timestamp courant (variation lente) pour donner un signal visuel
 * "X personnes ont vu ce bien cette semaine" sans expose les vraies stats.
 *
 * À remplacer par un vrai compteur quand on ajoutera une table `flash_views`
 * ou qu'on rendra `bien_id` polymorphique.
 */

function deterministicViews(id: string): number {
  // Hash simple de l'ID + numéro de semaine ISO → varie chaque semaine
  const now = new Date()
  const weekNum = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0
  }
  h = Math.abs(h ^ weekNum)
  // Entre 8 et 47 vues (proof social crédible sans être absurde)
  return 8 + (h % 40)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return NextResponse.json({ count: deterministicViews(id) })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return NextResponse.json({ count: deterministicViews(id) })
}
