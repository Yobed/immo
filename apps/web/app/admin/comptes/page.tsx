import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Building2, KeyRound, Home, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Page admin Comptes — liste TOUS les comptes (propriétaires, agences,
 * locataires, admins), les plus récents en premier. Créée car les admins
 * n'avaient aucun écran pour voir les inscriptions (le KYC ne montre que
 * ceux qui ont soumis des documents).
 *
 * Accès limité par AdminLayout (vérifie role='admin').
 */

const ROLE_LABELS: Record<string, string> = {
  proprietaire: 'Propriétaire',
  agence: 'Agence',
  locataire: 'Locataire',
  admin: 'Admin',
}

const ROLE_BADGE: Record<string, string> = {
  proprietaire: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  agence: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  locataire: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  admin: 'bg-red-500/10 text-red-700 border-red-500/20',
}

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  verifie: { label: 'KYC vérifié', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  en_cours: { label: 'KYC à valider', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  rejete: { label: 'KYC rejeté', cls: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

export default async function AdminComptesPage({ searchParams }: PageProps) {
  const { role: roleFilter } = await searchParams
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('profiles')
    .select('id, full_name, email, phone, role, kyc_statut, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (roleFilter && ROLE_LABELS[roleFilter]) q = q.eq('role', roleFilter)
  const { data: rows } = await q

  const profiles = (rows ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    role: string | null
    kyc_statut: string | null
    created_at: string
  }>

  // Nombre de biens par compte (une seule requête agrégée)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biensRaw } = await (supabase as any)
    .from('biens')
    .select('proprietaire_id')
  const biensCount = new Map<string, number>()
  for (const b of (biensRaw ?? []) as { proprietaire_id: string | null }[]) {
    if (b.proprietaire_id) biensCount.set(b.proprietaire_id, (biensCount.get(b.proprietaire_id) ?? 0) + 1)
  }

  const now = Date.now()
  const isNew = (iso: string) => now - new Date(iso).getTime() < 7 * 24 * 3_600_000

  const stats = {
    total: profiles.length,
    proprietaires: profiles.filter((p) => p.role === 'proprietaire').length,
    agences: profiles.filter((p) => p.role === 'agence').length,
    nouveaux7j: profiles.filter((p) => isNew(p.created_at)).length,
  }

  const filters: Array<{ key: string | null; label: string }> = [
    { key: null, label: 'Tous' },
    { key: 'proprietaire', label: 'Propriétaires' },
    { key: 'agence', label: 'Agences' },
    { key: 'locataire', label: 'Locataires' },
    { key: 'admin', label: 'Admins' },
  ]

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">
            Comptes
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Toutes les inscriptions (propriétaires, agences, locataires), les plus récentes en premier.
        </p>
      </header>

      {/* Stats résumées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Affichés
          </p>
          <p className="font-display text-3xl font-black text-[var(--text)] tabular-nums mt-1">{stats.total}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 inline-flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Propriétaires
          </p>
          <p className="font-display text-3xl font-black text-blue-600 tabular-nums mt-1">{stats.proprietaires}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700 inline-flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Agences
          </p>
          <p className="font-display text-3xl font-black text-purple-600 tabular-nums mt-1">{stats.agences}</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Nouveaux (7 j)
          </p>
          <p className="font-display text-3xl font-black text-emerald-600 tabular-nums mt-1">{stats.nouveaux7j}</p>
        </div>
      </div>

      {/* Filtres par rôle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map((f) => {
          const active = (roleFilter ?? null) === f.key || (!roleFilter && f.key === null)
          return (
            <Link
              key={f.label}
              href={f.key ? `/admin/comptes?role=${f.key}` : '/admin/comptes'}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                active
                  ? 'bg-[var(--text)] text-[var(--surface-card)] border-[var(--text)]'
                  : 'bg-[var(--surface-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Liste */}
      {profiles.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">Aucun compte pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const kyc = p.kyc_statut ? KYC_BADGE[p.kyc_statut] : null
            const nBiens = biensCount.get(p.id) ?? 0
            return (
              <div
                key={p.id}
                className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[var(--text)] text-sm truncate">
                      {p.full_name || '(sans nom)'}
                    </span>
                    {isNew(p.created_at) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white">
                        Nouveau
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${ROLE_BADGE[p.role ?? ''] ?? ROLE_BADGE.locataire}`}
                    >
                      {ROLE_LABELS[p.role ?? ''] ?? p.role ?? '—'}
                    </span>
                    {kyc && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1 ${kyc.cls}`}>
                        <ShieldCheck className="w-3 h-3" /> {kyc.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {[p.email, p.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[var(--text)]">
                    {nBiens > 0 ? `${nBiens} bien${nBiens > 1 ? 's' : ''}` : 'Aucun bien'}
                  </p>
                  <p className="text-[11px] text-[var(--text-subtle)]">
                    Inscrit le{' '}
                    {new Date(p.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
