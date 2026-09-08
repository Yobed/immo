import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAnnoncesPagedItemsStrict } from '@/lib/catalogue/consolidated'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  page: z.coerce.number().int().min(0).max(500).optional().default(0),
  limit: z.coerce.number().int().min(1).max(48).optional().default(24),
})

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres de recherche invalides' }, { status: 400 })
  try {
    const { q, page, limit } = parsed.data
    const result = await getAnnoncesPagedItemsStrict({ q, source: 'web' }, page, limit)
    const items = result.items.map(item => ({
      source: 'web' as const,
      id: item.sourceId,
      reference: `WEB-${item.sourceId}`,
      url: item.url,
      titre: item.titre,
      type_bien: item.type_bien,
      commune: item.commune,
      quartier: item.quartier,
      prix_fcfa: item.prix_value,
      prix_period: item.prix_period,
      prix_label: item.prix_label,
      surface_m2: item.surface_m2,
      nb_pieces: item.nb_pieces,
      photo_principale: item.photo_url,
    }))
    return NextResponse.json({
      items, total: result.total, page, limit,
      hasMore: (page + 1) * limit < result.total,
      generatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } })
  } catch {
    return NextResponse.json({ error: 'Annonces momentanément indisponibles' }, { status: 503 })
  }
}
