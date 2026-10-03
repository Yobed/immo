import Link from 'next/link'
import {
  Users, MessageCircle, Calendar, Wallet, Download, Home, Clock,
  Inbox, PhoneCall, CheckCircle2, CalendarClock, LayoutGrid, List as ListIcon,
  ChevronRight, UserCheck, FileText, Briefcase, User, RotateCcw, Filter,
  ShieldCheck, Search,
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

const STATUT_META: Record<Statut, { label: string; hint: string; cls: string; dot: string; col: string; bgTone: string }> = {
  nouveau: {
    label: 'Nouveau',
    hint: 'À contacter d’urgence',
    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    col: 'border-t-amber-400',
    bgTone: 'bg-amber-500/5',
  },
  contacte: {
    label: 'Contacté',
    hint: 'Échange en cours',
    cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
    col: 'border-t-sky-400',
    bgTone: 'bg-sky-500/5',
  },
  visite_planifiee: {
    label: 'Visite planifiée',
    hint: 'Préparer le rendez-vous',
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    col: 'border-t-purple-400',
    bgTone: 'bg-purple-500/5',
  },
  visite_realisee: {
    label: 'Visite réalisée',
    hint: 'Recueillir le retour',
    cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    col: 'border-t-indigo-400',
    bgTone: 'bg-indigo-500/5',
  },
  relance: {
    label: 'Relance',
    hint: 'Action de relance requise',
    cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot: 'bg-orange-400',
    col: 'border-t-orange-400',
    bgTone: 'bg-orange-500/5',
  },
  gagne: {
    label: 'Gagné',
    hint: 'Dossier conclu avec succès',
    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    col: 'border-t-emerald-400',
    bgTone: 'bg-emerald-500/5',
  },
  perdu: {
    label: 'Perdu',
    hint: 'Motif à analyser',
    cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    col: 'border-t-rose-400',
    bgTone: 'bg-rose-500/5',
  },
  en_cours: {
    label: 'Contacté',
    hint: 'Échange en cours',
    cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-400',
    col: 'border-t-sky-400',
    bgTone: 'bg-sky-500/5',
  },
  rdv: {
    label: 'Visite planifiée',
    hint: 'Préparer le rendez-vous',
    cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    col: 'border-t-purple-400',
    bgTone: 'bg-purple-500/5',
  },
  traite: {
    label: 'À qualifier',
    hint: 'Ancien statut à reclasser',
    cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dot: 'bg-slate-400',
    col: 'border-t-slate-400',
    bgTone: 'bg-slate-500/5',
  },
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

  return (
    <main className={`${view === 'kanban' ? 'max-w-[1800px]' : 'max-w-6xl'} mx-auto px-4 py-6 lg:py-10 transition-all`}>
      {/* 1. Sous-navigation CRM & actions rapides */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/prospects"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-luxury)] text-[#0b1530] shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pipeline CRM</span>
          </Link>
          <Link
            href="/admin/prospects/qualite"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
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
            title="Générer un bon de visite vierge au format PDF"
          >
            <FileText className="w-4 h-4 text-[var(--accent-luxury)]" />
            <span>Fiche de visite (PDF)</span>
          </a>
          <a
            href="/api/admin/prospects/export"
            className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Exporter l'ensemble de la base prospects en fichier CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Titre et description de la page */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-luxury)]/15 border border-[var(--accent-luxury)]/30 flex items-center justify-center text-[var(--accent-luxury)]">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)]">Prospects CRM</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Pilotage commercial des leads WhatsApp et contacts directs — faites progresser chaque opportunité jusqu&apos;à la signature.
          </p>
        </div>
      </header>

      {/* 3. Métriques KPI interactives (filtres 1-clic) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Total Leads"
          value={total}
          icon={Users}
          href={qs({ statut: '', view: 'kanban' })}
          isActive={!statut && view === 'kanban'}
          tone="default"
        />
        <StatCard
          label="À contacter"
          value={nNouveau}
          icon={Inbox}
          href={qs({ statut: 'nouveau', view: 'list' })}
          isActive={statut === 'nouveau'}
          tone="amber"
        />
        <StatCard
          label="En discussion"
          value={nContacte}
          icon={PhoneCall}
          href={qs({ statut: 'contacte', view: 'list' })}
          isActive={statut === 'contacte'}
          tone="blue"
        />
        <StatCard
          label="Visites"
          value={nVisite}
          icon={Calendar}
          href={qs({ statut: 'visite_planifiee', view: 'list' })}
          isActive={statut === 'visite_planifiee'}
          tone="purple"
        />
        <StatCard
          label="Relances"
          value={nRelance}
          icon={CalendarClock}
          href={qs({ statut: 'relance', view: 'list' })}
          isActive={statut === 'relance'}
          tone="orange"
        />
        <StatCard
          label="Gagnés"
          value={nGagne}
          icon={CheckCircle2}
          href={qs({ statut: 'gagne', view: 'list' })}
          isActive={statut === 'gagne'}
          tone="emerald"
        />
      </div>

      {/* 4. Barre d'outils et filtres ergonomiques */}
      <div className="flex flex-col gap-3.5 mb-6 bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm">
        {/* Ligne 1 : Bascule vue + Type de contact + Bouton reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bascule Vue Kanban vs Liste */}
            <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)]">
              <Link
                href={qs({ view: 'kanban' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'kanban'
                    ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
                <span>Pipeline (Kanban)</span>
              </Link>
              <Link
                href={qs({ view: 'list' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'list'
                    ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
                <span>Tableau (Liste)</span>
              </Link>
            </div>

            {/* Segmented type filter */}
            <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)]">
              <Link
                href={qs({ contactType: '' })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  !contactType
                    ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Tous profils
              </Link>
              <Link
                href={qs({ contactType: 'client' })}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  contactType === 'client'
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <User className="w-3 h-3 text-emerald-400" />
                Clients directs
              </Link>
              <Link
                href={qs({ contactType: 'agent' })}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  contactType === 'agent'
                    ? 'bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Briefcase className="w-3 h-3 text-purple-400" />
                Démarcheurs
              </Link>
            </div>
          </div>

          {/* Bouton de réinitialisation si filtre actif */}
          {hasActiveFilters && (
            <Link
              href={view === 'kanban' ? '/admin/prospects?view=kanban' : '/admin/prospects'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser filtres</span>
            </Link>
          )}
        </div>

        {/* Ligne 2 : Filtres rapides de statut en vue liste */}
        {view === 'list' && (
          <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1.5 rounded-xl flex-wrap border border-[var(--border)]/60">
            {[
              { k: '', l: 'Tous les statuts' },
              { k: 'nouveau', l: 'Nouveaux' },
              { k: 'contacte', l: 'Contactés' },
              { k: 'visite_planifiee', l: 'Visites planifiées' },
              { k: 'visite_realisee', l: 'Visites réalisées' },
              { k: 'relance', l: 'Relances' },
              { k: 'gagne', l: 'Gagnés' },
              { k: 'perdu', l: 'Perdus' },
              { k: 'traite', l: 'À qualifier' },
            ].map((t) => (
              <Link
                key={t.l}
                href={qs({ view: 'list', statut: t.k })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  (statut ?? '') === t.k
                    ? 'bg-[var(--surface-card)] text-[var(--accent-luxury)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t.l}
              </Link>
            ))}
          </div>
        )}

        {/* Ligne 3 : Formulaire filtres de recherche multi-critères */}
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-[var(--border)]">
          <input type="hidden" name="view" value={view} />
          {statut && <input type="hidden" name="statut" value={statut} />}
          {contactType && <input type="hidden" name="contactType" value={contactType} />}

          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Rechercher nom, +225, quartier…"
              className="w-full pl-9 pr-3.5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)] transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          <select
            name="commune"
            defaultValue={commune ?? ''}
            aria-label="Filtrer par commune"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
          >
            <option value="">Toutes les communes</option>
            {COMMUNES_ABIDJAN.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            name="assigned"
            defaultValue={assigned ?? ''}
            aria-label="Filtrer par conseiller"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
          >
            <option value="">Tous les conseillers</option>
            <option value="unassigned">Non assignés</option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>{person.full_name}</option>
            ))}
          </select>

          <button
            type="submit"
            className="min-h-[38px] px-5 py-2 bg-[var(--accent-luxury)] hover:brightness-110 text-[#0b1530] rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 inline-flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrer les leads</span>
          </button>
        </form>
      </div>

      {/* 5. Contenu selon vue (Kanban ou Liste) */}
      {total === 0 && (
        <div className="bg-[var(--surface-card)] rounded-2xl p-10 border border-dashed border-[var(--border)] text-center mb-6">
          <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
          <p className="font-bold text-[var(--text)] text-base">Aucun prospect enregistré pour le moment</p>
          <p className="text-[var(--text-muted)] text-sm mt-1 max-w-md mx-auto">
            Le pipeline se remplit automatiquement dès qu&apos;un visiteur entame une conversation WhatsApp avec Sapphire.
          </p>
        </div>
      )}

      {view === 'list' && rows.length === 0 && total > 0 ? (
        <div className="bg-[var(--surface-card)] rounded-2xl p-12 border border-[var(--border)] text-center">
          <Filter className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3 opacity-60" />
          <p className="font-bold text-[var(--text)] text-base">Aucun prospect correspondant aux filtres appliqués</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">Modifiez vos critères ou réinitialisez les filtres.</p>
        </div>
      ) : view === 'kanban' ? (
        <div
          className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-280px)] scrollbar-thin"
          aria-label="Pipeline des prospects"
        >
          {KANBAN_COLS.map((col) => {
            const meta = STATUT_META[col]
            const items = byStatut[col]
            return (
              <div
                key={col}
                className={`w-[305px] shrink-0 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] border-t-4 ${meta.col} flex flex-col shadow-sm`}
              >
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-card)] rounded-t-xl sticky top-0 z-10">
                  <span className="font-bold text-[var(--text)] text-sm flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]">
                    {items.length}
                  </span>
                </div>
                <p className="px-4 pt-2.5 text-[11px] text-[var(--text-muted)] font-medium">
                  {meta.hint}
                </p>
                <div className="p-3 flex flex-col gap-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)]/60 p-6 text-center">
                      <p className="text-[var(--text-subtle)] text-xs italic">Aucun prospect à cette étape</p>
                    </div>
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
        <div className="space-y-3">
          {rows.length > 0 && (
            <BulkProspectActions
              rows={rows.slice(0, 50).map((r) => ({ id: r.id, version: r.version, label: r.nom || 'Prospect' }))}
              action={bulkSetProspectStatutAction}
            />
          )}
          <div
            className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]"
            aria-hidden="true"
          >
            <span>Prospect & Profil</span>
            <span>Critères & Budget</span>
            <span>Dernière activité & Suivi</span>
            <span className="text-right">Actions rapides</span>
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
  return (
    <div className="text-xs text-[var(--text-subtle)] flex items-center gap-2.5 flex-wrap">
      {(r.type_bien || r.commune || r.quartier) && (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--text)]">
          <Home className="w-3.5 h-3.5 text-[var(--accent-luxury)] shrink-0" />
          {[r.type_bien, r.commune, r.quartier].filter(Boolean).join(' · ')}
        </span>
      )}
      {r.budget != null && (
        <span className="inline-flex items-center gap-1 font-bold text-[var(--accent-luxury)]">
          <Wallet className="w-3.5 h-3.5 shrink-0" />
          {formatFCFA(r.budget)}
        </span>
      )}
      {r.date_souhaitee && (
        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {r.date_souhaitee}
        </span>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-col gap-2 hover:border-[var(--accent-luxury)]/40 hover:shadow-md transition-all group">
      {/* Header: Nom & Badge Client / Démarcheur */}
      <div className="flex items-start justify-between gap-1.5">
        <Link href={`/admin/prospects/${r.id}`} className="min-w-0 flex-1">
          <p className="font-bold text-[var(--text)] text-sm truncate group-hover:text-[var(--accent-luxury)] transition-colors">
            {r.nom || 'Prospect sans nom'}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            +225 {r.phone.replace(/^225/, '')}
          </p>
        </Link>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isAgent
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isAgent ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
          {isAgent ? 'Agent' : 'Client'}
        </span>
      </div>

      {/* Critères immo (Type de bien, commune, budget) */}
      <CriteriaLine r={r} />

      {/* Note si présente */}
      {r.note && (
        <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 line-clamp-1">
          📝 {r.note}
        </div>
      )}

      {/* Meta tags: last seen, conseiller, relance */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-subtle)] flex-wrap pt-1 border-t border-[var(--border)]/60">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {relative(r.last_seen)}
        </span>
        {assignedName && (
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <UserCheck className="w-2.5 h-2.5" />
            {assignedName}
          </span>
        )}
        {r.relance_le && (
          <span
            className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded ${
              isRelanceOverdue
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                : 'bg-orange-500/15 text-orange-400'
            }`}
          >
            <CalendarClock className="w-2.5 h-2.5" />
            {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {/* Actions CTAs: WhatsApp officiel, Bon de visite PDF, Avancer étape */}
      <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-[var(--border)]/60">
        <WhatsAppContactButton
          phone={r.phone}
          prospectId={r.id}
          prospectVersion={r.version}
          currentStatus={r.statut}
          variant="compact"
          className="flex-1"
        />
        <a
          href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Générer le Bon de visite (PDF)"
          className="min-h-[36px] inline-flex items-center justify-center px-2.5 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl text-xs font-bold transition-all active:scale-95 border border-[var(--border)]"
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
              title={`Avancer à l'étape « ${STATUT_META[next].label} »`}
              className="min-h-[36px] inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] hover:text-[var(--accent-luxury)] rounded-xl text-xs font-bold transition-all active:scale-95 border border-[var(--border)]"
            >
              <span>{STATUT_META[next].label.split(' ')[0]}</span>
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
  const isRelanceOverdue = r.relance_le ? new Date(r.relance_le) <= new Date() : false

  return (
    <div
      className={`bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] border-l-4 ${meta.col} p-4 md:p-5 flex flex-wrap items-start justify-between gap-4 hover:border-[var(--accent-luxury)]/40 hover:shadow-md transition-all`}
    >
      <div className="min-w-0 flex-1 space-y-2">
        {/* Top line: Name, Status badge, Client/Agent badge, Advisor, Relance */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/prospects/${r.id}`}
            className="font-bold text-[var(--text)] text-base hover:text-[var(--accent-luxury)] transition-colors"
          >
            {r.nom || 'Prospect sans nom'}
          </Link>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${meta.cls}`}>
            {meta.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isAgent
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isAgent ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
            {isAgent ? 'Agent démarcheur' : 'Client direct'}
          </span>
          {assignedName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <UserCheck className="w-3 h-3" />
              {assignedName}
            </span>
          )}
          {r.relance_le && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                isRelanceOverdue
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                  : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}
            >
              <CalendarClock className="w-3 h-3" />
              Relance {new Date(r.relance_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {/* Contact info & activity */}
        <p className="text-xs text-[var(--text-muted)] font-mono">
          +225 {r.phone.replace(/^225/, '')} · {r.message_count} échange(s) · Actif {relative(r.last_seen)}
        </p>

        {/* Search criteria */}
        <CriteriaLine r={r} />

        {/* Last message preview */}
        {r.dernier_message && (
          <p className="text-xs text-[var(--text-muted)] italic bg-[var(--surface-hover)] rounded-xl px-3 py-1.5 flex items-start gap-1.5 border border-[var(--border)]/50">
            <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#25D366]" />
            <span className="line-clamp-2">« {r.dernier_message} »</span>
          </p>
        )}

        {/* Note if present */}
        {r.note && (
          <p className="text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 line-clamp-2">
            📝 {r.note}
          </p>
        )}

        {/* Perte motif if present */}
        {r.perte_motif && (
          <p className="text-xs text-rose-300 font-medium bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-1.5 line-clamp-1">
            Motif de perte : {r.perte_motif}
          </p>
        )}
      </div>

      {/* Action buttons on right */}
      <div className="flex flex-col items-end gap-2 shrink-0 self-center">
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl text-xs font-bold border border-[var(--border)] transition-all active:scale-95 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
            <span>Bon de visite</span>
          </a>
          <WhatsAppContactButton
            phone={r.phone}
            prospectId={r.id}
            prospectVersion={r.version}
            currentStatus={r.statut}
          />
        </div>
        <Link
          href={`/admin/prospects/${r.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-luxury)] transition-colors px-1"
        >
          <span>Détails & Suivi complet</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  isActive = false,
  tone = 'default',
}: {
  label: string
  value: number
  icon: typeof Users
  href: string
  isActive?: boolean
  tone?: 'default' | 'amber' | 'blue' | 'purple' | 'orange' | 'emerald'
}) {
  const toneClasses = {
    amber: 'border-l-amber-400 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15',
    blue: 'border-l-sky-400 bg-sky-500/10 text-sky-400 hover:bg-sky-500/15',
    purple: 'border-l-purple-400 bg-purple-500/10 text-purple-400 hover:bg-purple-500/15',
    orange: 'border-l-orange-400 bg-orange-500/10 text-orange-400 hover:bg-orange-500/15',
    emerald: 'border-l-emerald-400 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
    default: 'border-l-[var(--border)] bg-[var(--surface-card)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
  }
  const activeRing = isActive ? 'ring-2 ring-[var(--accent-luxury)] shadow-md' : 'border-[var(--border)]'

  return (
    <Link
      href={href}
      className={`group block p-3.5 rounded-xl border border-l-4 transition-all duration-200 active:scale-[0.98] ${toneClasses[tone]} ${activeRing}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 inline-flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </span>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-[var(--accent-luxury)] animate-pulse" />
        )}
      </div>
      <p className="font-display text-2xl md:text-3xl font-black tabular-nums tracking-tight">
        {value}
      </p>
    </Link>
  )
}
