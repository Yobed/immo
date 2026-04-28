import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { verifyMagicLinkToken } from '@/lib/auth/magic-link-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

async function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Lien invalide</h1>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
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
    .select('id, titre, statut, proprietaire_id')
    .eq('id', payload.bien_id)
    .maybeSingle()

  if (!bien) {
    return ErrorScreen({ message: 'Annonce introuvable. Elle a peut-être été supprimée.' })
  }

  if (bien.proprietaire_id !== payload.user_id) {
    return ErrorScreen({ message: 'Ce lien ne correspond pas à cette annonce.' })
  }

  if (bien.statut === 'brouillon') {
    await admin.from('biens').update({ statut: 'publie' }).eq('id', bien.id)
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
