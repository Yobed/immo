import { NextResponse } from 'next/server'
import { createAnnoncesClient } from '@/lib/supabase/annonces'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  try {
    // Service role is used only server-side; the mobile app receives public data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (createAnnoncesClient() as any)
      .from('v_annonces')
      .select('id,titre,type_bien,commune,quartier,prix_fcfa,periodicite,surface_m2,nb_pieces,photo_principale,photos')
      .eq('actif', true)
      .order('vu_le', { ascending: false })
      .limit(100)
    if (search) query = query.or(`titre.ilike.%${search}%,commune.ilike.%${search}%,quartier.ilike.%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ items: data ?? [] }, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } })
  } catch {
    return NextResponse.json({ items: [], error: 'annonces indisponibles' }, { status: 503 })
  }
}
