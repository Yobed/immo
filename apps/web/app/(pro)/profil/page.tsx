import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KYCStatusBadge } from '@/components/kyc/KYCStatusBadge'
import { KYCUploader } from '@/components/kyc/KYCUploader'
import { ProfileEditForm } from '@/components/profil/ProfileEditForm'

type KYCStatut = 'non_verifie' | 'en_cours' | 'verifie'

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  kyc_statut: KYCStatut
  kyc_cni_url: string | null
  kyc_selfie_url: string | null
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, phone, email, kyc_statut, kyc_cni_url, kyc_selfie_url')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null
  const kycStatut: KYCStatut = p?.kyc_statut ?? 'non_verifie'

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        <h1 className="font-display text-3xl text-[var(--text)]">Mon profil</h1>

        {/* Informations de base */}
        <section className="bg-[var(--surface-card)] rounded-card shadow-card p-6 space-y-4">
          <h2 className="font-display text-xl text-[var(--text)]">Informations personnelles</h2>

          <div className="space-y-4">
            <div className="pb-3 border-b border-[var(--border)]">
              <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">Email</label>
              <p className="font-sans text-sm text-muted">{p?.email ?? user.email ?? '—'}</p>
              <p className="text-xs text-muted font-sans mt-0.5">L&apos;email ne peut pas être modifié ici.</p>
            </div>
            <ProfileEditForm
              initialNom={p?.full_name ?? ''}
              initialTelephone={p?.phone ?? ''}
              userId={user.id}
            />
          </div>
        </section>

        {/* Section KYC */}
        <section className="bg-[var(--surface-card)] rounded-card shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-[var(--text)]">Vérification d'identité (KYC)</h2>
            <KYCStatusBadge statut={kycStatut} />
          </div>

          {kycStatut === 'verifie' && (
            <div className="bg-accent-light/20 border border-accent/30 rounded-card p-4 text-sm font-sans text-accent flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              Identité vérifiée — badge affiché sur vos annonces
            </div>
          )}

          {kycStatut === 'en_cours' && (
            <div className="bg-warning/10 border border-warning/30 rounded-card p-4 text-sm font-sans text-warning">
              Documents soumis — vérification en cours (2-3 jours ouvrés)
            </div>
          )}

          {kycStatut === 'non_verifie' && (
            <KYCUploader userId={user.id} currentStatut={kycStatut} />
          )}
        </section>
      </div>
    </main>
  )
}
