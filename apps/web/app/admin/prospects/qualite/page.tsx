import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type ProspectRow = {
  id: string
  nom: string | null
  phone: string | null
  email: string | null
  commune: string | null
  type_bien: string | null
  statut: string
  assigned_to: string | null
}

async function fetchAllProspects(admin: ReturnType<typeof createAdminClient>): Promise<ProspectRow[]> {
  const pageSize = 1000
  const rows: ProspectRow[] = []
  for (let from = 0; ; from += pageSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('prospects')
      .select('id, nom, phone, email, commune, type_bien, statut, assigned_to')
      .order('last_seen', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Impossible de charger la qualité CRM : ${error.message}`)
    const batch = (data ?? []) as ProspectRow[]
    rows.push(...batch)
    if (batch.length < pageSize) return rows
  }
}

export default async function ProspectQualityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/prospects/qualite')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()
  const admin = createAdminClient()
  const rows = await fetchAllProspects(admin)
  const checks = [
    { key: 'phone', label: 'Téléphone manquant', test: (r: typeof rows[number]) => !r.phone },
    { key: 'nom', label: 'Nom manquant', test: (r: typeof rows[number]) => !r.nom },
    { key: 'commune', label: 'Commune manquante', test: (r: typeof rows[number]) => !r.commune },
    { key: 'type_bien', label: 'Type de bien manquant', test: (r: typeof rows[number]) => !r.type_bien },
    { key: 'assigned_to', label: 'Conseiller non assigné', test: (r: typeof rows[number]) => !r.assigned_to && !['gagne', 'perdu', 'traite'].includes(r.statut) },
  ]
  const issues = checks.map((check) => ({ ...check, count: rows.filter(check.test).length, examples: rows.filter(check.test).slice(0, 5) }))
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)
  return <main className="min-h-screen bg-[var(--surface-hover)]"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-8"><Link href="/admin/performance" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-5"><ArrowLeft className="w-4 h-4" /> Retour à Performance</Link><header className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)] mb-2">Fiabilité CRM</p><h1 className="text-2xl font-black text-[var(--text)]">Qualité des données</h1><p className="text-sm text-[var(--text-muted)] mt-1">Les fiches incomplètes sont signalées avant qu’elles ne faussent le suivi commercial.</p></header><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 mb-6"><div className="flex items-center gap-3">{totalIssues ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}<div><p className="text-2xl font-black text-[var(--text)]">{totalIssues}</p><p className="text-xs text-[var(--text-muted)]">anomalies sur {rows.length} prospects analysés</p></div></div></div><div className="grid md:grid-cols-2 gap-4">{issues.map((issue) => <section key={issue.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[var(--text)]">{issue.label}</h2><span className={`text-sm font-black ${issue.count ? 'text-amber-700' : 'text-emerald-700'}`}>{issue.count}</span></div>{issue.count > 0 && <div className="mt-4 space-y-2">{issue.examples.map((row) => <Link key={row.id} href={`/admin/prospects/${row.id}`} className="block rounded-lg bg-[var(--surface-hover)] px-3 py-2 text-xs text-[var(--text)] hover:text-[var(--accent-luxury)]">{row.nom || 'Prospect sans nom'} · {row.phone || 'sans téléphone'}</Link>)}</div>}{issue.count === 0 && <p className="mt-3 text-xs text-emerald-700">Aucune anomalie détectée.</p>}</section>)}</div></div></main>
}
