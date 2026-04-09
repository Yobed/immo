import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerUser } from '@/lib/server-auth'

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
  // Utilise service role — pas de vérif auth (webhook admin uniquement)
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

  const { error } = await supabase
    .from('profiles')
    .update({ kyc_statut: body.statut })
    .eq('id', body.userId)

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
