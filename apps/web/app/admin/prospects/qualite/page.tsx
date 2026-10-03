import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck, Users, RotateCcw, FileText, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProspectRow = {
  id: string
  nom: string | null
  phone: string | null
  commune: string | null
  type_bien: string | null
  statut: string
  assigned_to: string | null
}

async function fetchAllProspects(admin: ReturnType<typeof createAdminClient>, maxRows = 3000): Promise<{ rows: ProspectRow[]; error?: string }> {
  const pageSize = 1000
  const rows: ProspectRow[] = []
  try {
    for (let from = 0; from < maxRows; from += pageSize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .from('prospects')
        .select('id, nom, phone, commune, type_bien, statut, assigned_to')
        .order('last_seen', { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) return { rows: [], error: `Impossible de charger la qualité CRM : ${error.message}` }
      const batch = (data ?? []) as ProspectRow[]
      rows.push(...batch)
      if (batch.length < pageSize) return { rows }
    }
    return { rows }
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

export default async function ProspectQualityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/prospects/qualite')
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any).from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') redirect('/login?next=/admin/prospects/qualite')
  const { rows, error: fetchError } = await fetchAllProspects(admin)

  const checks = [
    { key: 'phone', label: 'Téléphone manquant', test: (r: ProspectRow) => !r.phone },
    { key: 'nom', label: 'Nom du contact manquant', test: (r: ProspectRow) => !r.nom },
    { key: 'commune', label: 'Commune non renseignée', test: (r: ProspectRow) => !r.commune },
    { key: 'type_bien', label: 'Type de bien manquant', test: (r: ProspectRow) => !r.type_bien },
    { key: 'assigned_to', label: 'Conseiller non assigné', test: (r: ProspectRow) => !r.assigned_to && !['gagne', 'perdu', 'traite'].includes(r.statut) },
  ]
  const issues = checks.map((check) => ({
    ...check,
    count: rows.filter(check.test).length,
    examples: rows.filter(check.test).slice(0, 5),
  }))
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)

  return (
    <main className="min-h-screen bg-[var(--surface-hover)] pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Navigation secondaire CRM */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/prospects"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pipeline CRM</span>
            </Link>
            <Link
              href="/admin/prospects/qualite"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-luxury)] text-[#0b1530] shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Qualité CRM</span>
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Doublons</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/api/admin/fiche-visite"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-[var(--accent-luxury)]" />
              <span>Fiche de visite (PDF)</span>
            </a>
            <a
              href="/api/admin/prospects/export"
              className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </a>
          </div>
        </div>

        {/* Titre */}
        <header>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Qualité des données CRM</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Détection automatique des fiches incomplètes pour préserver la qualité de la relance commerciale.
          </p>
        </header>

        {fetchError && (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
            {fetchError}
          </div>
        )}

        {/* Synthèse anomalie */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 md:p-6 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            totalIssues ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            {totalIssues ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-3xl font-black font-display text-[var(--text)] tabular-nums">{totalIssues}</p>
            <p className="text-xs text-[var(--text-muted)]">
              anomalie(s) identifiée(s) sur un total de {rows.length} fiches prospects analysées
            </p>
          </div>
        </div>

        {/* Grille des contrôles */}
        <div className="grid md:grid-cols-2 gap-4">
          {issues.map((issue) => (
            <section
              key={issue.key}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-[var(--text)] text-sm">{issue.label}</h2>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  issue.count > 0
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  {issue.count} anomalie{issue.count > 1 ? 's' : ''}
                </span>
              </div>
              {issue.count > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[var(--text-subtle)] font-medium">Exemples à corriger :</p>
                  {issue.examples.map((row) => (
                    <Link
                      key={row.id}
                      href={`/admin/prospects/${row.id}`}
                      className="block rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] hover:text-[var(--accent-luxury)] hover:border-[var(--accent-luxury)]/40 transition-colors"
                    >
                      <span className="font-bold">{row.nom || 'Prospect sans nom'}</span>
                      <span className="text-[var(--text-muted)] font-mono ml-2">
                        {row.phone ? `+225 ${row.phone.replace(/^225/, '')}` : 'aucun numéro'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">Aucune anomalie détectée sur ce critère ✓</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
