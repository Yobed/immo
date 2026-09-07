import { redirect, notFound } from 'next/navigation'
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, MessageCircle, CalendarDays, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Period = 7 | 30 | 90
type Row = { created_at: string; admin_validation_status: 'pending' | 'approved' | 'rejected'; source?: string | null; prospect_id?: string | null; date_souhaitee?: string | null; outcome?: string | null; admin_note?: string | null }
type ProspectMetricRow = { assigned_to: string | null; prochaine_action_at: string | null; statut: string; phone?: string | null; commune?: string | null; type_bien?: string | null }

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

  // Une seule fenêtre temporelle permet de comparer les étapes du parcours sur la même base.
  const [contactsRes, visitesRes, reservationsRes, prospectsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('contact_requests').select('created_at, admin_validation_status, source, prospect_id').gte('created_at', since).limit(5000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('visites').select('created_at, admin_validation_status, source, prospect_id, date_souhaitee, outcome, admin_note').gte('created_at', since).limit(5000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('reservations').select('created_at, admin_validation_status, prospect_id').gte('created_at', since).limit(5000),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('prospects').select('assigned_to, prochaine_action_at, statut, phone, commune, type_bien').limit(5000),
  ])
  const contacts = (contactsRes.data ?? []) as Row[]
  const visites = (visitesRes.data ?? []) as Row[]
  const reservations = (reservationsRes.data ?? []) as Row[]
  const prospects = (prospectsRes.data ?? []) as ProspectMetricRow[]

  const approved = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'approved').length
  const rejected = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'rejected').length
  const pending = (rows: Row[]) => rows.filter((r) => r.admin_validation_status === 'pending').length
  const contactToVisit = contacts.length ? Math.round((visites.length / contacts.length) * 100) : 0
  const visitToReservation = visites.length ? Math.round((reservations.length / visites.length) * 100) : 0
  const overall = contacts.length ? Math.round((reservations.length / contacts.length) * 100) : 0
  const sourceCount = (source: string) => contacts.filter((r) => (r.source ?? 'web') === source).length
  const overdueFollowups = prospects.filter((r) => r.prochaine_action_at && new Date(r.prochaine_action_at).getTime() < Date.now() && !['gagne', 'perdu', 'traite'].includes(r.statut)).length
  const unassigned = prospects.filter((r) => !r.assigned_to && !['gagne', 'perdu', 'traite'].includes(r.statut)).length
  const phoneCounts = prospects.reduce<Record<string, number>>((acc, row) => {
    const normalized = (row.phone ?? '').replace(/\D/g, '')
    if (normalized) acc[normalized] = (acc[normalized] || 0) + 1
    return acc
  }, {})
  const duplicateRows = Object.values(phoneCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0)
  const countBy = (key: 'assigned_to' | 'commune' | 'type_bien') => Object.entries(prospects.reduce<Record<string, number>>((acc, row) => { const value = row[key] || 'Non renseigné'; acc[value] = (acc[value] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const assignedBy = countBy('assigned_to')
  const communeBy = countBy('commune')
  const typeBy = countBy('type_bien')
  const contactDates = new Map(contacts.filter((r) => r.prospect_id).map((r) => [r.prospect_id as string, new Date(r.created_at).getTime()]))
  const visitDelays = visites.filter((r) => r.prospect_id && contactDates.has(r.prospect_id)).map((r) => (new Date(r.created_at).getTime() - contactDates.get(r.prospect_id as string)!) / 86_400_000).filter((n) => n >= 0)
  const visitDates = new Map(visites.filter((r) => r.prospect_id).map((r) => [r.prospect_id as string, new Date(r.created_at).getTime()]))
  const reservationDelays = reservations.filter((r) => r.prospect_id && visitDates.has(r.prospect_id)).map((r) => (new Date(r.created_at).getTime() - visitDates.get(r.prospect_id as string)!) / 86_400_000).filter((n) => n >= 0)
  const average = (values: number[]) => values.length ? `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} j` : '—'
  const pastVisitsWithoutReport = visites.filter((r) => r.date_souhaitee && new Date(r.date_souhaitee).getTime() < Date.now() && !r.outcome).length
  const rejectedWithoutReason = [...contacts, ...visites, ...reservations].filter((r) => r.admin_validation_status === 'rejected' && !r.admin_note).length
  const adminIds = Array.from(new Set(prospects.map((r) => r.assigned_to).filter(Boolean))) as string[]
  const adminNames: Record<string, string> = {}
  if (adminIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('profiles').select('id, full_name').in('id', adminIds)
    for (const row of (data ?? []) as { id: string; full_name: string | null }[]) adminNames[row.id] = row.full_name || 'Conseiller'
  }

  const metrics = [
    { label: 'Demandes reçues', value: contacts.length, detail: `${pending(contacts)} à traiter`, icon: MessageCircle, tone: 'gold' },
    { label: 'Visites demandées', value: visites.length, detail: `${approved(visites)} validées`, icon: CalendarDays, tone: 'blue' },
    { label: 'Réservations', value: reservations.length, detail: `${approved(reservations)} validées`, icon: CreditCard, tone: 'green' },
    { label: 'Conversion globale', value: `${overall}%`, detail: 'contact → réservation', icon: Activity, tone: 'violet' },
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
            <div className="flex items-start justify-between gap-3 mb-6"><div><h2 className="font-bold text-[var(--text)]">Entonnoir de conversion</h2><p className="text-xs text-[var(--text-muted)] mt-1">Même période · {period} derniers jours</p></div><BarChart3 className="w-5 h-5 text-[var(--accent-luxury)]" /></div>
            <FunnelRow label="Demandes de contact" value={contacts.length} percent={100} tone="gold" />
            <FunnelRow label="Visites demandées" value={visites.length} percent={contactToVisit} tone="blue" suffix={`${contactToVisit}% des contacts`} />
            <FunnelRow label="Réservations" value={reservations.length} percent={visitToReservation} tone="green" suffix={`${visitToReservation}% des visites`} />
            <div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="Refusées" value={rejected(contacts) + rejected(visites) + rejected(reservations)} /><MiniStat label="En attente" value={pending(contacts) + pending(visites) + pending(reservations)} /></div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
            <h2 className="font-bold text-[var(--text)]">Origine des demandes</h2><p className="text-xs text-[var(--text-muted)] mt-1 mb-6">Ce qui génère réellement des prospects</p>
            <SourceRow label="Annonces web" value={sourceCount('web')} total={contacts.length} />
            <SourceRow label="Offres flash" value={sourceCount('flash')} total={contacts.length} />
            <SourceRow label="WhatsApp" value={sourceCount('whatsapp')} total={contacts.length} />
            <div className="mt-6 rounded-xl bg-[var(--surface-hover)] p-4"><p className="text-xs font-bold text-[var(--text)]">Lecture recommandée</p><p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Priorisez les demandes en attente, puis comparez la conversion de chaque source avant d’augmenter la diffusion.</p></div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="font-bold text-[var(--text)]">Lecture par dimension</h2><p className="text-xs text-[var(--text-muted)] mt-1">Top 5 sur {prospects.length} prospects connus dans le pipeline</p></div><BarChart3 className="w-5 h-5 text-[var(--accent-luxury)]" /></div>
          <div className="grid md:grid-cols-3 gap-6">
            <Breakdown title="Conseiller" rows={assignedBy.map(([key, value]) => [adminNames[key] || 'Non assigné', value])} />
            <Breakdown title="Commune" rows={communeBy} />
            <Breakdown title="Type de bien" rows={typeBy} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3"><MiniStat label="Délai moyen contact → visite" value={average(visitDelays)} /><MiniStat label="Délai moyen visite → réservation" value={average(reservationDelays)} /></div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><Clock3 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" /><div><h2 className="font-bold text-amber-900 text-sm">File d’action immédiate</h2><p className="text-xs text-amber-800 mt-1">Ces anomalies doivent être traitées pour garder un CRM fiable.</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4"><AlertLink label="Demandes en attente" value={pending(contacts) + pending(visites) + pending(reservations)} href="/admin/suivi" /><AlertLink label="Relances en retard" value={overdueFollowups} href="/admin/prospects" /><AlertLink label="Prospects non assignés" value={unassigned} href="/admin/prospects" /><AlertLink label="Visites sans compte rendu" value={pastVisitsWithoutReport} href="/admin/suivi?tab=visites" /><AlertLink label="Refus sans motif" value={rejectedWithoutReason} href="/admin/suivi" /><AlertLink label="Doublons potentiels" value={duplicateRows} href="/admin/prospects/doublons" /></div></section>
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

function Breakdown({ title, rows }: { title: string; rows: Array<[string, number]> }) { const max = rows[0]?.[1] ?? 1; return <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">{title}</h3><div className="space-y-3">{rows.length ? rows.map(([label, value]) => <div key={label}><div className="flex justify-between gap-2 text-xs mb-1"><span className="truncate text-[var(--text)]">{label}</span><span className="font-bold text-[var(--text)]">{value}</span></div><div className="h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-luxury)]" style={{ width: `${Math.round(value / max * 100)}%` }} /></div></div>) : <p className="text-xs text-[var(--text-muted)]">Aucune donnée</p>}</div></div> }

function AlertLink({ label, value, href }: { label: string; value: number; href: string }) { return <a href={href} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-white/50 px-3 py-2 hover:bg-white transition-colors"><span className="text-xs text-amber-900">{label}</span><span className={`text-sm font-black ${value ? 'text-amber-800' : 'text-emerald-700'}`}>{value}</span></a> }
