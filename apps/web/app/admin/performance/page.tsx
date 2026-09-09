import { redirect, notFound } from 'next/navigation'
import { Activity, BarChart3, MessageCircle, CalendarDays, CreditCard, DatabaseZap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ActionQueue } from '@/components/admin/ActionQueue'

export const dynamic = 'force-dynamic'

type Period = 7 | 30 | 90
type Row = { id: string; created_at: string; admin_validation_status: 'pending' | 'approved' | 'rejected'; source?: string | null; prospect_id?: string | null; date_souhaitee?: string | null; outcome?: string | null; admin_note?: string | null }
type ProspectMetricRow = { id: string; assigned_to: string | null; prochaine_action_at: string | null; statut: string; phone?: string | null; commune?: string | null; type_bien?: string | null; first_seen: string }
type ConversionRow = { label: string; total: number; visits: number; reservations: number; rate: number }

async function fetchAllRows<T>(client: any, table: string, selection: string, options: { since?: string; orderBy?: string } = {}): Promise<T[]> {
  const pageSize = 1000
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    let query = client.from(table).select(selection).order(options.orderBy ?? 'created_at', { ascending: true }).range(from, from + pageSize - 1)
    if (options.since) query = query.gte(options.orderBy ?? 'created_at', options.since)
    const { data, error } = await query
    if (error) throw new Error(`Statistiques indisponibles (${table}) : ${error.message}`)
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < pageSize) return rows
  }
}

