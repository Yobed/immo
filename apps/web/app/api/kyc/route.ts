import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerUser } from '@/lib/server-auth'
import { requireAuth, requireAdmin } from '@/lib/auth/server'
import crypto from 'node:crypto'

function sameSecret(actual: string | null, expected: string | undefined): boolean {
  if (!actual || !expected) return false
  const a = Buffer.from(actual.trim())
  const b = Buffer.from(expected.trim())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function authorizeKycPatch(req: NextRequest): Promise<boolean> {
  const serviceKey = req.headers.get('x-service-key')
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
  if (sameSecret(serviceKey, process.env.SUPABASE_SERVICE_ROLE_KEY)) return true
  if (sameSecret(bearer, process.env.CRON_SECRET)) return true

  try {
    const { user } = await requireAuth(req)
    await requireAdmin(user.id)
    return true
  } catch {
    return false
  }
}

// POST /api/kyc — utilisateur soumet ses documents KYC
export async function POST(req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await req.json() as { cniUrl?: string; selfieUrl?: string }
  if (!body.cniUrl || !body.selfieUrl) {
    return NextResponse.json({ error: 'cniUrl et selfieUrl requis' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      kyc_cni_url: body.cniUrl,
      kyc_selfie_url: body.selfieUrl,
      kyc_statut: 'en_cours',
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/kyc — admin webhook pour valider/rejeter le KYC
export async function PATCH(req: NextRequest) {
  if (!(await authorizeKycPatch(req))) {
    return NextResponse.json({ error: 'Authentification admin ou clé interne requise' }, { status: 401 })
  }

  // Le client service-role est utilisé uniquement après l'autorisation ci-dessus.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const body = await req.json() as { userId?: string; statut?: string }
  if (!body.userId || !body.statut) {
    return NextResponse.json({ error: 'userId et statut requis' }, { status: 400 })
  }

  const validStatuts = ['verifie', 'non_verifie']
  if (!validStatuts.includes(body.statut)) {
    return NextResponse.json({ error: 'statut invalide' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ kyc_statut: body.statut })
    .eq('id', body.userId)
    .select('id')
    .maybeSingle()

  if (!updated && !error) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si KYC validé, insérer une notification
  if (body.statut === 'verifie') {
    await supabase
      .from('notifications')
      .insert({
        user_id: body.userId,
        type: 'kyc_valide',
        titre: 'Identité vérifiée',
        contenu: 'Votre profil est maintenant vérifié KYC.',
      })
  }

  return NextResponse.json({ ok: true })
}
