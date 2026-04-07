import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  // Vérifier que la notification appartient à l'utilisateur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: notif } = await (supabase as any)
    .from('notifications')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!notif || (notif as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ lu: true })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
