import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Agence, AgenceUpdateInput } from '@/lib/agences/types'

function getAdminClient() {
  return createSbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const EDITABLE_FIELDS: (keyof AgenceUpdateInput)[] = [
  'nom_commercial',
  'description',
  'logo_url',
  'telephone_public',
  'email_public',
  'rccm',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const admin = getAdminClient()

    // Vérifier que user est admin de l'agence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from('profiles')
      .select('agence_id, agence_role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.agence_id !== id || profile.agence_role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = (await request.json()) as AgenceUpdateInput
    const updates: Record<string, unknown> = {}
    for (const k of EDITABLE_FIELDS) {
      if (body[k] !== undefined) {
        const v = body[k]
        updates[k] = typeof v === 'string' ? v.trim() || null : v
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agence, error } = await (admin as any)
      .from('agences')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: agence as Agence })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
