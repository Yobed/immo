import Link from 'next/link'
import {
  Users, MessageCircle, Calendar, Wallet, Download, Home, Clock,
  Inbox, PhoneCall, CheckCircle2, CalendarClock, LayoutGrid, List as ListIcon,
  ChevronRight, UserCheck,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { setProspectStatutAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Statut = 'nouveau' | 'en_cours' | 'rdv' | 'traite' | 'perdu'
type View = 'kanban' | 'list'

interface ProspectRow {
  id: string
  phone: string
  nom: string | null
  type_bien: string | null
  commune: string | null
  quartier: string | null
  budget: number | null
  date_souhaitee: string | null
  statut: string
  message_count: number
  dernier_message: string | null
  note: string | null
  assigned_to: string | null
  relance_le: string | null
  first_seen: string
  last_seen: string
}

interface PageProps {
  searchParams: Promise<{ q?: string; statut?: string; view?: string }>
}

const STATUT_META: Record<Statut, { label: string; cls: string; dot: string; col: string }> = {
  nouveau: { label: 'À traiter', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', col: 'border-t-amber-400' },
  en_cours: { label: 'En cours', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', col: 'border-t-blue-400' },
  rdv: { label: 'RDV pris', cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400', col: 'border-t-purple-400' },
  traite: { label: 'Traité', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', col: 'border-t-emerald-400' },
  perdu: { label: 'Perdu', cls: 'bg-slate-200 text-slate-600 border-slate-300', dot: 'bg-slate-400', col: 'border-t-slate-400' },
}
const KANBAN_COLS: Statut[] = ['nouveau', 'en_cours', 'rdv', 'traite']
const NEXT: Partial<Record<Statut, Statut>> = { nouveau: 'en_cours', en_cours: 'rdv', rdv: 'traite' }

function waLink(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (!d.startsWith('225') && d.length <= 10) d = '225' + d
  return `https://wa.me/${d}`
}
function relative(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}
function stOf(s: string): Statut {
  return (s in STATUT_META ? s : 'nouveau') as Statut
}

export default async function AdminProspectsPage({ searchParams }: PageProps) {
  const { q, statut, view: viewParam } = await searchParams
  const view: View = viewParam === 'list' ? 'list' : 'kanban'
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any).from('prospects').select('*').order('last_seen', { ascending: false }).limit(500)
  if (view === 'list' && statut && statut in STATUT_META) query = query.eq('statut', statut)
  if (q) query = query.or(`nom.ilike.%${q}%,phone.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)
  const { data } = await query
  const rows = (data ?? []) as ProspectRow[]

  // Noms des commerciaux assignés
  const assignedIds = Array.from(new Set(rows.map((r) => r.assigned_to).filter(Boolean))) as string[]
  const nameById: Record<string, string> = {}
  if (assignedIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin as any).from('profiles').select('id, full_name').in('id', assignedIds)
    for (const p of (profs ?? []) as { id: string; full_name: string | null }[]) nameById[p.id] = p.full_name || ''
  }

  const countOf = async (s?: Statut) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c = (admin as any).from('prospects').select('id', { count: 'exact', head: true })
    if (s) c = c.eq('statut', s)
    return (await c).count ?? 0
  }
  const [total, nNouveau, nEnCours, nTraite] = await Promise.all([
    countOf(), countOf('nouveau'), countOf('en_cours'), countOf('traite'),
  ])

  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v)
    const s = sp.toString()
    return `/admin/prospects${s ? `?${s}` : ''}`
  }

  const byStatut: Record<Statut, ProspectRow[]> = { nouveau: [], en_cours: [], rdv: [], traite: [], perdu: [] }
  for (const r of rows) byStatut[stOf(r.statut)].push(r)

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Prospects</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Prospects qualifiés collectés par Sapphire. Suivez chacun jusqu&apos;au closing.
          </p>
        </div>
        <a href="/api/admin/prospects/export"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold">
          <Download className="w-4 h-4" /> Exporter CSV
        </a>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total" value={total} icon={Users} />
        <Stat label="À traiter" value={nNouveau} icon={Inbox} tone="amber" />
        <Stat label="En cours" value={nEnCours} icon={PhoneCall} tone="blue" />
        <Stat label="Traités" value={nTraite} icon={CheckCircle2} tone="emerald" />
      </div>

      {/* Barre : bascule vue + recherche */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl">
          <Link href={qs({ view: 'kanban' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${view === 'kanban' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
          </Link>
          <Link href={qs({ view: 'list' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${view === 'list' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
            <ListIcon className="w-3.5 h-3.5" /> Liste
          </Link>
        </div>
        {view === 'list' && (
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl flex-wrap">
            {[{ k: '', l: 'Tous' }, { k: 'nouveau', l: 'À traiter' }, { k: 'en_cours', l: 'En cours' }, { k: 'rdv', l: 'RDV' }, { k: 'traite', l: 'Traités' }, { k: 'perdu', l: 'Perdus' }].map((t) => (
              <Link key={t.l} href={qs({ view: 'list', statut: t.k })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${(statut ?? '') === t.k ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
                {t.l}
              </Link>
            ))}
          </div>
        )}
        <form className="flex items-center gap-2 flex-1 min-w-[220px]">
          <input type="hidden" name="view" value={view} />
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input type="text" name="q" defaultValue={q ?? ''} placeholder="Nom, numéro, commune…"
            className="flex-1 px-4 py-2 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]" />
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">OK</button>
        </form>
      </div>

      {total === 0 && (
        <div className="bg-[var(--surface-card)] rounded-2xl p-6 border border-dashed border-[var(--border)] text-center mb-4">
          <p className="text-[var(--text-muted)] text-sm">Aucun prospect pour l&apos;instant — le pipeline se remplit dès qu&apos;un prospect exprime un besoin à Sapphire.</p>
        </div>
      )}
      {view === 'list' && rows.length === 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">Aucun prospect pour ce filtre.</p>
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => {
            const meta = STATUT_META[col]
            const items = byStatut[col]
            return (
              <div key={col} className={`bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] border-t-4 ${meta.col} flex flex-col`}>
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="font-bold text-[var(--text)] text-sm uppercase tracking-wide flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {meta.label}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-subtle)]">{items.length}</span>
                </div>
                <div className="p-2.5 flex flex-col gap-2.5 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-[var(--text-subtle)] text-xs italic text-center py-6">Vide</p>
                  ) : items.map((r) => <KanbanCard key={r.id} r={r} assignedName={r.assigned_to ? nameById[r.assigned_to] : undefined} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => <ListRow key={r.id} r={r} assignedName={r.assigned_to ? nameById[r.assigned_to] : undefined} />)}
        </div>
      )}
    </main>
  )
}

function CriteriaLine({ r }: { r: ProspectRow }) {
  return (
    <p className="text-[11px] text-[var(--text-subtle)] flex items-center gap-2.5 flex-wrap">
      {(r.type_bien || r.commune || r.quartier) && (
        <span className="inline-flex items-center gap-1"><Home className="w-3 h-3" />{[r.type_bien, r.commune, r.quartier].filter(Boolean).join(' · ')}</span>
      )}
      {r.budget != null && <span className="inline-flex items-center gap-1"><Wallet className="w-3 h-3" />{formatFCFA(r.budget)}</span>}
      {r.date_souhaitee && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date_souhaitee}</span>}
    </p>
  )
}

function KanbanCard({ r, assignedName }: { r: ProspectRow; assignedName?: string }) {
  const st = stOf(r.statut)
  const next = NEXT[st]
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-1.5">
      <Link href={`/admin/prospects/${r.id}`} className="min-w-0">
        <p className="font-bold text-[var(--text)] text-sm truncate hover:text-[var(--accent-luxury)]">{r.nom || 'Prospect'}</p>
        <p className="text-[11px] text-[var(--text-muted)] font-mono">+225 {r.phone.replace(/^225/, '')}</p>
      </Link>
      <CriteriaLine r={r} />
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-subtle)] flex-wrap">
        <span className="inline-flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{relative(r.last_seen)}</span>
        {assignedName && <span className="inline-flex items-center gap-1 text-emerald-700"><UserCheck className="w-2.5 h-2.5" />{assignedName}</span>}
        {r.relance_le && <span className="inline-flex items-center gap-1 text-purple-600"><CalendarClock className="w-2.5 h-2.5" />{new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold">
          <MessageCircle className="w-3 h-3" /> Contacter
        </a>
        {next && (
          <form action={setProspectStatutAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="statut" value={next} />
            <button type="submit" title={`Vers « ${STATUT_META[next].label} »`}
              className="inline-flex items-center justify-center px-2 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-lg">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ListRow({ r, assignedName }: { r: ProspectRow; assignedName?: string }) {
  const st = stOf(r.statut)
  const meta = STATUT_META[st]
  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 flex flex-wrap items-start gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/admin/prospects/${r.id}`} className="font-bold text-[var(--text)] text-sm truncate hover:text-[var(--accent-luxury)]">{r.nom || 'Prospect'}</Link>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${meta.cls}`}>{meta.label}</span>
          {assignedName && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700"><UserCheck className="w-3 h-3" />{assignedName}</span>}
          {r.relance_le && <span className="inline-flex items-center gap-1 text-[10px] text-purple-600"><CalendarClock className="w-3 h-3" />relance {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">+225 {r.phone.replace(/^225/, '')} · {r.message_count} msg · {relative(r.last_seen)}</p>
        <div className="mt-1"><CriteriaLine r={r} /></div>
        {r.dernier_message && (
          <p className="text-[11px] text-[var(--text-muted)] italic mt-1 flex items-start gap-1">
            <MessageCircle className="w-3 h-3 mt-0.5 shrink-0" /><span className="line-clamp-1">« {r.dernier_message} »</span>
          </p>
        )}
        {r.note && <p className="text-[11px] text-[var(--text)] mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1 line-clamp-1">📝 {r.note}</p>}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold">
          <MessageCircle className="w-3.5 h-3.5" /> Contacter
        </a>
        <Link href={`/admin/prospects/${r.id}`} className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
          Détails & suivi <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone = 'default' }: { label: string; value: number; icon: typeof Users; tone?: 'default' | 'amber' | 'blue' | 'emerald' }) {
  const cls =
    tone === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
    : tone === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600'
    : tone === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    : 'bg-[var(--surface-card)] border-[var(--border)] text-[var(--text)]'
  return (
    <div className={`px-4 py-3 rounded-xl border ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</p>
      <p className="font-display text-3xl font-black tabular-nums mt-1">{value}</p>
    </div>
  )
}
