import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ShieldCheck, Phone, Calendar, Clock, MapPin, User,
  CheckCircle2, XCircle, Hourglass, Home, BedDouble,
  LayoutGrid, List as ListIcon, MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Tab = 'visites' | 'reservations' | 'contacts'
type View = 'kanban' | 'list'
type AdminStatus = 'pending' | 'approved' | 'rejected'

interface SearchParams {
  tab?: Tab
  view?: View
  status?: AdminStatus | 'all'
  q?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

interface VisiteRow {
  id: string
  date_souhaitee: string
  heure_debut: string | null
  heure_fin: string | null
  notes: string | null
  statut: string
  admin_validation_status: AdminStatus
  admin_validated_at: string | null
  owner_notified_at: string | null
  visitor_notified_at: string | null
  client_name: string | null
  client_phone: string | null
  source: string
  created_at: string
  biens: { titre: string; commune: string | null } | null
  locataire: { full_name: string; phone: string | null } | null
  proprietaire: { full_name: string; phone: string | null } | null
}

interface ReservationRow {
  id: string
  date_debut: string
  date_fin: string
  montant_total_fcfa: number | null
  statut: string
  admin_validation_status: AdminStatus
  admin_validated_at: string | null
  owner_notified_at: string | null
  visitor_notified_at: string | null
  created_at: string
  biens: { titre: string; commune: string | null } | null
  locataire: { full_name: string; phone: string | null } | null
  proprietaire: { full_name: string; phone: string | null } | null
}

interface ContactRow {
  id: string
  visitor_name: string | null
  visitor_phone: string | null
  visitor_email: string | null
  reason: string | null
  admin_validation_status: AdminStatus
  admin_validated_at: string | null
  owner_notified_at: string | null
  visitor_notified_at: string | null
  source: string
  created_at: string
  flash_titre: string | null
  biens: { titre: string; commune: string | null } | null
  proprietaire: { full_name: string; phone: string | null } | null
}

const STATUS_META: Record<AdminStatus, { label: string; cls: string; col: string; icon: typeof Hourglass }> = {
  pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700 border-amber-200',     col: 'border-t-amber-400',   icon: Hourglass },
  approved: { label: 'Validées',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', col: 'border-t-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Refusées',   cls: 'bg-red-100 text-red-700 border-red-200',           col: 'border-t-red-400',     icon: XCircle },
}

function adminBadge(status: AdminStatus) {
  const s = STATUS_META[status]
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Ancienneté colorée d'une demande en attente (vert < 2 h, ambre < 6 h, rouge au-delà). */
function ageLabel(iso: string): { label: string; cls: string } {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return { label: "à l'instant", cls: 'bg-emerald-100 text-emerald-700' }
  if (h < 2) return { label: `${h} h`, cls: 'bg-emerald-100 text-emerald-700' }
  if (h < 6) return { label: `${h} h`, cls: 'bg-amber-100 text-amber-700' }
  const d = Math.floor(h / 24)
  return { label: d >= 1 ? `${d} j` : `${h} h`, cls: 'bg-red-100 text-red-700' }
}

function applySearch<T extends { biens: { titre: string; commune: string | null } | null }>(
  rows: T[],
  q: string,
  extractor: (r: T) => Array<string | null | undefined>
): T[] {
  if (!q) return rows
  const lower = q.toLowerCase()
  return rows.filter((r) => {
    const haystack = [r.biens?.titre, r.biens?.commune, ...extractor(r)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(lower)
  })
}

export default async function AdminSuiviPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/suivi')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()

  const sp = await searchParams
  const tab: Tab = sp.tab || 'visites'
  const view: View = sp.view || 'kanban'
  const listStatus = sp.status || 'pending'
  const q = sp.q?.trim() || ''

  const admin = createAdminClient()

  // Counts globaux (toujours affichés en haut)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: visitesPending } = await (admin as any)
    .from('visites').select('id', { count: 'exact', head: true })
    .eq('admin_validation_status', 'pending')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: reservationsPending } = await (admin as any)
    .from('reservations').select('id', { count: 'exact', head: true })
    .eq('admin_validation_status', 'pending')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: contactsPending } = await (admin as any)
    .from('contact_requests').select('id', { count: 'exact', head: true })
    .eq('admin_validation_status', 'pending')

  // Données : en kanban on prend tout (3 colonnes), en liste on filtre par status
  let visites: VisiteRow[] = []
  let reservations: ReservationRow[] = []
  let contacts: ContactRow[] = []

  if (tab === 'visites') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from('visites')
      .select(`
        id, date_souhaitee, heure_debut, heure_fin, notes, statut,
        admin_validation_status, admin_validated_at, owner_notified_at, visitor_notified_at,
        client_name, client_phone, source, created_at,
        biens ( titre, commune ),
        locataire:profiles!visites_locataire_id_fkey ( full_name, phone ),
        proprietaire:profiles!visites_proprietaire_id_fkey ( full_name, phone )
      `)
      .order('created_at', { ascending: false })
      .limit(view === 'kanban' ? 200 : 100)

    if (view === 'list' && listStatus !== 'all') {
      query = query.eq('admin_validation_status', listStatus)
    }
    const { data } = await query
    visites = applySearch((data ?? []) as VisiteRow[], q, (v) => [
      v.locataire?.full_name, v.locataire?.phone,
      v.client_name, v.client_phone,
      v.proprietaire?.full_name, v.proprietaire?.phone,
    ])
  } else if (tab === 'reservations') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from('reservations')
      .select(`
        id, date_debut, date_fin, montant_total_fcfa, statut,
        admin_validation_status, admin_validated_at, owner_notified_at, visitor_notified_at, created_at,
        biens ( titre, commune ),
        locataire:profiles!reservations_locataire_id_fkey ( full_name, phone ),
        proprietaire:profiles!reservations_proprietaire_id_fkey ( full_name, phone )
      `)
      .order('created_at', { ascending: false })
      .limit(view === 'kanban' ? 200 : 100)

