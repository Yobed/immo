import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await request.json()) as Record<string, any>

  const { data, error } = await (supabase.from('biens') as never as any)
    .update(body)
    .eq('id', id)
    .eq('proprietaire_id', user.id)
    .select('id, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Non trouvé ou non autorisé' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await (supabase.from('biens') as never as any)
    .delete()
    .eq('id', id)
    .eq('proprietaire_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
