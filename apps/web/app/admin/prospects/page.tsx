import Link from 'next/link'
import {
  Users, MessageCircle, Calendar, Wallet, Download, Home, Clock,
  LayoutGrid, List as ListIcon, ChevronRight, UserCheck, FileText,
  RotateCcw, Search, ShieldCheck,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatFCFA } from '@/lib/format'
import { COMMUNES_ABIDJAN } from '@/shared-pkg/constants/communes'
import { setProspectStatutAction, bulkSetProspectStatutAction } from './actions'
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

const STATUT_CONFIG: Record<Statut, { label: string; hint: string; dot: string }> = {
  nouveau: { label: 'Nouveau', hint: 'À contacter', dot: 'bg-amber-400' },
  contacte: { label: 'Contacté', hint: 'En discussion', dot: 'bg-sky-400' },
  visite_planifiee: { label: 'Visite planifiée', hint: 'Rendez-vous fixé', dot: 'bg-purple-400' },
  visite_realisee: { label: 'Visite réalisée', hint: 'Retour attendu', dot: 'bg-indigo-400' },
  relance: { label: 'Relance', hint: 'Action requise', dot: 'bg-orange-400' },
  gagne: { label: 'Gagné', hint: 'Dossier conclu', dot: 'bg-emerald-400' },
  perdu: { label: 'Perdu', hint: 'Sans suite', dot: 'bg-rose-400' },
  en_cours: { label: 'Contacté', hint: 'En discussion', dot: 'bg-sky-400' },
  rdv: { label: 'Visite planifiée', hint: 'Rendez-vous fixé', dot: 'bg-purple-400' },
  traite: { label: 'À qualifier', hint: 'À reclasser', dot: 'bg-zinc-400' },
}

const KANBAN_COLS: Statut[] = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu', 'traite']
const NEXT: Partial<Record<Statut, Statut>> = {
  nouveau: 'contacte',
  contacte: 'visite_planifiee',
  visite_planifiee: 'visite_realisee',
  visite_realisee: 'relance',
  relance: 'gagne',
}

