import Link from 'next/link'
import {
  Users, MessageCircle, Calendar, Wallet, Download, Home, Clock,
  Inbox, PhoneCall, CheckCircle2, CalendarClock, LayoutGrid, List as ListIcon,
  ChevronRight, UserCheck, FileText, Briefcase, User, RotateCcw, Filter,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'
import { COMMUNES_ABIDJAN } from '@/shared-pkg/constants/communes'
import { setProspectStatutAction } from './actions'
import { bulkSetProspectStatutAction } from './actions'
import { CrmActionForm } from '@/components/admin/CrmActionForm'
import { BulkProspectActions } from '@/components/admin/BulkProspectActions'
import { WhatsAppContactButton } from '@/components/admin/WhatsAppContactButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Statut = 'nouveau' | 'contacte' | 'visite_planifiee' | 'visite_realisee' | 'relance' | 'gagne' | 'perdu' | 'en_cours' | 'rdv' | 'traite'
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
  source_detail?: string | null
  perte_motif?: string | null
  prochaine_action?: string | null
  prochaine_action_at?: string | null
  first_seen: string
  last_seen: string
  version: number
}

function isAgentContact(r: ProspectRow): boolean {
  if (r.source_detail === 'agent') return true
  if (r.source_detail === 'prospect') return false
  return /mon client|mes clients|notre client|mandant|confr[èe]re|cabinet|d[ée]marcheur|demarcheur|interm[ée]diaire|apporteur|pour un client|pour mon client|cherche pour client/i.test(
    r.dernier_message || '',
  )
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    statut?: string
    view?: string
    assigned?: string
    commune?: string
    contactType?: string
  }>
}

