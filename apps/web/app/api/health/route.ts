import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAnnoncesClient } from '@/lib/supabase/annonces'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public liveness/readiness probe. It deliberately exposes no counts, keys or database errors. */
export async function GET() {
  const checks = await Promise.allSettled([
    (async () => {
      const { error } = await (createAdminClient() as any).from('profiles').select('id', { head: true, count: 'exact' })
      if (error) throw error
    })(),
    (async () => {
      const { error } = await (createAnnoncesClient() as any).from('v_annonces').select('id', { head: true, count: 'exact' }).gt('nb_photos', 0)
      if (error) throw error
    })(),
  ])
  const supabase = checks[0]?.status === 'fulfilled'
  const catalogue = checks[1]?.status === 'fulfilled'
  const ok = supabase && catalogue
  return NextResponse.json(
    { status: ok ? 'ok' : 'degraded', checks: { supabase, catalogue }, generatedAt: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
