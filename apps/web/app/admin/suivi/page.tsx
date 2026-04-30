import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ShieldCheck, Phone, Calendar, Clock, MapPin, User, CheckCircle2, XCircle, Hourglass, Home, BedDouble } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SearchParams {
  tab?: 'visites' | 'reservations'
  status?: string
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
  admin_validation_status: string
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
  admin_validation_status: string
  admin_validated_at: string | null
  owner_notified_at: string | null
  visitor_notified_at: string | null
  created_at: string
  biens: { titre: string; commune: string | null } | null
  locataire: { full_name: string; phone: string | null } | null
  proprietaire: { full_name: string; phone: string | null } | null
}

function adminBadge(status: string) {
  const map: Record<string, { label: string; cls: string; icon: typeof Hourglass }> = {
    pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Hourglass },
    approved: { label: 'Validée', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected: { label: 'Refusée', cls: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  }
  const s = map[status] ?? map.pending
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

export default async function AdminSuiviPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/suivi')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  const sp = await searchParams
  const tab = sp.tab || 'visites'
  const status = sp.status || 'pending'
  const q = sp.q?.trim() || ''

  const admin = createAdminClient()

  // ---- Counts globaux ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: visitesPending } = await (admin as any)
    .from('visites')
    .select('id', { count: 'exact', head: true })
    .eq('admin_validation_status', 'pending')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: reservationsPending } = await (admin as any)
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('admin_validation_status', 'pending')

  // ---- Données du tab actif ----
  let visites: VisiteRow[] = []
  let reservations: ReservationRow[] = []

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
      .limit(100)

    if (status !== 'all') query = query.eq('admin_validation_status', status)
    const { data } = await query
    visites = (data ?? []) as VisiteRow[]

    if (q) {
      const lower = q.toLowerCase()
      visites = visites.filter((v) => {
        const haystack = [
          v.biens?.titre,
          v.biens?.commune,
          v.locataire?.full_name,
          v.locataire?.phone,
          v.client_name,
          v.client_phone,
          v.proprietaire?.full_name,
          v.proprietaire?.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(lower)
      })
    }
  } else {
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
      .limit(100)

    if (status !== 'all') query = query.eq('admin_validation_status', status)
    const { data } = await query
    reservations = (data ?? []) as ReservationRow[]

    if (q) {
      const lower = q.toLowerCase()
      reservations = reservations.filter((r) => {
        const haystack = [
          r.biens?.titre,
          r.biens?.commune,
          r.locataire?.full_name,
          r.locataire?.phone,
          r.proprietaire?.full_name,
          r.proprietaire?.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(lower)
      })
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-none">Suivi & Intermédiation</h1>
              <p className="text-slate-400 text-xs mt-1">
                {visitesPending ?? 0} visite{(visitesPending ?? 0) > 1 ? 's' : ''} · {reservationsPending ?? 0} réservation{(reservationsPending ?? 0) > 1 ? 's' : ''} en attente
              </p>
            </div>
          </div>
          <Link href="/admin/moderation" className="text-slate-400 hover:text-slate-700 text-xs font-medium">Modération biens →</Link>
        </div>

        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 border-b border-slate-100">
          <Link
            href={`/admin/suivi?tab=visites&status=${status}`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'visites' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            Visites
            {(visitesPending ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{visitesPending}</span>
            )}
          </Link>
          <Link
            href={`/admin/suivi?tab=reservations&status=${status}`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'reservations' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            Réservations
            {(reservationsPending ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px]">{reservationsPending}</span>
            )}
          </Link>
        </div>

        {/* Filters */}
        <form className="max-w-[1400px] mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="tab" value={tab} />
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
              <Link
                key={s}
                href={`/admin/suivi?tab=${tab}&status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  status === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {s === 'pending' && 'En attente'}
                {s === 'approved' && 'Validées'}
                {s === 'rejected' && 'Refusées'}
                {s === 'all' && 'Toutes'}
              </Link>
            ))}
          </div>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Bien, commune, nom, téléphone..."
            className="flex-1 min-w-[260px] px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400"
          />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
            Filtrer
          </button>
        </form>
      </div>

      {/* Liste */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {tab === 'visites' ? (
          visites.length === 0 ? (
            <EmptyState label="Aucune visite ne correspond aux filtres." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visites.map((v) => (
                <VisiteCard key={v.id} v={v} />
              ))}
            </div>
          )
        ) : reservations.length === 0 ? (
          <EmptyState label="Aucune réservation ne correspond aux filtres." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((r) => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  )
}

function VisiteCard({ v }: { v: VisiteRow }) {
  const visitorName = v.locataire?.full_name || v.client_name || 'Visiteur'
  const visitorPhone = v.locataire?.phone || v.client_phone || '—'
  return (
    <Link
      href={`/admin/suivi/visites/${v.id}`}
      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{v.biens?.titre || 'Bien'}</h3>
          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {v.biens?.commune || '—'}
            {v.source === 'whatsapp' && <span className="ml-1 text-emerald-600">· WA</span>}
          </p>
        </div>
        {adminBadge(v.admin_validation_status)}
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <p className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-700">{visitorName}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          {visitorPhone}
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          {formatDate(v.date_souhaitee)}
          {v.heure_debut && v.heure_fin && (
            <>
              <Clock className="w-3 h-3 text-slate-400 ml-1" />
              {v.heure_debut} - {v.heure_fin}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
        <span>Reçue {formatDateTime(v.created_at)}</span>
        <NotifDots ownerNotified={!!v.owner_notified_at} visitorNotified={!!v.visitor_notified_at} />
      </div>
    </Link>
  )
}

function ReservationCard({ r }: { r: ReservationRow }) {
  return (
    <Link
      href={`/admin/suivi/reservations/${r.id}`}
      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{r.biens?.titre || 'Bien'}</h3>
          <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {r.biens?.commune || '—'}
          </p>
        </div>
        {adminBadge(r.admin_validation_status)}
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <p className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-700">{r.locataire?.full_name || 'Visiteur'}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          {r.locataire?.phone || '—'}
        </p>
        <p className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          {formatDate(r.date_debut)} → {formatDate(r.date_fin)}
        </p>
        <p className="font-bold text-slate-900 text-sm pt-1">
          {formatFCFA(r.montant_total_fcfa ?? 0)}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
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
