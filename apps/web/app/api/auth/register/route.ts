import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * Inscription email/mot de passe côté serveur.
 *
 * Pourquoi pas le signUp client classique : il déclenche l'envoi d'un mail de
 * confirmation, et le service e-mail intégré de Supabase est plafonné (~3-4/h).
 * Sous le trafic pub, /signup renvoyait 429 over_email_send_rate_limit → compte
 * JAMAIS créé → prospects perdus. Ici on crée le compte déjà confirmé via
 * l'API admin (aucun mail), le client enchaîne avec signInWithPassword.
 */
const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
  role: z.enum(['locataire', 'proprietaire', 'agence']),
  referral_code: z.string().max(40).nullish(),
})

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { scope: 'auth-register', max: 5, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Informations invalides.' }, { status: 400 })
  }
  const { full_name, email, password, role, referral_code } = parsed.data

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // aucun mail envoyé → contourne le rate limit Supabase
    user_metadata: { full_name, role, referral_code: referral_code ?? null },
  })

  if (error) {
    const already = /registered|already|exists|duplicate/i.test(error.message)
    return NextResponse.json(
      { error: already ? 'already' : "Une erreur est survenue lors de l'inscription." },
      { status: already ? 409 : 500 },
    )
  }
  return NextResponse.json({ ok: true })
}