    if (view === 'list' && listStatus !== 'all') {
      query = query.eq('admin_validation_status', listStatus)
    }
    const { data } = await query
    reservations = applySearch((data ?? []) as ReservationRow[], q, (r) => [
      r.locataire?.full_name, r.locataire?.phone,
      r.proprietaire?.full_name, r.proprietaire?.phone,
    ])
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
      .from('contact_requests')
      .select(`
        id, visitor_name, visitor_phone, visitor_email, reason, source, flash_titre,
        admin_validation_status, admin_validated_at, owner_notified_at, visitor_notified_at, created_at,
        biens ( titre, commune ),
        proprietaire:profiles!contact_requests_proprietaire_id_fkey ( full_name, phone )
      `)
      .order('created_at', { ascending: false })
      .limit(view === 'kanban' ? 200 : 100)

    if (view === 'list' && listStatus !== 'all') {
      query = query.eq('admin_validation_status', listStatus)
    }
    const { data } = await query
    contacts = applySearch((data ?? []) as ContactRow[], q, (c) => [
      c.visitor_name, c.visitor_phone, c.visitor_email,
      c.proprietaire?.full_name, c.proprietaire?.phone,
    ])
  }

  // Groupage kanban
  const visitesByStatus: Record<AdminStatus, VisiteRow[]> = { pending: [], approved: [], rejected: [] }
  for (const v of visites) visitesByStatus[v.admin_validation_status]?.push(v)
  const reservationsByStatus: Record<AdminStatus, ReservationRow[]> = { pending: [], approved: [], rejected: [] }
  for (const r of reservations) reservationsByStatus[r.admin_validation_status]?.push(r)
  const contactsByStatus: Record<AdminStatus, ContactRow[]> = { pending: [], approved: [], rejected: [] }
  for (const c of contacts) contactsByStatus[c.admin_validation_status]?.push(c)

  const qParam = q ? `&q=${encodeURIComponent(q)}` : ''

  return (
    <main className="min-h-screen bg-[var(--surface-hover)]">
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)] sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[var(--text)]" />
            <div>
              <h1 className="font-bold text-[var(--text)] text-lg leading-none">Suivi & Intermédiation</h1>
              <p className="text-[var(--text-subtle)] text-xs mt-1">
                {visitesPending ?? 0} visite{(visitesPending ?? 0) > 1 ? 's' : ''} · {reservationsPending ?? 0} réservation{(reservationsPending ?? 0) > 1 ? 's' : ''} · {contactsPending ?? 0} contact{(contactsPending ?? 0) > 1 ? 's' : ''} en attente
              </p>
            </div>
          </div>
          <Link href="/admin/moderation" className="text-[var(--text-subtle)] hover:text-[var(--text)] text-xs font-medium">Modération biens →</Link>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-1 border-b border-[var(--border)]">
          <Link
            href={`/admin/suivi?tab=visites&view=${view}${qParam}`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'visites' ? 'border-slate-900 text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Home className="w-4 h-4" /> Visites
            {(visitesPending ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{visitesPending}</span>
            )}
          </Link>
          <Link
            href={`/admin/suivi?tab=reservations&view=${view}${qParam}`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'reservations' ? 'border-slate-900 text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <BedDouble className="w-4 h-4" /> Réservations
            {(reservationsPending ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{reservationsPending}</span>
            )}
          </Link>
          <Link
            href={`/admin/suivi?tab=contacts&view=${view}${qParam}`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'contacts' ? 'border-slate-900 text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Contacts
            {(contactsPending ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{contactsPending}</span>
            )}
          </Link>
        </div>

        {/* Toolbar */}
        <form className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="tab" value={tab} />
          <input type="hidden" name="view" value={view} />

          {/* Toggle kanban / liste */}
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl">
            <Link
              href={`/admin/suivi?tab=${tab}&view=kanban${qParam}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === 'kanban' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </Link>
            <Link
              href={`/admin/suivi?tab=${tab}&view=list&status=pending${qParam}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === 'list' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> Liste
            </Link>
          </div>

          {/* Filtre statut (uniquement en mode liste) */}
          {view === 'list' && (
            <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
                <Link
                  key={s}
                  href={`/admin/suivi?tab=${tab}&view=list&status=${s}${qParam}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    listStatus === s ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {s === 'pending' && 'En attente'}
                  {s === 'approved' && 'Validées'}
                  {s === 'rejected' && 'Refusées'}
                  {s === 'all' && 'Toutes'}
                </Link>
              ))}
            </div>
          )}

          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Bien, commune, nom, téléphone..."
            className="flex-1 min-w-[260px] px-4 py-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-slate-400"
          />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
            Filtrer
          </button>
        </form>
      </div>

      {/* Body */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {view === 'kanban' ? (
          <KanbanView
            tab={tab}
            visitesByStatus={visitesByStatus}
            reservationsByStatus={reservationsByStatus}
            contactsByStatus={contactsByStatus}
          />
        ) : (
          <ListView tab={tab} visites={visites} reservations={reservations} contacts={contacts} />
        )}
      </div>
    </main>
  )
}

function KanbanView({
  tab,
  visitesByStatus,
  reservationsByStatus,
  contactsByStatus,
}: {
  tab: Tab
  visitesByStatus: Record<AdminStatus, VisiteRow[]>
  reservationsByStatus: Record<AdminStatus, ReservationRow[]>
  contactsByStatus: Record<AdminStatus, ContactRow[]>
}) {
  const cols: AdminStatus[] = ['pending', 'approved', 'rejected']
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cols.map((status) => {
        const meta = STATUS_META[status]
        const Icon = meta.icon
        const items =
          tab === 'visites' ? visitesByStatus[status]
          : tab === 'reservations' ? reservationsByStatus[status]
          : contactsByStatus[status]
        return (
          <div
            key={status}
            className={`bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] border-t-4 ${meta.col} flex flex-col min-h-[200px]`}
          >
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                <h2 className="font-bold text-[var(--text)] text-sm uppercase tracking-wide">{meta.label}</h2>
              </div>
              <span className="text-xs font-bold text-[var(--text-subtle)]">{items.length}</span>
            </div>
            <div className="p-3 flex flex-col gap-3 max-h-[calc(100vh-260px)] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-[var(--text-subtle)] text-xs italic text-center py-8">Vide</p>
              ) : tab === 'visites' ? (
                (items as VisiteRow[]).map((v) => <VisiteCard key={v.id} v={v} compact />)
              ) : tab === 'reservations' ? (
                (items as ReservationRow[]).map((r) => <ReservationCard key={r.id} r={r} compact />)
              ) : (
                (items as ContactRow[]).map((c) => <ContactCard key={c.id} c={c} compact />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({
  tab,
  visites,
  reservations,
  contacts,
}: {
  tab: Tab
  visites: VisiteRow[]
  reservations: ReservationRow[]
  contacts: ContactRow[]
}) {
  if (tab === 'visites') {
    if (visites.length === 0) return <EmptyState label="Aucune visite ne correspond aux filtres." />
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visites.map((v) => <VisiteCard key={v.id} v={v} />)}
      </div>
    )
  }
  if (tab === 'reservations') {
    if (reservations.length === 0) return <EmptyState label="Aucune réservation ne correspond aux filtres." />
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map((r) => <ReservationCard key={r.id} r={r} />)}
      </div>
    )
  }
  if (contacts.length === 0) return <EmptyState label="Aucune demande de contact ne correspond aux filtres." />
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map((c) => <ContactCard key={c.id} c={c} />)}
    </div>
  )
}

function ContactCard({ c, compact = false }: { c: ContactRow; compact?: boolean }) {
  const isFlash = c.source === 'flash'
  const titre = c.biens?.titre || c.flash_titre || 'Bien'
  const pending = c.admin_validation_status === 'pending'
  const age = ageLabel(c.created_at)
  return (
    <Link
      href={`/admin/suivi/contacts/${c.id}`}
      className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] hover:shadow-md transition-all p-3 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] text-sm line-clamp-1">{titre}</h3>
          <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {c.biens?.commune || '—'}
            {isFlash && <span className="ml-1 text-orange-500 font-bold">· ⚡ flash</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {!compact && adminBadge(c.admin_validation_status)}
          {pending && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${age.cls}`}>{age.label}</span>
          )}
        </div>
      </div>

      <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
        <p className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="font-semibold text-[var(--text)] truncate">{c.visitor_name || 'Visiteur'}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="truncate">{c.visitor_phone || '—'}</span>
        </p>
        {c.reason && (
          <p className="flex items-start gap-1.5 line-clamp-2">
            <MessageCircle className="w-3 h-3 text-[var(--text-subtle)] mt-0.5 shrink-0" />
            <span className="line-clamp-2">{c.reason}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--text-subtle)]">
        <span>Reçue {formatDateTime(c.created_at)}</span>
        <NotifDots ownerNotified={!!c.owner_notified_at} visitorNotified={!!c.visitor_notified_at} />
      </div>
    </Link>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
      <p className="text-[var(--text-subtle)] text-sm">{label}</p>
    </div>
  )
}

function VisiteCard({ v, compact = false }: { v: VisiteRow; compact?: boolean }) {
  const visitorName = v.locataire?.full_name || v.client_name || 'Visiteur'
  const visitorPhone = v.locataire?.phone || v.client_phone || '—'
  return (
    <Link
      href={`/admin/suivi/visites/${v.id}`}
      className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] hover:shadow-md transition-all p-3 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] text-sm line-clamp-1">{v.biens?.titre || 'Bien'}</h3>
          <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {v.biens?.commune || '—'}
            {v.source === 'whatsapp' && <span className="ml-1 text-emerald-600">· WA</span>}
          </p>
        </div>
        {!compact && adminBadge(v.admin_validation_status)}
      </div>

      <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
        <p className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="font-semibold text-[var(--text)] truncate">{visitorName}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="truncate">{visitorPhone}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-[var(--text-subtle)]" />
          {formatDate(v.date_souhaitee)}
          {v.heure_debut && v.heure_fin && (
            <>
              <Clock className="w-3 h-3 text-[var(--text-subtle)] ml-1" />
              {v.heure_debut} - {v.heure_fin}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--text-subtle)]">
        <span>Reçue {formatDateTime(v.created_at)}</span>
        <NotifDots ownerNotified={!!v.owner_notified_at} visitorNotified={!!v.visitor_notified_at} />
      </div>
    </Link>
  )
}

