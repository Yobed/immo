import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  )
}

async function countViews(bienId: string): Promise<number> {
  const supabase = getServiceClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'vue_bien')
    .eq('bien_id', bienId)
    .gte('created_at', since)
  return count ?? 0
}

/** POST: enregistre une vue + retourne le compteur 7 derniers jours. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(req, { scope: 'bien-view', max: 30, windowMs: 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)
  const { id } = await params
  const supabase = getServiceClient()

  // Fire-and-forget insert — do not await before counting
  supabase
    .from('analytics_events')
    .insert({ event_type: 'vue_bien', bien_id: id })
    .then(() => {}) // intentionally fire-and-forget

  return NextResponse.json({ count: await countViews(id) })
}

/** GET: retourne uniquement le compteur (lecture seule, pas d'insert). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(req, { scope: 'bien-view-read', max: 60, windowMs: 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)
  const { id } = await params
  return NextResponse.json({ count: await countViews(id) })
}
