import { NextResponse } from 'next/server'
import { getConsolidatedBienById } from '@/lib/catalogue/consolidated'
import { publicDescription } from '@/lib/catalogue/public-description'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const requestedSource = new URL(request.url).searchParams.get('source') ?? 'web'
  const source = requestedSource === 'bogbes' ? 'bogbes' : requestedSource.startsWith('flash') ? 'flash' : requestedSource === 'web' ? 'web' : null
  if (!source || (source === 'bogbes' ? !/^[0-9a-f-]{36}$/i.test(id) : !/^\d+$/.test(id))) {
    return NextResponse.json({ error: 'Référence invalide' }, { status: 400 })
  }
  try {
    const item = await getConsolidatedBienById(source, id)
    if (!item) return NextResponse.json({ error: 'Annonce introuvable ou indisponible' }, { status: 404 })
    return NextResponse.json({
      source: requestedSource,
      id: item.sourceId,
      reference: source === 'web' ? `WEB-${item.sourceId}` : source === 'bogbes' ? `BOGBES-${item.sourceId.slice(0, 8).toUpperCase()}` : `FLASH-${item.sourceId}`,
      url: item.url,
      titre: item.titre,
      commune: item.commune,
      quartier: item.quartier,
      type_bien: item.type_bien,
      description: publicDescription(item.description),
      prix_fcfa: item.prix_value,
      prix_period: item.prix_period,
      prix_label: item.prix_label,
      surface_m2: item.surface_m2,
      nb_pieces: item.nb_pieces,
      photos: [item.photo_url, ...item.photos].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index),
    }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch {
    return NextResponse.json({ error: 'Annonce momentanément indisponible' }, { status: 503 })
  }
}