function relative(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function stOf(s: string): Statut {
  if (s === 'en_cours') return 'contacte'
  if (s === 'rdv') return 'visite_planifiee'
  return (s in STATUT_CONFIG ? s : 'nouveau') as Statut
}

export default async function AdminProspectsPage({ searchParams }: PageProps) {
  const { q, statut, view: viewParam, assigned, commune, contactType } = await searchParams
  const view: View = viewParam === 'kanban' ? 'kanban' : 'list'
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any).from('prospects').select('*').is('merged_into', null).order('last_seen', { ascending: false }).limit(500)
  if (view === 'list' && statut && statut in STATUT_CONFIG) query = query.eq('statut', statut)
  if (assigned === 'unassigned') query = query.is('assigned_to', null)
  else if (assigned && /^[0-9a-f-]{36}$/i.test(assigned)) query = query.eq('assigned_to', assigned)
  if (commune) query = query.ilike('commune', `%${commune}%`)
  if (q) query = query.or(`nom.ilike.%${q}%,phone.ilike.%${q}%,commune.ilike.%${q}%,quartier.ilike.%${q}%`)

  const countOf = async (s?: Statut | Statut[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c = (admin as any).from('prospects').select('id', { count: 'exact', head: true }).is('merged_into', null)
    if (Array.isArray(s)) c = c.in('statut', s)
    else if (s) c = c.eq('statut', s)
    return (await c).count ?? 0
  }

  const [
    { data },
    { data: assigneeRows },
    total,
    nNouveau,
    nContacte,
    nVisite,
    nRelance,
    nGagne,
  ] = await Promise.all([
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
    countOf(['contacte', 'en_cours']),
    countOf(['visite_planifiee', 'visite_realisee', 'rdv']),
    countOf('relance'),
    countOf('gagne'),
  ])

  let rows = (data ?? []) as ProspectRow[]
  if (contactType === 'agent') {
    rows = rows.filter((r) => isAgentContact(r))
  } else if (contactType === 'client') {
    rows = rows.filter((r) => !isAgentContact(r))
  }

  const assignees = (assigneeRows ?? []) as { id: string; full_name: string | null }[]
  const nameById: Record<string, string> = {}
  for (const p of assignees) nameById[p.id] = p.full_name || ''

  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (assigned) sp.set('assigned', assigned)
    if (commune) sp.set('commune', commune)
    if (contactType) sp.set('contactType', contactType)
    if (statut && !('statut' in extra)) sp.set('statut', statut)
    if (view && !('view' in extra)) sp.set('view', view)
    for (const [k, v] of Object.entries(extra)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    const s = sp.toString()
    return `/admin/prospects${s ? `?${s}` : ''}`
  }

  const byStatut: Record<Statut, ProspectRow[]> = {
    nouveau: [], contacte: [], visite_planifiee: [], visite_realisee: [], relance: [], gagne: [], perdu: [],
    en_cours: [], rdv: [], traite: [],
  }
  for (const r of rows) byStatut[stOf(r.statut)].push(r)

  const hasActiveFilters = Boolean(q || assigned || commune || contactType || (view === 'list' && statut))

  const METRIC_TABS = [
    { key: '', label: 'Tous', count: total },
    { key: 'nouveau', label: 'Nouveaux', count: nNouveau, dot: 'bg-amber-400' },
    { key: 'contacte', label: 'Contactés', count: nContacte, dot: 'bg-sky-400' },
    { key: 'visite_planifiee', label: 'Visites', count: nVisite, dot: 'bg-purple-400' },
    { key: 'relance', label: 'Relances', count: nRelance, dot: 'bg-orange-400' },
    { key: 'gagne', label: 'Gagnés', count: nGagne, dot: 'bg-emerald-400' },
  ]

  return (
    <main className={`${view === 'kanban' ? 'max-w-[1800px]' : 'max-w-6xl'} mx-auto px-4 py-6 md:py-8 space-y-5`}>
      {/* 1. Sous-navigation épurée (Style Linear) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
          <Link
            href="/admin/prospects"
            className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--surface-card)] text-[var(--text)] shadow-xs"
          >
            Pipeline & Leads
          </Link>
          <Link
            href="/admin/prospects/qualite"
            className="px-3 py-1 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
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
            title="Fiche de visite vierge au format PDF"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
            <span>Fiche vierge (PDF)</span>
          </a>
          <a
            href="/api/admin/prospects/export"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Exporter la base prospects en format CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
            <span>Exporter CSV</span>
          </a>
        </div>
      </div>

      {/* 2. En-tête sobre & strip de métriques filtrables */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-semibold text-[var(--text)] tracking-tight">Prospects</h1>
          <span className="text-xs text-[var(--text-subtle)] font-mono">({total})</span>
        </div>
      </div>

      {/* Bandeau de filtres par statut (remplace les cartes héro chargées) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--border)] pb-2">
        {METRIC_TABS.map((tab) => {
          const active = (statut ?? '') === tab.key && (tab.key ? view === 'list' : true)
          return (
            <Link
              key={tab.label}
              href={qs({ statut: tab.key, view: tab.key ? 'list' : view })}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]/50'
              }`}
            >
              {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
              <span>{tab.label}</span>
              <span className={`text-[11px] tabular-nums font-mono ${active ? 'text-[var(--text)]' : 'text-[var(--text-subtle)]'}`}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* 3. Barre d'outils unifiée : Vue, Profil, Recherche & Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bascule Pipeline / Liste */}
          <div className="flex items-center gap-0.5 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
            <Link
              href={qs({ view: 'kanban' })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </Link>
            <Link
              href={qs({ view: 'list' })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                view === 'list'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </Link>
          </div>

          {/* Filtre profil client / démarcheur */}
          <div className="flex items-center gap-0.5 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
            <Link
              href={qs({ contactType: '' })}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                !contactType
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Tous
            </Link>
            <Link
              href={qs({ contactType: 'client' })}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                contactType === 'client'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Clients
            </Link>
            <Link
              href={qs({ contactType: 'agent' })}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                contactType === 'agent'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Démarcheurs
            </Link>
          </div>

          {hasActiveFilters && (
            <Link
              href={view === 'kanban' ? '/admin/prospects?view=kanban' : '/admin/prospects'}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-subtle)] hover:text-rose-400 font-medium ml-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Effacer</span>
            </Link>
          )}
        </div>

        {/* Formulaire de recherche et filtres de sélection */}
        <form className="flex items-center gap-2 flex-1 sm:max-w-md">
          <input type="hidden" name="view" value={view} />
          {statut && <input type="hidden" name="statut" value={statut} />}
          {contactType && <input type="hidden" name="contactType" value={contactType} />}

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Nom, numéro, quartier..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)] placeholder:text-[var(--text-subtle)] transition-colors"
            />
          </div>

          <select
            name="commune"
            defaultValue={commune ?? ''}
            aria-label="Filtrer par commune"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
          >
            <option value="">Commune</option>
            {COMMUNES_ABIDJAN.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            name="assigned"
            defaultValue={assigned ?? ''}
            aria-label="Filtrer par conseiller"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
          >
            <option value="">Conseiller</option>
            <option value="unassigned">Non assigné</option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>{person.full_name}</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-[var(--text)] text-[var(--surface-card)] hover:opacity-90 rounded-lg text-xs font-semibold transition-opacity"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* 4. Affichage Pipeline ou Tableau */}
      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-xs text-[var(--text-muted)]">Aucun prospect enregistré pour le moment.</p>
        </div>
      ) : view === 'list' && rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-10 text-center">
          <p className="text-xs text-[var(--text-muted)]">Aucun prospect ne correspond aux critères appliqués.</p>
        </div>
      ) : view === 'kanban' ? (
        <div
          className="flex gap-3 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-250px)] scrollbar-thin"
          aria-label="Pipeline des prospects"
        >
          {KANBAN_COLS.map((col) => {
            const config = STATUT_CONFIG[col]
            const items = byStatut[col]
            return (
              <div
                key={col}
                className="w-[280px] shrink-0 bg-[var(--surface-card)] rounded-xl border border-[var(--border)] flex flex-col shadow-xs"
              >
                <div className="px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-10 bg-[var(--surface-card)] rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                    <span className="font-semibold text-xs text-[var(--text)]">{config.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-subtle)]">{items.length}</span>
                </div>
                <div className="p-2 flex flex-col gap-2 max-h-[calc(100vh-310px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-subtle)] italic text-center py-6">Vide</p>
                  ) : (
                    items.map((r) => (
                      <KanbanCard key={r.id} r={r} assignedName={r.assigned_to ? nameById[r.assigned_to] : undefined} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.length > 0 && (
            <BulkProspectActions
              rows={rows.slice(0, 50).map((r) => ({ id: r.id, version: r.version, label: r.nom || 'Prospect' }))}
              action={bulkSetProspectStatutAction}
            />
          )}
          <div
            className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]"
            aria-hidden="true"
          >
            <span>Prospect & Contact</span>
            <span>Critères</span>
            <span>Activité</span>
            <span className="text-right">Actions</span>
          </div>
          {rows.map((r) => (
            <ListRow key={r.id} r={r} assignedName={r.assigned_to ? nameById[r.assigned_to] : undefined} />
          ))}
        </div>
      )}
    </main>
  )
}

function CriteriaLine({ r }: { r: ProspectRow }) {
  const parts = [r.type_bien, r.commune, r.quartier].filter(Boolean)
  if (parts.length === 0 && r.budget == null) return null
  return (
    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
      {parts.length > 0 && <span>{parts.join(', ')}</span>}
      {parts.length > 0 && r.budget != null && <span className="text-[var(--text-subtle)]">·</span>}
      {r.budget != null && (
        <span className="font-medium text-[var(--text)]">{formatFCFA(r.budget)}</span>
      )}
    </div>
  )
}

function KanbanCard({ r, assignedName }: { r: ProspectRow; assignedName?: string }) {
  const st = stOf(r.statut)
  const next = NEXT[st]
  const isAgent = isAgentContact(r)
  const isRelanceOverdue = r.relance_le ? new Date(r.relance_le) <= new Date() : false

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-2 hover:border-[var(--text-muted)] transition-colors group">
      {/* Ligne 1 : Nom & tag démarcheur éventuel */}
      <div className="flex items-start justify-between gap-1.5">
        <Link href={`/admin/prospects/${r.id}`} className="min-w-0 flex-1">
          <p className="font-semibold text-xs text-[var(--text)] truncate group-hover:text-[var(--accent-luxury)] transition-colors">
            {r.nom || 'Prospect sans nom'}
          </p>
          <p className="text-[11px] text-[var(--text-subtle)] font-mono mt-0.5">
            +225 {r.phone.replace(/^225/, '')}
          </p>
        </Link>
        {isAgent && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)]">
            Démarcheur
          </span>
        )}
      </div>

      {/* Critères */}
      <CriteriaLine r={r} />

      {/* Note si présente */}
      {r.note && (
        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 italic bg-[var(--surface-hover)] px-2 py-0.5 rounded">
          {r.note}
        </p>
      )}

      {/* Meta ligne */}
      <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] pt-1 border-t border-[var(--border)]/50">
        <span>{relative(r.last_seen)}</span>
        <div className="flex items-center gap-2">
          {assignedName && (
            <span className="truncate max-w-[85px]">{assignedName}</span>
          )}
          {r.relance_le && (
            <span className={isRelanceOverdue ? 'text-amber-400 font-medium' : ''}>
              Relance {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]/50">
        <WhatsAppContactButton
          phone={r.phone}
          prospectId={r.id}
          prospectVersion={r.version}
          currentStatus={r.statut}
          variant="compact"
          className="flex-1 text-[11px] h-7 min-h-0 py-1"
        />
        <a
          href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Fiche de visite (PDF)"
          className="h-7 px-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
        </a>
        {next && (
          <CrmActionForm action={setProspectStatutAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="version" value={r.version} />
            <input type="hidden" name="statut" value={next} />
            <button
              type="submit"
              title={`Passer à : ${STATUT_CONFIG[next].label}`}
              className="h-7 px-2 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center transition-colors"
            >
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
  const config = STATUT_CONFIG[st]
  const isAgent = isAgentContact(r)
  const isRelanceOverdue = r.relance_le ? new Date(r.relance_le) <= new Date() : false

  return (
    <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--surface-hover)]/30 transition-colors">
      <div className="min-w-0 flex-1 space-y-1">
        {/* Ligne 1: Nom, Statut, Démarcheur (si agent) */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/prospects/${r.id}`}
            className="font-semibold text-sm text-[var(--text)] hover:text-[var(--accent-luxury)] transition-colors"
          >
            {r.nom || 'Prospect sans nom'}
          </Link>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]">
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <span>{config.label}</span>
          </span>
          {isAgent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)]">
              Démarcheur
            </span>
          )}
          <span className="text-xs text-[var(--text-subtle)] font-mono">
            +225 {r.phone.replace(/^225/, '')}
          </span>
        </div>

        {/* Ligne 2: Critères */}
        <CriteriaLine r={r} />

        {/* Ligne 3: Dernier message ou note */}
        {r.dernier_message && (
          <p className="text-[11px] text-[var(--text-subtle)] truncate max-w-xl">
            « {r.dernier_message} »
          </p>
        )}
        {r.note && (
          <p className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded inline-block">
            Note: {r.note}
          </p>
        )}
      </div>

      {/* Meta + Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right text-[11px] text-[var(--text-subtle)] hidden sm:block">
          <div>{relative(r.last_seen)}</div>
          {assignedName && <div className="text-[var(--text-muted)]">{assignedName}</div>}
          {r.relance_le && (
            <div className={isRelanceOverdue ? 'text-amber-400 font-medium' : ''}>
              Relance {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center gap-1 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
            <span className="hidden md:inline">Bon visite</span>
          </a>
          <WhatsAppContactButton
            phone={r.phone}
            prospectId={r.id}
            prospectVersion={r.version}
            currentStatus={r.statut}
            className="h-8 min-h-0 text-xs py-1"
          />
          <Link
            href={`/admin/prospects/${r.id}`}
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] flex items-center gap-1 transition-colors"
          >
            <span>Détails</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