export default async function AdminPerformancePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/performance')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()

  const params = await searchParams
  const period: Period = params.period === '7' || params.period === '90' ? Number(params.period) as Period : 30
  const since = new Date(Date.now() - period * 86_400_000).toISOString()
  const admin = createAdminClient()

  // Les pages sont toutes lues : aucun plafond silencieux ne doit fausser les résultats.
  const [contacts, visites, reservations, prospects] = await Promise.all([
    fetchAllRows<Row>(admin, 'contact_requests', 'id, created_at, admin_validation_status, source, prospect_id, admin_note', { since }),
    fetchAllRows<Row>(admin, 'visites', 'id, created_at, admin_validation_status, source, prospect_id, date_souhaitee, outcome, admin_note', { since }),
    fetchAllRows<Row>(admin, 'reservations', 'id, created_at, admin_validation_status, prospect_id, admin_note', { since }),
    fetchAllRows<ProspectMetricRow>(admin, 'prospects', 'id, assigned_to, prochaine_action_at, statut, phone, commune, type_bien, first_seen', { orderBy: 'first_seen' }),
  ])

  const approved = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'approved').length
  const rejected = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'rejected').length
  const pending = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'pending').length
  const firstLinked = (rows: Row[], approvedOnly = false) => {
    const result = new Map<string, Row>()
    for (const row of rows) {
      if (!row.prospect_id || (approvedOnly && row.admin_validation_status !== 'approved')) continue
      if (!result.has(row.prospect_id)) result.set(row.prospect_id, row)
    }
    return result
  }
  const firstContacts = firstLinked(contacts)
  const firstVisits = firstLinked(visites, true)
  const firstReservations = firstLinked(reservations, true)
  const cohortIds = [...firstContacts.keys()]
  const visitedIds = new Set(cohortIds.filter((id) => {
    const visit = firstVisits.get(id)
    return Boolean(visit && new Date(visit.created_at) >= new Date(firstContacts.get(id)!.created_at))
  }))
  const reservedIds = new Set([...visitedIds].filter((id) => {
    const reservation = firstReservations.get(id)
    return Boolean(reservation && new Date(reservation.created_at) >= new Date(firstVisits.get(id)!.created_at))
  }))
  const contactToVisit = cohortIds.length ? Math.round((visitedIds.size / cohortIds.length) * 100) : 0
  const visitToReservation = visitedIds.size ? Math.round((reservedIds.size / visitedIds.size) * 100) : 0
  const overall = cohortIds.length ? Math.round((reservedIds.size / cohortIds.length) * 100) : 0
  // L'origine peut être portée par une demande de contact ou une visite
  // WhatsApp. Compter uniquement les contacts sous-évalue les parcours qui
  // commencent dans WhatsApp puis arrivent directement sur une visite.
  const sourceRows = [...contacts, ...visites]
  const sourceCount = (source: string) => sourceRows.filter((r) => source === 'flash' ? r.source?.startsWith('flash') : (r.source ?? 'web') === source).length
  const overdueFollowups = prospects.filter((r) => r.prochaine_action_at && new Date(r.prochaine_action_at).getTime() < Date.now() && !['gagne', 'perdu', 'traite'].includes(r.statut)).length
  const unassigned = prospects.filter((r) => !r.assigned_to && !['gagne', 'perdu', 'traite'].includes(r.statut)).length
  const phoneCounts = prospects.reduce<Record<string, number>>((acc, row) => {
    const normalized = (row.phone ?? '').replace(/\D/g, '')
    if (normalized) acc[normalized] = (acc[normalized] || 0) + 1
    return acc
  }, {})
  const duplicateRows = Object.values(phoneCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0)
  const visitDelays = [...visitedIds].map((id) => (new Date(firstVisits.get(id)!.created_at).getTime() - new Date(firstContacts.get(id)!.created_at).getTime()) / 86_400_000)
  const reservationDelays = [...reservedIds].map((id) => (new Date(firstReservations.get(id)!.created_at).getTime() - new Date(firstVisits.get(id)!.created_at).getTime()) / 86_400_000)
  const average = (values: number[]) => values.length ? `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} j` : '—'
  const pastVisitsWithoutReport = visites.filter((r) => r.date_souhaitee && new Date(r.date_souhaitee).getTime() < Date.now() && !r.outcome).length
  const rejectedWithoutReason = [...contacts, ...visites, ...reservations].filter((r) => r.admin_validation_status === 'rejected' && !r.admin_note).length
  const unanswered = [...contacts, ...visites, ...reservations].filter((r) => r.admin_validation_status === 'pending' && Date.now() - new Date(r.created_at).getTime() > 86_400_000).length
  const reservationsWithoutVisit = reservations.filter((r) => {
    if (r.admin_validation_status !== 'approved') return false
    if (!r.prospect_id) return true
    const visit = firstVisits.get(r.prospect_id)
    return !visit || new Date(visit.created_at) > new Date(r.created_at)
  }).length
  const unlinked = contacts.filter((r) => !r.prospect_id).length + visites.filter((r) => !r.prospect_id).length + reservations.filter((r) => !r.prospect_id).length
  const linkedCoverage = contacts.length ? Math.round((contacts.filter((r) => r.prospect_id).length / contacts.length) * 100) : 100
  const prospectById = new Map(prospects.map((row) => [row.id, row]))
  const adminIds = Array.from(new Set(prospects.map((r) => r.assigned_to).filter(Boolean))) as string[]
  const adminNames: Record<string, string> = {}
  if (adminIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('profiles').select('id, full_name').in('id', adminIds)
    for (const row of (data ?? []) as { id: string; full_name: string | null }[]) adminNames[row.id] = row.full_name || 'Conseiller'
  }

  const breakdown = (key: 'assigned_to' | 'commune' | 'type_bien'): ConversionRow[] => {
    const groups = new Map<string, { total: number; visits: number; reservations: number }>()
    for (const id of cohortIds) {
      const prospect = prospectById.get(id)
      const raw = prospect?.[key] || 'Non renseigné'
      const label = key === 'assigned_to' && raw !== 'Non renseigné' ? (adminNames[raw] || 'Conseiller inconnu') : raw
      const current = groups.get(label) ?? { total: 0, visits: 0, reservations: 0 }
      current.total += 1
      if (visitedIds.has(id)) current.visits += 1
      if (reservedIds.has(id)) current.reservations += 1
      groups.set(label, current)
    }
    return [...groups.entries()]
      .map(([label, value]) => ({ label, ...value, rate: value.total ? Math.round(value.reservations / value.total * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }
  const assignedBy = breakdown('assigned_to')
  const communeBy = breakdown('commune')
  const typeBy = breakdown('type_bien')

  const cohortWeeks = new Map<string, { total: number; visits: number; reservations: number }>()
  for (const id of cohortIds) {
    const date = new Date(firstContacts.get(id)!.created_at)
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((date.getUTCDay() + 6) % 7)))
    const key = monday.toISOString().slice(0, 10)
    const current = cohortWeeks.get(key) ?? { total: 0, visits: 0, reservations: 0 }
    current.total += 1
    if (visitedIds.has(id)) current.visits += 1
    if (reservedIds.has(id)) current.reservations += 1
    cohortWeeks.set(key, current)
  }
  const cohorts = [...cohortWeeks.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 8)

  const metrics = [
    { label: 'Demandes reçues', value: contacts.length, detail: `${pending(contacts)} à traiter`, icon: MessageCircle, tone: 'gold' },
    { label: 'Visites demandées', value: visites.length, detail: `${approved(visites)} validées`, icon: CalendarDays, tone: 'blue' },
    { label: 'Réservations', value: reservations.length, detail: `${approved(reservations)} validées`, icon: CreditCard, tone: 'green' },
    { label: 'Conversion globale', value: `${overall}%`, detail: `${reservedIds.size}/${cohortIds.length} prospects liés`, icon: Activity, tone: 'violet' },
  ] as const

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-luxury)] mb-2">Pilotage commercial</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">Performance</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Les chiffres qui indiquent où agir maintenant.</p>
          </div>
          <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-1 self-start sm:self-auto">
            {[7, 30, 90].map((days) => (
              <a key={days} href={`/admin/performance?period=${days}`} className={`min-h-[40px] px-3 sm:px-4 rounded-lg inline-flex items-center text-xs font-bold ${period === days ? 'bg-[var(--text)] text-[var(--surface-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                {days} jours
              </a>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {metrics.map((m) => {
            const Icon = m.icon
            return <div key={m.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</p><Icon className="w-4 h-4 text-[var(--accent-luxury)]" /></div>
              <p className="mt-2 text-2xl sm:text-3xl font-black tabular-nums text-[var(--text)]">{m.value}</p>
              <p className="mt-1 text-xs text-[var(--text-subtle)]">{m.detail}</p>
            </div>
          })}
        </section>

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-6"><div><h2 className="font-bold text-[var(--text)]">Entonnoir de conversion</h2><p className="text-xs text-[var(--text-muted)] mt-1">Mêmes prospects, étapes validées · {period} derniers jours</p></div><BarChart3 className="w-5 h-5 text-[var(--accent-luxury)]" /></div>
            <FunnelRow label="Prospects avec demande" value={cohortIds.length} percent={100} tone="gold" />
            <FunnelRow label="Puis visite validée" value={visitedIds.size} percent={contactToVisit} tone="blue" suffix={`${contactToVisit}% de la cohorte`} />
            <FunnelRow label="Puis réservation validée" value={reservedIds.size} percent={visitToReservation} tone="green" suffix={`${visitToReservation}% des visiteurs`} />
            <div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="Refusées" value={rejected(contacts) + rejected(visites) + rejected(reservations)} /><MiniStat label="En attente" value={pending(contacts) + pending(visites) + pending(reservations)} /></div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
            <h2 className="font-bold text-[var(--text)]">Origine des demandes</h2><p className="text-xs text-[var(--text-muted)] mt-1 mb-6">Ce qui génère réellement des prospects</p>
            <SourceRow label="Annonces web" value={sourceCount('web')} total={sourceRows.length} />
            <SourceRow label="Offres flash" value={sourceCount('flash')} total={sourceRows.length} />
            <SourceRow label="WhatsApp" value={sourceCount('whatsapp')} total={sourceRows.length} />
            <div className="mt-6 rounded-xl bg-[var(--surface-hover)] p-4"><p className="text-xs font-bold text-[var(--text)]">Lecture recommandée</p><p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Priorisez les demandes en attente, puis comparez la conversion de chaque source avant d’augmenter la diffusion.</p></div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="font-bold text-[var(--text)]">Conversion par dimension</h2><p className="text-xs text-[var(--text-muted)] mt-1">Top 5 · taux contact → réservation sur la même cohorte</p></div><BarChart3 className="w-5 h-5 text-[var(--accent-luxury)]" /></div>
          <div className="grid md:grid-cols-3 gap-6">
            <Breakdown title="Conseiller" rows={assignedBy} />
            <Breakdown title="Commune" rows={communeBy} />
            <Breakdown title="Type de bien" rows={typeBy} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="Délai moyen contact → visite" value={average(visitDelays)} /><MiniStat label="Délai moyen visite → réservation" value={average(reservationDelays)} /></div>
        </section>

        <section className="mt-6 grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-[var(--text)]">Cohortes hebdomadaires</h2><p className="text-xs text-[var(--text-muted)] mt-1">Progression des prospects entrés la même semaine</p></div><CalendarDays className="w-5 h-5 text-[var(--accent-luxury)]" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]"><th className="text-left py-2">Semaine du</th><th className="text-right py-2">Contacts</th><th className="text-right py-2">Visites</th><th className="text-right py-2">Réservations</th><th className="text-right py-2">Conversion</th></tr></thead><tbody>{cohorts.map(([week, values]) => <tr key={week} className="border-b border-[var(--border)] last:border-0"><td className="py-3 font-medium text-[var(--text)]">{new Date(`${week}T00:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</td><td className="py-3 text-right tabular-nums">{values.total}</td><td className="py-3 text-right tabular-nums">{values.visits}</td><td className="py-3 text-right tabular-nums">{values.reservations}</td><td className="py-3 text-right font-black tabular-nums">{values.total ? Math.round(values.reservations / values.total * 100) : 0}%</td></tr>)}</tbody></table>{cohorts.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-muted)]">Aucune cohorte liée sur cette période.</p>}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
            <div className="flex items-center gap-2"><DatabaseZap className="w-5 h-5 text-[var(--accent-luxury)]" /><h2 className="font-bold text-[var(--text)]">Qualité des données</h2></div>
            <p className="mt-4 text-4xl font-black tabular-nums text-[var(--text)]">{linkedCoverage}%</p><p className="text-xs text-[var(--text-muted)] mt-1">des demandes rattachées à un prospect</p>
            <div className="mt-5 space-y-3"><QualityRow label="Événements non rattachés" value={unlinked} /><QualityRow label="Prospects actifs non assignés" value={unassigned} /><QualityRow label="Refus sans motif" value={rejectedWithoutReason} /></div>
            <p className="mt-5 text-[11px] leading-relaxed text-[var(--text-subtle)]">Les taux excluent les événements non rattachés afin d’éviter de présenter une conversion artificielle.</p>
          </div>
        </section>

        <ActionQueue items={[
          { label: 'Sans réponse depuis 24 h', value: unanswered, href: '/admin/suivi' },
          { label: 'Relances en retard', value: overdueFollowups, href: '/admin/prospects' },
          { label: 'Prospects non assignés', value: unassigned, href: '/admin/prospects' },
          { label: 'Visites sans compte rendu', value: pastVisitsWithoutReport, href: '/admin/suivi?tab=visites' },
          { label: 'Réservations sans visite', value: reservationsWithoutVisit, href: '/admin/suivi?tab=reservations' },
          { label: 'Refus sans motif', value: rejectedWithoutReason, href: '/admin/suivi' },
          { label: 'Doublons potentiels', value: duplicateRows, href: '/admin/prospects/doublons' },
          { label: 'Événements non rattachés', value: unlinked, href: '/admin/suivi' },
        ]} />
      </div>
    </main>
  )
}

