import { redirect } from 'next/navigation'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { verifyMagicLinkToken } from '@/lib/auth/magic-link-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { wasenderSendMessage } from '@/lib/wasender'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

async function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[var(--surface-hover)] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-[var(--surface-card)] rounded-3xl p-8 shadow-xl border border-[var(--border)] text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">Lien invalide</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">{message}</p>
        <Link
          href="/"
          className="inline-block px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}

export default async function ConfirmerPage({ params }: PageProps) {
  const { token } = await params
  const payload = await verifyMagicLinkToken(token)

  if (!payload) {
    return ErrorScreen({ message: 'Le lien est invalide ou expiré (max 7 jours).' })
  }

  const admin = createAdminClient()

  const { data: bien } = await admin
    .from('biens')
    .select('id, titre, statut, commune, quartier, proprietaire_id')
    .eq('id', payload.bien_id)
    .maybeSingle()

  if (!bien) {
    return ErrorScreen({ message: 'Annonce introuvable. Elle a peut-être été supprimée.' })
  }

  if (bien.proprietaire_id !== payload.user_id) {
    return ErrorScreen({ message: 'Ce lien ne correspond pas à cette annonce.' })
  }

  const wasDraft = bien.statut === 'brouillon'
  if (wasDraft) {
    await admin.from('biens').update({ statut: 'publie' }).eq('id', bien.id)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^﻿/, '') || 'https://bogbes-groupe.vercel.app'
    const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
    const text = `✅ *BOGBE'S GROUPE* — Votre annonce est publiée !

🏠 *${bien.titre}*${lieu ? `\n📍 ${lieu}` : ''}

Voir votre annonce en ligne :
${baseUrl}/biens/${bien.id}

Gérer / modifier vos biens :
${baseUrl}/mes-biens

Merci de faire confiance à BOGBE'S GROUPE 💎`

    await wasenderSendMessage(payload.phone, text, 'text').catch(() => null)
  }

  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: `${payload.phone.replace(/\D/g, '')}@phone.tally.ci`,
  })

  const otpToken = linkData?.properties?.hashed_token
  if (otpToken) {
    const supabase = await createServerClient()
    await supabase.auth.verifyOtp({ token_hash: otpToken, type: 'magiclink' })
  }

  redirect(`/biens/${bien.id}?published=1`)
}