const STATUT_META: Record<Statut, { label: string; hint: string; cls: string; dot: string; col: string }> = {
  nouveau: { label: 'Nouveau', hint: 'À contacter', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', col: 'border-t-amber-400' },
  contacte: { label: 'Contacté', hint: 'Échange en cours', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30', dot: 'bg-sky-400', col: 'border-t-sky-400' },
  visite_planifiee: { label: 'Visite planifiée', hint: 'Préparer le rendez-vous', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', dot: 'bg-purple-400', col: 'border-t-purple-400' },
  visite_realisee: { label: 'Visite réalisée', hint: 'Recueillir le retour', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-400', col: 'border-t-indigo-400' },
  relance: { label: 'Relance', hint: 'Prochaine action', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dot: 'bg-orange-400', col: 'border-t-orange-400' },
  gagne: { label: 'Gagné', hint: 'Dossier conclu', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', col: 'border-t-emerald-400' },
  perdu: { label: 'Perdu', hint: 'Motif à analyser', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dot: 'bg-rose-400', col: 'border-t-rose-400' },
  en_cours: { label: 'Contacté', hint: 'Échange en cours', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30', dot: 'bg-sky-400', col: 'border-t-sky-400' },
  rdv: { label: 'Visite planifiée', hint: 'Préparer le rendez-vous', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', dot: 'bg-purple-400', col: 'border-t-purple-400' },
  traite: { label: 'À qualifier', hint: 'Ancien statut à reclasser', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', dot: 'bg-slate-400', col: 'border-t-slate-400' },
}
const KANBAN_COLS: Statut[] = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu', 'traite']
const NEXT: Partial<Record<Statut, Statut>> = { nouveau: 'contacte', contacte: 'visite_planifiee', visite_planifiee: 'visite_realisee', visite_realisee: 'relance', relance: 'gagne' }

function relative(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}
function stOf(s: string): Statut {
  if (s === 'en_cours') return 'contacte'
  if (s === 'rdv') return 'visite_planifiee'
  return (s in STATUT_META ? s : 'nouveau') as Statut
}

export default async function AdminProspectsPage({ searchParams }: PageProps) {
  const { q, statut, view: viewParam, assigned, commune, contactType } = await searchParams
  const view: View = viewParam === 'kanban' ? 'kanban' : 'list'
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any).from('prospects').select('*').is('merged_into', null).order('last_seen', { ascending: false }).limit(500)
  if (view === 'list' && statut && statut in STATUT_META) query = query.eq('statut', statut)
  if (assigned === 'unassigned') query = query.is('assigned_to', null)
  else if (assigned && /^[0-9a-f-]{36}$/i.test(assigned)) query = query.eq('assigned_to', assigned)
  if (commune) query = query.ilike('commune', `%${commune}%`)
  if (q) query = query.or(`nom.ilike.%${q}%,phone.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)

  const countOf = async (s?: Statut) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c = (admin as any).from('prospects').select('id', { count: 'exact', head: true }).is('merged_into', null)
    if (s) c = c.eq('statut', s)
    return (await c).count ?? 0
  }

  const [{ data }, { data: assigneeRows }, total, nNouveau, nEnCours, nTraite] = await Promise.all([
    query,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('profiles')
      .select('id, full_name')
      .not('full_name', 'is', null)
      .order('full_name', { ascending: true })
      .limit(100),
    countOf(),
    countOf('nouveau'),
    countOf('en_cours'),
    countOf('traite'),
  ])

  let rows = (data ?? []) as ProspectRow[]
  if (contactType === 'agent') {
    rows = rows.filter((r) => isAgentContact(r))
  } else if (contactType === 'client') {
    rows = rows.filter((r) => !isAgentContact(r))
  }

  const assignees = (assigneeRows ?? []) as { id: string; full_name: string | null }[]

  // Noms des commerciaux assignés (réutilisés depuis assignees sans requête supplémentaire)
  const nameById: Record<string, string> = {}
  for (const p of assignees) nameById[p.id] = p.full_name || ''

  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (assigned) sp.set('assigned', assigned)
    if (commune) sp.set('commune', commune)
    if (contactType) sp.set('contactType', contactType)
    for (const [k, v] of Object.entries(extra)) if (v) sp.set(k, v)
    const s = sp.toString()
    return `/admin/prospects${s ? `?${s}` : ''}`
  }

  const byStatut: Record<Statut, ProspectRow[]> = {
    nouveau: [], contacte: [], visite_planifiee: [], visite_realisee: [], relance: [], gagne: [], perdu: [],
    en_cours: [], rdv: [], traite: [],
  }
  for (const r of rows) byStatut[stOf(r.statut)].push(r)

  return (
    <main className={`${view === 'kanban' ? 'max-w-[1800px]' : 'max-w-6xl'} mx-auto px-4 py-6 lg:py-10 transition-all`}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--accent-luxury)]" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Prospects</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Une action à la fois : avancez chaque prospect jusqu&apos;à la conclusion.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/admin/fiche-visite"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--text)] hover:opacity-90 text-[var(--surface-card)] rounded-xl text-sm font-black shadow-sm transition-opacity"
          >
            <FileText className="w-4 h-4" /> Fiche de visite (PDF)
          </a>
          <a
            href="/api/admin/prospects/export"
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </a>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Total" value={total} icon={Users} />
        <Stat label="À traiter" value={nNouveau} icon={Inbox} tone="amber" />
        <Stat label="En cours" value={nEnCours} icon={PhoneCall} tone="blue" />
        <Stat label="À reclasser" value={nTraite} icon={CheckCircle2} />
      </div>

      {/* Barre : bascule vue + recherche + filtres */}
      <div className="flex flex-col gap-3 mb-6 bg-[var(--surface-card)] p-3 sm:p-4 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Bascule Vue */}
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl">
            <Link href={qs({ view: 'kanban' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'kanban' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
            </Link>
            <Link href={qs({ view: 'list' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${view === 'list' ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              <ListIcon className="w-3.5 h-3.5" /> Liste
            </Link>
          </div>

          {/* Filtres rapides de statut en vue liste */}
          {view === 'list' && (
            <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl flex-wrap">
              {[{ k: '', l: 'Tous' }, { k: 'nouveau', l: 'Nouveaux' }, { k: 'contacte', l: 'Contactés' }, { k: 'visite_planifiee', l: 'Visites planifiées' }, { k: 'visite_realisee', l: 'Visites réalisées' }, { k: 'relance', l: 'Relances' }, { k: 'gagne', l: 'Gagnés' }, { k: 'perdu', l: 'Perdus' }, { k: 'traite', l: 'À reclasser' }].map((t) => (
                <Link key={t.l} href={qs({ view: 'list', statut: t.k })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${(statut ?? '') === t.k ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                  {t.l}
                </Link>
              ))}
            </div>
          )}

          {/* Reset button if any filter active */}
          {(q || assigned || commune || contactType || (view === 'list' && statut)) && (
            <Link
              href={view === 'kanban' ? '/admin/prospects?view=kanban' : '/admin/prospects'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </Link>
          )}
        </div>

        {/* Formulaire filtres multi-critères */}
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--border)]">
          <input type="hidden" name="view" value={view} />
          {statut && <input type="hidden" name="statut" value={statut} />}

          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Rechercher nom, +225, quartier…"
            className="w-full px-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
          />

          <select
            name="commune"
            defaultValue={commune ?? ''}
            aria-label="Filtrer par commune"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
          >
            <option value="">Toutes les communes</option>
            {COMMUNES_ABIDJAN.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            name="contactType"
            defaultValue={contactType ?? ''}
            aria-label="Filtrer par type de contact"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
          >
            <option value="">Tous les contacts</option>
            <option value="client">Clients directs</option>
            <option value="agent">Agents / Démarcheurs</option>
          </select>

          <div className="flex gap-2">
            <select
              name="assigned"
              defaultValue={assigned ?? ''}
              aria-label="Filtrer par conseiller"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
            >
              <option value="">Tous les conseillers</option>
              <option value="unassigned">Non assignés</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>{person.full_name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Filtrer
            </button>
          </div>
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
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-280px)] scrollbar-thin" aria-label="Pipeline des prospects">
          {KANBAN_COLS.map((col) => {
            const meta = STATUT_META[col]
            const items = byStatut[col]
            return (
              <div key={col} className={`w-[290px] shrink-0 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] border-t-4 ${meta.col} flex flex-col shadow-sm`}>
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-card)] rounded-t-xl sticky top-0 z-10">
                  <span className="font-bold text-[var(--text)] text-sm flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {meta.label}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)]">{items.length}</span>
                </div>
                <p className="px-4 pt-2.5 text-[11px] text-[var(--text-muted)] font-medium">{meta.hint}</p>
                <div className="p-2.5 flex flex-col gap-2.5 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-[var(--text-subtle)] text-xs italic text-center py-8">Vide</p>
                  ) : items.map((r) => <KanbanCard key={r.id} r={r} assignedName={r.assigned_to ? nameById[r.assigned_to] : undefined} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.length > 0 && <BulkProspectActions rows={rows.slice(0, 50).map((r) => ({ id: r.id, version: r.version, label: r.nom || 'Prospect' }))} action={bulkSetProspectStatutAction} />}
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]" aria-hidden="true">
            <span>Prospect</span><span>Besoin</span><span>Dernière activité</span><span>Action</span>
          </div>
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
  const isAgent = isAgentContact(r)
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-1.5">
      <Link href={`/admin/prospects/${r.id}`} className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-[var(--text)] text-sm truncate hover:text-[var(--accent-luxury)]">{r.nom || 'Prospect'}</p>
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${isAgent ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
            {isAgent ? 'Agent' : 'Client'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] font-mono">+225 {r.phone.replace(/^225/, '')}</p>
      </Link>
      <CriteriaLine r={r} />
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-subtle)] flex-wrap">
        <span className="inline-flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{relative(r.last_seen)}</span>
        {assignedName && <span className="inline-flex items-center gap-1 text-emerald-400 font-medium"><UserCheck className="w-2.5 h-2.5" />{assignedName}</span>}
      {r.relance_le && <span className="inline-flex items-center gap-1 text-purple-400 font-medium"><CalendarClock className="w-2.5 h-2.5" />{new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
        {r.prochaine_action_at && <span className="inline-flex items-center gap-1 text-amber-400 font-medium"><CalendarClock className="w-2.5 h-2.5" />action {new Date(r.prochaine_action_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <WhatsAppContactButton
          phone={r.phone}
          prospectId={r.id}
          prospectVersion={r.version}
          currentStatus={r.statut}
          variant="compact"
          className="flex-1"
        />
        <a href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`} target="_blank" rel="noopener noreferrer"
          title="Bon de visite (PDF)"
          className="min-h-[36px] inline-flex items-center justify-center px-2 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl text-[11px] font-bold transition-all active:scale-95">
          <FileText className="w-3.5 h-3.5" />
        </a>
        {next && (
          <CrmActionForm action={setProspectStatutAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="version" value={r.version} />
            <input type="hidden" name="statut" value={next} />
            <button type="submit" title={`Vers « ${STATUT_META[next].label} »`}
              className="min-h-[36px] inline-flex items-center justify-center px-2 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl transition-all active:scale-95">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </CrmActionForm>
        )}
      </div>
    </div>
  )
}

function ListRow({ r, assignedName }: { r: ProspectRow; assignedName?: string }) {
  const st = stOf(r.statut)
  const meta = STATUT_META[st]
  const isAgent = isAgentContact(r)
  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-4 flex flex-wrap items-start gap-x-4 gap-y-2 hover:border-[var(--accent-luxury)]/30 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/admin/prospects/${r.id}`} className="font-bold text-[var(--text)] text-sm truncate hover:text-[var(--accent-luxury)]">{r.nom || 'Prospect'}</Link>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${meta.cls}`}>{meta.label}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isAgent ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
            {isAgent ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
            {isAgent ? 'Agent démarcheur' : 'Client direct'}
          </span>
          {assignedName && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium"><UserCheck className="w-3 h-3" />{assignedName}</span>}
          {r.relance_le && <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-medium"><CalendarClock className="w-3 h-3" />relance {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">+225 {r.phone.replace(/^225/, '')} · {r.message_count} msg · {relative(r.last_seen)}</p>
        <div className="mt-1"><CriteriaLine r={r} /></div>
        {r.dernier_message && (
          <p className="text-[11px] text-[var(--text-muted)] italic mt-1 flex items-start gap-1">
            <MessageCircle className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" /><span className="line-clamp-1">« {r.dernier_message} »</span>
          </p>
        )}
        {r.note && <p className="text-[11px] text-amber-300 font-medium mt-1 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1 line-clamp-1">📝 {r.note}</p>}
        {r.perte_motif && <p className="text-[11px] text-rose-300 font-medium mt-1 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2 py-1 line-clamp-1">Motif de perte : {r.perte_motif}</p>}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <a href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`} target="_blank" rel="noopener noreferrer"
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl text-xs font-bold border border-[var(--border)] transition-all active:scale-95">
            <FileText className="w-3.5 h-3.5" /> Bon de visite
          </a>
          <WhatsAppContactButton
            phone={r.phone}
            prospectId={r.id}
            prospectVersion={r.version}
            currentStatus={r.statut}
          />
        </div>
        <Link href={`/admin/prospects/${r.id}`} className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
          Détails & suivi <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone = 'default' }: { label: string; value: number; icon: typeof Users; tone?: 'default' | 'amber' | 'blue' | 'emerald' }) {
  const cls =
    tone === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 border-l-4 border-l-amber-400'
    : tone === 'blue' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 border-l-4 border-l-sky-400'
    : tone === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border-l-4 border-l-emerald-400'
    : 'bg-[var(--surface-card)] border-[var(--border)] text-[var(--text)] border-l-4 border-l-[var(--border)]'
  return (
    <div className={`px-4 py-3 rounded-xl border ${cls}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</p>
      <p className="font-display text-3xl font-black tabular-nums mt-1">{value}</p>
    </div>
  )
}