function ReservationCard({ r, compact = false }: { r: ReservationRow; compact?: boolean }) {
  return (
    <Link
      href={`/admin/suivi/reservations/${r.id}`}
      className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] hover:shadow-md transition-all p-3 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] text-sm line-clamp-1">{r.biens?.titre || 'Bien'}</h3>
          <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {r.biens?.commune || '—'}
          </p>
        </div>
        {!compact && adminBadge(r.admin_validation_status)}
      </div>

      <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
        <p className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="font-semibold text-[var(--text)] truncate">{r.locataire?.full_name || 'Visiteur'}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-[var(--text-subtle)]" />
          <span className="truncate">{r.locataire?.phone || '—'}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-[var(--text-subtle)]" />
          {formatDate(r.date_debut)} → {formatDate(r.date_fin)}
        </p>
        <p className="font-bold text-[var(--text)] text-sm pt-1">
          {formatFCFA(r.montant_total_fcfa ?? 0)}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border)] text-[10px] text-[var(--text-subtle)]">
        <span>Reçue {formatDateTime(r.created_at)}</span>
        <NotifDots ownerNotified={!!r.owner_notified_at} visitorNotified={!!r.visitor_notified_at} />
      </div>
    </Link>
  )
}

function NotifDots({ ownerNotified, visitorNotified }: { ownerNotified: boolean; visitorNotified: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1" title="Propriétaire notifié">
        <span className={`w-1.5 h-1.5 rounded-full ${ownerNotified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        P
      </span>
      <span className="flex items-center gap-1" title="Visiteur notifié">
        <span className={`w-1.5 h-1.5 rounded-full ${visitorNotified ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        V
      </span>
    </div>
  )
}
