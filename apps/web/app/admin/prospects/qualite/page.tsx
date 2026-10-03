import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileText, Download } from 'lucide-react'
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Navigation secondaire CRM épurée */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
            <Link
              href="/admin/prospects"
              className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Pipeline & Leads
            </Link>
            <Link
              href="/admin/prospects/qualite"
              className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--surface-card)] text-[var(--text)] shadow-xs"
            >
              Qualité des données
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Doublons
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/fiche-visite"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span>Fiche vierge (PDF)</span>
            </a>
            <a
              href="/api/admin/prospects/export"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span>Exporter CSV</span>
            </a>
          </div>
        </div>

        {/* Titre */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">Qualité des données</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Contrôle d&apos;intégrité pour repérer les fiches incomplètes avant qu&apos;elles n&apos;affectent la relance.
          </p>
        </div>

        {fetchError && (
          <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
            {fetchError}
          </div>
        )}

        {/* Résumé compact */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {totalIssues > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-[var(--text)]">
              <strong>{totalIssues}</strong> anomalie(s) sur un total de <strong>{rows.length}</strong> fiches analysées.
            </span>
          </div>
          {totalIssues === 0 && (
            <span className="text-emerald-400 font-medium text-[11px]">Toutes les fiches sont complètes ✓</span>
          )}
        </div>

        {/* Grille des contrôles */}
        <div className="grid md:grid-cols-2 gap-3.5">
          {issues.map((issue) => (
            <section
              key={issue.key}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium text-[var(--text)] text-xs">{issue.label}</h2>
                <span className="text-[11px] font-mono text-[var(--text-subtle)]">
                  {issue.count}
                </span>
              </div>
              {issue.count > 0 ? (
                <div className="space-y-1 pt-1 border-t border-[var(--border)]/60">
                  {issue.examples.map((row) => (
                    <Link
                      key={row.id}
                      href={`/admin/prospects/${row.id}`}
                      className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--surface-hover)] text-xs text-[var(--text)] transition-colors"
                    >
                      <span className="font-medium truncate">{row.nom || 'Prospect sans nom'}</span>
                      <span className="text-[11px] text-[var(--text-subtle)] font-mono ml-2 shrink-0">
                        {row.phone ? `+225 ${row.phone.replace(/^225/, '')}` : 'sans numéro'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-subtle)] italic">Aucune anomalie</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
