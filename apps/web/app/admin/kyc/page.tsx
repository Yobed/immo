import { createAdminClient } from '@/lib/supabase/admin'
import { KycValidationCard } from './KycValidationCard'
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Page admin KYC — liste des utilisateurs ayant soumis leurs documents
 * d'identité (kyc_statut = 'en_cours') et permet de valider ou rejeter.
 *
 * Accès limité par AdminLayout (vérifie role='admin').
 */
export default async function AdminKycPage() {
  const supabase = createAdminClient()

  // 1. Pending (en_cours) — à valider en priorité
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingRaw } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, phone, role, kyc_statut, kyc_cni_url, kyc_selfie_url, created_at')
    .eq('kyc_statut', 'en_cours')
    .order('created_at', { ascending: false })

  // 2. Verifiés récents (audit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: verifiedRaw } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, email, phone, role, kyc_statut, created_at')
    .eq('kyc_statut', 'verifie')
    .order('created_at', { ascending: false })
    .limit(10)

  const pending = (pendingRaw ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    role: string | null
    kyc_statut: string
    kyc_cni_url: string | null
    kyc_selfie_url: string | null
    created_at: string
  }>

  const verified = (verifiedRaw ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string | null
    created_at: string
  }>

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[var(--accent-luxury)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">
            Vérification KYC
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Validation des documents d&apos;identité soumis par les propriétaires et clients.
        </p>
      </header>

      {/* Stats résumées */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            À valider
          </p>
          <p className="font-display text-3xl font-black text-amber-600 tabular-nums mt-1">
            {pending.length}
          </p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Récemment vérifiés
          </p>
          <p className="font-display text-3xl font-black text-emerald-600 tabular-nums mt-1">
            {verified.length}
          </p>
        </div>
      </div>

      {/* Liste à valider */}
      <section className="mb-12">
        <h2 className="font-display text-lg font-bold text-[var(--text)] mb-4">
          En attente de vérification ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[var(--surface-card)] border border-dashed border-[var(--border)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">
              Aucune demande KYC en attente. Tout est à jour.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <KycValidationCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </section>

      {/* Audit — derniers vérifiés */}
      {verified.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-[var(--text)] mb-3">
            Récemment vérifiés
          </h2>
          <ul className="divide-y divide-[var(--border)] bg-[var(--surface-card)] border border-[var(--border)] rounded-xl overflow-hidden">
            {verified.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text)] truncate">
                    {p.full_name || 'Sans nom'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {p.email} · {p.role ?? 'rôle inconnu'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Vérifié
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
