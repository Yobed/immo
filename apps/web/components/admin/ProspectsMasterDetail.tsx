'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Search, X, MessageCircle,
  FileText, LayoutGrid, Table, Download, RotateCcw,
} from 'lucide-react'
import { formatFCFA } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'
import { markProspectContactedAction } from '@/app/admin/prospects/actions'

export interface ProspectRow {
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

interface Assignee {
  id: string
  full_name: string | null
}

interface DetailData {
  prospect: ProspectRow
  contactCount: number
  visiteCount: number
  reservationCount: number
  crmEvents: Array<{
    id: string
    event_type: string
    from_status: string | null
    to_status: string | null
    note: string | null
    created_at: string
    actor_name?: string | null
  }>
  visites: Array<{
    id: string
    date_souhaitee: string
    heure_debut: string | null
    heure_fin: string | null
    statut: string
    biens: {
      id: string
      titre: string
      commune: string | null
      quartier: string | null
      prix_mois_fcfa: number | null
      prix_vente_fcfa: number | null
    } | null
  }>
  messages: Array<{
    direction: string
    body: string
    created_at: string
    metadata?: {
      actor_type?: string
      trace_source?: string
    } | null
  }>
  matchingBiens: Array<{
    id: string
    source: string
    sourceId: string
    titre: string
    commune: string
    quartier?: string
    prix_label: string
    url: string
  }>
}

interface Props {
  initialRows: ProspectRow[]
  assignees: Assignee[]
  totalCount: number
  statusCounts: Record<string, number>
  initialSelectedId?: string
}

const STATUT_CONFIG: Record<string, { label: string; dot: string }> = {
  nouveau: { label: 'Nouveau', dot: 'bg-amber-400' },
  contacte: { label: 'Contacté', dot: 'bg-sky-400' },
  visite_planifiee: { label: 'Visite planifiée', dot: 'bg-purple-400' },
  visite_realisee: { label: 'Visite réalisée', dot: 'bg-indigo-400' },
  relance: { label: 'Relance', dot: 'bg-orange-400' },
  gagne: { label: 'Gagné', dot: 'bg-emerald-400' },
  perdu: { label: 'Perdu', dot: 'bg-rose-400' },
  traite: { label: 'À qualifier', dot: 'bg-zinc-400' },
}

const PIPELINE_FLOW = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne']

function relativeTime(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export function ProspectsMasterDetail({
  initialRows,
  assignees,
  totalCount,
  statusCounts,
  initialSelectedId,
}: Props) {
  const [rows, setRows] = useState<ProspectRow[]>(initialRows)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')
  const [activeTab, setActiveTab] = useState<'projet' | 'chat' | 'visites' | 'historique'>('projet')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCommune, setFilterCommune] = useState<string>('')
  const [filterAssigned, setFilterAssigned] = useState<string>('')

  const [, startTransition] = useTransition()

  // Assignee map
  const nameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const a of assignees) map[a.id] = a.full_name || ''
    return map
  }, [assignees])

  // Commune list
  const communes = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.commune) set.add(r.commune)
    }
    return Array.from(set).sort()
  }, [rows])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterStatus) {
        if (filterStatus === 'contacte') {
          if (r.statut !== 'contacte' && r.statut !== 'en_cours') return false
        } else if (filterStatus === 'visite_planifiee') {
          if (r.statut !== 'visite_planifiee' && r.statut !== 'rdv' && r.statut !== 'visite_realisee') return false
        } else if (r.statut !== filterStatus) {
          return false
        }
      }

      if (filterType === 'client' && r.source_detail === 'agent') return false
      if (filterType === 'agent' && r.source_detail !== 'agent') return false

      if (filterCommune && r.commune?.toLowerCase() !== filterCommune.toLowerCase()) return false
      if (filterAssigned === 'unassigned' && r.assigned_to) return false
      if (filterAssigned && filterAssigned !== 'unassigned' && r.assigned_to !== filterAssigned) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const text = [
          r.nom,
          r.phone,
          r.commune,
          r.quartier,
          r.type_bien,
          r.dernier_message,
          r.note,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [rows, filterStatus, filterType, filterCommune, filterAssigned, search])

  // Sync URL with selectedId
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (selectedId) {
      url.searchParams.set('id', selectedId)
    } else {
      url.searchParams.delete('id')
    }
    window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''))
  }, [selectedId])

  // Load detail when selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }

    let isMounted = true
    setIsLoadingDetail(true)

    fetch(`/api/admin/prospects/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Impossible de charger')
        return res.json()
      })
      .then((data: DetailData) => {
        if (isMounted) {
          setDetail(data)
          setIsLoadingDetail(false)
          setRows((prev) => {
            if (prev.some((r) => r.id === data.prospect.id)) return prev
            return [data.prospect, ...prev]
          })
        }
      })
      .catch((err) => {
        console.error('Erreur chargement prospect:', err)
        if (isMounted) setIsLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedId])

  // Patch helper for instant mutations
  const updateProspect = async (
    operation: string,
    values: Record<string, unknown>,
  ) => {
    if (!selectedId || !detail) return
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/prospects/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          values,
          version: detail.prospect.version,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de mise à jour')

      const updatedVersion = data.version ?? detail.prospect.version + 1

      // Update in memory
      startTransition(() => {
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== selectedId) return r
            return {
              ...r,
              ...values,
              version: updatedVersion,
            }
          }),
        )

        setDetail((prev) => {
          if (!prev) return null
          return {
            ...prev,
            prospect: {
              ...prev.prospect,
              ...values,
              version: updatedVersion,
            },
          }
        })
      })

      setFeedback('Enregistré ✓')
      setTimeout(() => setFeedback(null), 2500)
    } catch (err) {
      console.error('Erreur mutation:', err)
      setFeedback('Erreur lors de l’enregistrement')
      setTimeout(() => setFeedback(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle WhatsApp action
  const handleOpenWhatsApp = async (phone: string, currentStatus: string) => {
    const url = whatsappLink(phone)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')

    if (currentStatus === 'nouveau' && selectedId && detail) {
      try {
        await markProspectContactedAction(selectedId, detail.prospect.version)
        setRows((prev) =>
          prev.map((r) => (r.id === selectedId ? { ...r, statut: 'contacte' } : r)),
        )
        setDetail((prev) =>
          prev ? { ...prev, prospect: { ...prev.prospect, statut: 'contacte' } } : null,
        )
      } catch (err) {
        console.error(err)
      }
    }
  }

  const selectedProspect = detail?.prospect || rows.find((r) => r.id === selectedId) || null
  const hasActiveFilters = Boolean(search || filterStatus || filterType || filterCommune || filterAssigned)

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[var(--surface-hover)]">
      {/* 1. Header Toolbar (Navigation + Outils) */}
      <header className="px-4 py-2.5 bg-[var(--surface-card)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-semibold text-[var(--text)] tracking-tight">Prospects CRM</h1>
            <span className="text-xs text-[var(--text-subtle)] font-mono">({filteredRows.length}/{totalCount})</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)] text-xs">
            <span className="px-2.5 py-1 rounded-md font-semibold bg-[var(--surface-card)] text-[var(--text)] shadow-xs">
              Pipeline & Leads
            </span>
            <Link
              href="/admin/prospects/qualite"
              className="px-2.5 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Qualité
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="px-2.5 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Doublons
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-[var(--surface-hover)] p-0.5 rounded-lg border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tableau</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pipeline</span>
            </button>
          </div>

          <a
            href="/api/admin/fiche-visite"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 transition-colors"
            title="Bon de visite vierge au format PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Fiche vierge</span>
          </a>

          <a
            href="/api/admin/prospects/export"
            download="prospects.csv"
            className="h-8 px-2.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 transition-colors"
            title="Exporter la liste au format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">CSV</span>
          </a>
        </div>
      </header>

      {/* 2. Filter Bar (Filter tabs + Search + Controls) */}
      <div className="px-4 py-2 bg-[var(--surface-card)]/80 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: '', label: 'Tous', count: totalCount },
            { key: 'nouveau', label: 'À contacter', count: statusCounts.nouveau ?? 0, dot: 'bg-amber-400' },
            { key: 'contacte', label: 'En cours', count: statusCounts.contacte ?? 0, dot: 'bg-sky-400' },
            { key: 'visite_planifiee', label: 'Visites', count: statusCounts.visite ?? 0, dot: 'bg-purple-400' },
            { key: 'relance', label: 'Relances', count: statusCounts.relance ?? 0, dot: 'bg-orange-400' },
            { key: 'gagne', label: 'Conclus', count: statusCounts.gagne ?? 0, dot: 'bg-emerald-400' },
          ].map((tab) => {
            const active = filterStatus === tab.key
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] shadow-xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">({tab.count})</span>
              </button>
            )
          })}
        </div>

        {/* Inputs row */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1 max-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, +225..."
              className="w-full pl-8 pr-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-md text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)] placeholder:text-[var(--text-subtle)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Profil"
            className="h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text)]"
          >
            <option value="">Tous profils</option>
            <option value="client">Clients</option>
            <option value="agent">Démarcheurs</option>
          </select>

          <select
            value={filterCommune}
            onChange={(e) => setFilterCommune(e.target.value)}
            aria-label="Commune"
            className="h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text)] hidden md:block"
          >
            <option value="">Commune</option>
            {communes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setFilterStatus('')
                setFilterType('')
                setFilterCommune('')
                setFilterAssigned('')
              }}
              className="text-xs text-[var(--text-subtle)] hover:text-rose-400 font-medium flex items-center gap-1"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Body: Split-Screen Master-Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Master List / Table */}
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
            selectedId ? 'w-full lg:w-[58%]' : 'w-full'
          }`}
        >
          {viewMode === 'table' ? (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[var(--surface-card)] z-10 border-b border-[var(--border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] select-none">
                  <tr>
                    <th className="py-2.5 px-4">Lead / Contact</th>
                    <th className="py-2.5 px-3">Projet & Budget</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Activité</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50 text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[var(--text-subtle)] italic">
                        Aucun prospect ne correspond aux critères.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r) => {
                      const isSelected = r.id === selectedId
                      const config = STATUT_CONFIG[r.statut] || STATUT_CONFIG.nouveau
                      const isAgent = r.source_detail === 'agent'

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-[var(--surface-hover)] border-l-2 border-l-[var(--accent-luxury)]'
                              : 'hover:bg-[var(--surface-card)]/60'
                          }`}
                        >
                          <td className="py-3 px-4 min-w-[160px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors">
                                {r.nom || 'Prospect sans nom'}
                              </span>
                              {isAgent && (
                                <span className="px-1 py-0.2 rounded text-[10px] bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-subtle)]">
                                  Agent
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[11px] text-[var(--text-subtle)] mt-0.5">
                              +225 {r.phone.replace(/^225/, '')}
                            </p>
                          </td>

                          <td className="py-3 px-3 min-w-[180px]">
                            <p className="text-[var(--text)] truncate max-w-[200px]">
                              {[r.type_bien, r.commune].filter(Boolean).join(' · ') || 'Non spécifié'}
                            </p>
                            <p className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                              {r.budget != null ? formatFCFA(r.budget) : 'Budget libre'}
                            </p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text)]">
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                              <span>{config.label}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 text-[11px] text-[var(--text-subtle)] whitespace-nowrap hidden sm:table-cell">
                            <div>{relativeTime(r.last_seen)}</div>
                            {r.assigned_to && (
                              <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[100px]">
                                {nameById[r.assigned_to] || 'Assigné'}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(r.phone, r.statut)}
                                className="h-7 w-7 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-colors"
                                title="Contacter sur WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={`/api/admin/prospects/${r.id}/fiche-visite?typeContact=${isAgent ? 'agent' : 'prospect'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 w-7 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-subtle)] hover:text-[var(--text)] flex items-center justify-center transition-colors border border-[var(--border)]"
                                title="Bon de visite (PDF)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Kanban mode */
            <div className="flex-1 overflow-x-auto p-3 flex gap-3 items-start">
              {['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne'].map((col) => {
                const config = STATUT_CONFIG[col]
                const items = filteredRows.filter((r) => r.statut === col)

                return (
                  <div
                    key={col}
                    className="w-[260px] shrink-0 bg-[var(--surface-card)] rounded-xl border border-[var(--border)] flex flex-col max-h-full"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span>{config.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-subtle)]">{items.length}</span>
                    </div>

                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                      {items.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            r.id === selectedId
                              ? 'bg-[var(--surface-hover)] border-[var(--accent-luxury)]'
                              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-subtle)]'
                          }`}
                        >
                          <p className="font-semibold text-[var(--text)] truncate">{r.nom || 'Sans nom'}</p>
                          <p className="text-[11px] text-[var(--text-subtle)] font-mono mt-0.5">+225 {r.phone.replace(/^225/, '')}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
                            {[r.type_bien, r.commune].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Detail Inspector / Slide-over Drawer */}
        {selectedId ? (
          <aside className="w-full lg:w-[42%] bg-[var(--surface-card)] border-l border-[var(--border)] flex flex-col h-full shadow-lg z-20 overflow-hidden">
            {/* Inspector Top Bar */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[var(--text)] truncate">
                    {selectedProspect?.nom || 'Dossier prospect'}
                  </h2>
                  {selectedProspect?.source_detail === 'agent' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                      Démarcheur
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                      Client
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-subtle)] font-mono mt-0.5">
                  +225 {selectedProspect?.phone ? selectedProspect.phone.replace(/^225/, '') : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {feedback && (
                  <span className="text-xs font-semibold text-emerald-400 mr-1 animate-fade-in">
                    {feedback}
                  </span>
                )}

                {selectedProspect?.phone && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(selectedProspect.phone, selectedProspect.statut)}
                    className="h-8 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Ouvrir WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}

                <a
                  href={`/api/admin/prospects/${selectedId}/fiche-visite?typeContact=${selectedProspect?.source_detail === 'agent' ? 'agent' : 'prospect'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 text-xs transition-colors"
                  title="Télécharger Bon de visite (PDF)"
                >
                  <FileText className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="h-8 w-8 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-subtle)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
                  title="Fermer le panneau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Interactif de Changement de Statut (1-clic direct) */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]/50 shrink-0">
              <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                {PIPELINE_FLOW.map((s, idx) => {
                  const isCurrent = selectedProspect?.statut === s
                  const currentIdx = PIPELINE_FLOW.indexOf(selectedProspect?.statut || 'nouveau')
                  const isPast = currentIdx >= 0 && idx < currentIdx

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isSaving}
                      onClick={() => updateProspect('status', { statut: s })}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors shrink-0 ${
                        isCurrent
                          ? 'bg-[var(--text)] text-[var(--background)] font-semibold shadow-xs'
                          : isPast
                            ? 'text-emerald-400 hover:bg-[var(--surface-hover)] font-medium'
                            : 'text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className="text-[10px] font-mono">{isPast ? '✓' : idx + 1}</span>
                      <span>{STATUT_CONFIG[s]?.label || s}</span>
                    </button>
                  )
                })}

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => updateProspect('status', { statut: 'perdu' })}
                  className={`px-2 py-1 rounded text-xs transition-colors shrink-0 ${
                    selectedProspect?.statut === 'perdu'
                      ? 'bg-rose-500 text-white font-semibold'
                      : 'text-[var(--text-subtle)] hover:text-rose-400'
                  }`}
                  title="Classer comme sans suite"
                >
                  Perdu
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center border-b border-[var(--border)] px-4 bg-[var(--surface-card)] shrink-0">
              {[
                { key: 'projet', label: 'Projet & Suivi' },
                { key: 'chat', label: `WhatsApp (${detail?.messages.length ?? selectedProspect?.message_count ?? 0})` },
                { key: 'visites', label: `Visites (${detail?.visites.length ?? 0})` },
                { key: 'historique', label: 'Timeline' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as typeof activeTab)}
                  className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === t.key
                      ? 'border-[var(--accent-luxury)] text-[var(--accent-luxury)] font-semibold'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingDetail && !detail ? (
                <div className="py-12 text-center text-xs text-[var(--text-subtle)] animate-pulse">
                  Chargement du dossier...
                </div>
              ) : activeTab === 'projet' ? (
                /* Tab 1: Projet & Suivi */
                <div className="space-y-4 text-xs">
                  {/* Critères immo */}
                  <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-2">
                    <p className="font-semibold text-[var(--text)]">Critères de recherche</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[var(--text-subtle)] block">Type de bien</span>
                        <span className="font-medium text-[var(--text)] mt-0.5 block">{selectedProspect?.type_bien || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-subtle)] block">Budget souhaité</span>
                        <span className="font-semibold text-[var(--accent-luxury)] mt-0.5 block">
                          {selectedProspect?.budget != null ? formatFCFA(selectedProspect.budget) : 'Non précisé'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-subtle)] block">Zone / Communes</span>
                        <span className="font-medium text-[var(--text)] mt-0.5 block">
                          {[selectedProspect?.commune, selectedProspect?.quartier].filter(Boolean).join(' · ') || 'Toutes zones'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-subtle)] block">Date d’emménagement</span>
                        <span className="font-medium text-[var(--text)] mt-0.5 block">{selectedProspect?.date_souhaitee || 'Dès que possible'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gestion Conseiller & Relance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Conseiller */}
                    <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text)] block">Conseiller en charge</label>
                      <select
                        value={selectedProspect?.assigned_to ?? ''}
                        disabled={isSaving}
                        onChange={(e) => updateProspect('assign', { assigned_to: e.target.value || null })}
                        className="w-full h-8 px-2 bg-[var(--surface-card)] border border-[var(--border)] rounded text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                      >
                        <option value="">Non assigné</option>
                        {assignees.map((a) => (
                          <option key={a.id} value={a.id}>{a.full_name || a.id.slice(0, 8)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Relance */}
                    <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text)] block">Planifier une relance</label>
                      <input
                        type="date"
                        value={selectedProspect?.relance_le ?? ''}
                        disabled={isSaving}
                        onChange={(e) => updateProspect('reminder', { relance_le: e.target.value || null })}
                        className="w-full h-8 px-2 bg-[var(--surface-card)] border border-[var(--border)] rounded text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent-luxury)]"
                      />
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-subtle)] pt-0.5">
                        <span>Raccourcis :</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
                            updateProspect('reminder', { relance_le: d })
                          }}
                          className="hover:text-[var(--text)] underline"
                        >
                          Demain
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
                            updateProspect('reminder', { relance_le: d })
                          }}
                          className="hover:text-[var(--text)] underline"
                        >
                          +3j
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
                            updateProspect('reminder', { relance_le: d })
                          }}
                          className="hover:text-[var(--text)] underline"
                        >
                          +7j
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Note de suivi */}
                  <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] space-y-2">
                    <label className="text-[11px] font-semibold text-[var(--text)] block">Note interne commerciale</label>
                    <textarea
                      rows={3}
                      defaultValue={selectedProspect?.note ?? ''}
                      placeholder="Commentaires, objections, attentes..."
                      onBlur={(e) => {
                        if (e.target.value !== (selectedProspect?.note ?? '')) {
                          updateProspect('note', { note: e.target.value })
                        }
                      }}
                      className="w-full p-2 bg-[var(--surface-card)] border border-[var(--border)] rounded text-xs text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent-luxury)] leading-relaxed"
                    />
                    <p className="text-[10px] text-[var(--text-subtle)]">La note est sauvegardée dès que vous quittez le champ.</p>
                  </div>

                  {/* Bascule qualification client / démarcheur */}
                  <div className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text)]">Qualification du profil</p>
                      <p className="text-[11px] text-[var(--text-subtle)]">
                        Actuellement : <strong>{selectedProspect?.source_detail === 'agent' ? 'Démarcheur' : 'Client direct'}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        updateProspect('type_contact', {
                          type_contact: selectedProspect?.source_detail === 'agent' ? 'prospect' : 'agent',
                        })
                      }
                      className="h-7 px-3 rounded text-xs font-medium border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors"
                    >
                      Basculer en {selectedProspect?.source_detail === 'agent' ? 'Client' : 'Démarcheur'}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'chat' ? (
                /* Tab 2: WhatsApp Messages */
                <div className="space-y-2.5">
                  {!detail?.messages.length ? (
                    <p className="text-xs text-[var(--text-subtle)] italic text-center py-8">Aucun message archivé.</p>
                  ) : (
                    detail.messages.map((m, idx) => {
                      const inbound = m.direction === 'inbound'
                      const commercial = !inbound && (m.metadata?.actor_type === 'commercial' || m.metadata?.trace_source === 'human_takeover')

                      return (
                        <div key={idx} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                              inbound
                                ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                                : commercial
                                  ? 'bg-[var(--surface-hover)] border border-[var(--accent-luxury)]/40 text-[var(--text)]'
                                  : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className="text-[10px] text-[var(--text-subtle)] mt-1">
                              {inbound ? 'Prospect' : commercial ? 'Commercial' : 'Sapphire IA'} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : activeTab === 'visites' ? (
                /* Tab 3: Visites confirmées & Catalogue */
                <div className="space-y-4 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text)] mb-2">Visites programmées</p>
                    {!detail?.visites.length ? (
                      <p className="text-xs text-[var(--text-subtle)] italic py-2">Aucune visite confirmée.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.visites.map((v) => (
                          <div key={v.id} className="p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">{v.biens?.titre || 'Bien'}</p>
                              <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                                📅 {v.date_souhaitee} {v.heure_debut ? `à ${v.heure_debut}` : ''}
                              </p>
                            </div>
                            <a
                              href={`/api/admin/prospects/${selectedId}/fiche-visite?bienId=${v.biens?.id}&typeContact=${selectedProspect?.source_detail === 'agent' ? 'agent' : 'prospect'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-7 px-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[11px] font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Bon visite</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Biens correspondants */}
                  {detail?.matchingBiens && detail.matchingBiens.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="font-semibold text-[var(--text)] mb-2">Suggestions du catalogue</p>
                      <div className="space-y-2">
                        {detail.matchingBiens.map((b) => (
                          <div key={b.id} className="p-2.5 bg-[var(--surface)] rounded-lg border border-[var(--border)] flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--text)] truncate">{b.titre}</p>
                              <p className="text-[11px] text-[var(--text-subtle)]">{b.commune} · {b.prix_label}</p>
                            </div>
                            <a
                              href={`/api/admin/prospects/${selectedId}/fiche-visite?${b.source === 'flash' ? `localId=${b.sourceId}` : `bienId=${b.sourceId}`}&typeContact=${selectedProspect?.source_detail === 'agent' ? 'agent' : 'prospect'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-6 px-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[10px] font-medium flex items-center gap-1"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span>Bon</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 4: Historique des actions */
                <div className="space-y-3 text-xs">
                  {!detail?.crmEvents.length ? (
                    <p className="text-xs text-[var(--text-subtle)] italic py-4">Aucun événement enregistré.</p>
                  ) : (
                    <ol className="space-y-3 border-l border-[var(--border)] ml-1 pl-3">
                      {detail.crmEvents.map((e) => (
                        <li key={e.id} className="relative space-y-0.5">
                          <span className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)]" />
                          <p className="font-medium text-[var(--text)]">
                            {e.event_type === 'human_reply'
                              ? 'Réponse commerciale'
                              : e.to_status
                                ? `Statut passé à : ${STATUT_CONFIG[e.to_status]?.label || e.to_status}`
                                : e.event_type}
                          </p>
                          {e.note && <p className="text-[11px] text-[var(--text-muted)]">{e.note}</p>}
                          <p className="text-[10px] text-[var(--text-subtle)]">
                            {e.actor_name || 'Système'} · {new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
