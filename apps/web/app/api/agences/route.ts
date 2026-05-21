import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSbAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { slugify, type Agence, type AgenceCreateInput } from '@/lib/agences/types'

function getAdminClient() {
  return createSbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function ensureUniqueSlug(admin: ReturnType<typeof getAdminClient>, base: string): Promise<string> {
  let candidate = base
  let i = 0
  while (i < 8) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('agences').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    i++
    const suffix = Math.random().toString(36).slice(2, 6)
    candidate = `${base}-${suffix}`
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await request.json()) as AgenceCreateInput
    const nom = body?.nom_commercial?.trim()
    if (!nom || nom.length < 2) {
      return NextResponse.json({ error: 'Nom commercial requis (min 2 caractères)' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Vérifier que l'utilisateur n'a pas déjà une agence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (admin as any)
      .from('profiles')
      .select('agence_id, agence_role')
      .eq('id', user.id)
      .single()

    if (existingProfile?.agence_id) {
      return NextResponse.json(
        { error: 'Vous êtes déjà rattaché à une agence' },
        { status: 409 },
      )
    }

    const baseSlug = slugify(nom)
    if (!baseSlug) {
      return NextResponse.json({ error: 'Nom commercial invalide' }, { status: 400 })
    }
    const slug = await ensureUniqueSlug(admin, baseSlug)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agence, error: insertErr } = await (admin as any)
      .from('agences')
      .insert({
        slug,
        nom_commercial: nom,
        description: body.description?.trim() || null,
        telephone_public: body.telephone_public?.trim() || null,
        email_public: body.email_public?.trim() || null,
        rccm: body.rccm?.trim() || null,
        kyc_statut: 'en_attente',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertErr || !agence) {
      return NextResponse.json({ error: insertErr?.message || 'Erreur création' }, { status: 500 })
    }

    // Rattacher le créateur en admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: linkErr } = await (admin as any)
      .from('profiles')
      .update({ agence_id: agence.id, agence_role: 'admin' })
      .eq('id', user.id)

    if (linkErr) {
      // Rollback agence
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('agences').delete().eq('id', agence.id)
      return NextResponse.json({ error: linkErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: agence as Agence })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