function FunnelRow({ label, value, percent, tone, suffix }: { label: string; value: number; percent: number; tone: 'gold' | 'blue' | 'green'; suffix?: string }) {
  const colors = { gold: 'bg-[var(--accent-luxury)]', blue: 'bg-blue-500', green: 'bg-emerald-500' }
  return <div className="mb-5"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-sm text-[var(--text)]">{label}</span><span className="text-sm font-black tabular-nums text-[var(--text)]">{value}</span></div><div className="h-2 rounded-full bg-[var(--surface-hover)] overflow-hidden"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.min(100, Math.max(value > 0 ? 8 : 0, percent))}%` }} /></div>{suffix && <p className="mt-1 text-[11px] text-[var(--text-muted)]">{suffix}</p>}</div>
}

function MiniStat({ label, value }: { label: string; value: number | string }) { return <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-[11px] text-[var(--text-muted)]">{label}</p><p className="text-xl font-black text-[var(--text)] mt-1">{value}</p></div> }

function SourceRow({ label, value, total }: { label: string; value: number; total: number }) { const pct = total ? Math.round(value / total * 100) : 0; return <div className="mb-5"><div className="flex justify-between text-sm mb-2"><span className="text-[var(--text)]">{label}</span><span className="font-bold text-[var(--text)]">{value} <span className="font-normal text-[var(--text-muted)]">({pct}%)</span></span></div><div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent-luxury)] rounded-full" style={{ width: `${pct}%` }} /></div></div> }

function Breakdown({ title, rows }: { title: string; rows: ConversionRow[] }) { return <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">{title}</h3><div className="space-y-3">{rows.length ? rows.map((row) => <div key={row.label}><div className="flex justify-between gap-2 text-xs mb-1"><span className="truncate text-[var(--text)]">{row.label}</span><span className="font-bold text-[var(--text)]">{row.rate}% <span className="font-normal text-[var(--text-muted)]">· {row.reservations}/{row.total}</span></span></div><div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-luxury)]" style={{ width: `${row.rate}%` }} /></div></div>) : <p className="text-xs text-[var(--text-muted)]">Aucune donnée</p>}</div></div> }

function QualityRow({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-hover)] px-3 py-2"><span className="text-xs text-[var(--text-muted)]">{label}</span><span className={`text-sm font-black tabular-nums ${value ? 'text-amber-700' : 'text-emerald-700'}`}>{value}</span></div> }
