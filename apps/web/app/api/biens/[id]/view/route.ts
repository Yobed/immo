import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  )

  // Fire-and-forget insert — do not await before counting
  supabase
    .from('analytics_events')
    .insert({ event_type: 'vue_bien', bien_id: id })
    .then(() => {}) // intentionally fire-and-forget

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'vue_bien')
    .eq('bien_id', id)
    .gte('created_at', since)

  return NextResponse.json({ count: count ?? 0 })
}
