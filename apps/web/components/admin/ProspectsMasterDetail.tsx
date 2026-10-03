'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Search, X, MessageCircle, FileText, Download, RotateCcw,
  ExternalLink, Clock, ChevronRight, ChevronDown, Check,
} from 'lucide-react'
import { formatFCFA } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'

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

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  nouveau: {
    label: 'Nouveau',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
  },
  contacte: {
    label: 'Contacté',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200/80',
  },
  visite_planifiee: {
    label: 'Visite',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200/80',
  },
  visite_realisee: {
    label: 'Visite faite',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200/80',
  },
  relance: {
    label: 'Relance',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200/80',
  },
  gagne: {
    label: 'Conclu',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200/80',
  },
  perdu: {
    label: 'Perdu',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  traite: {
    label: 'Traité',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
}

const PIPELINE_FLOW = ['nouveau', 'contacte', 'visite_planifiee', 'relance', 'gagne']

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 2) return "À l'instant"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  return `${d} j`
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
  const [activeTab, setActiveTab] = useState<'dossier' | 'chat' | 'visites' | 'historique'>('dossier')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCommune, setFilterCommune] = useState<string>('')
  const [filterAssigned, setFilterAssigned] = useState<string>('')

  // Quick inline status change popover
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null)

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

  // ESC key to close drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    targetId: string,
    operation: string,
    values: Record<string, unknown>,
  ) => {
    const currentProspect = detail?.prospect?.id === targetId ? detail.prospect : rows.find((r) => r.id === targetId)
    const currentVersion = currentProspect?.version ?? 1

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch(`/api/admin/prospects/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          values,
          version: currentVersion,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de mise à jour')

      const updatedVersion = data.version ?? currentVersion + 1

      // Update rows in memory
      startTransition(() => {
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== targetId) return r
            return {
              ...r,
              ...values,
              version: updatedVersion,
            }
          }),
        )

        // Update detail if opened
        if (detail && detail.prospect.id === targetId) {
          setDetail((prev) =>
            prev
              ? {
                  ...prev,
                  prospect: {
                    ...prev.prospect,
                    ...values,
                    version: updatedVersion,
                  },
                }
              : null,
          )
        }
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error('Erreur mise à jour:', err)
      alert(err instanceof Error ? err.message : 'Erreur de mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenWhatsApp = async (phone: string, currentStatut: string, prospectId?: string) => {
    const text = 'Bonjour, je vous contacte depuis BOGBE’S GROUPE concernant votre recherche immobilière.'
    const link = whatsappLink(phone, text)
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }

    if (currentStatut === 'nouveau' && prospectId) {
      updateProspect(prospectId, 'status', { status: 'contacte' })
    }
  }

  const selectedProspect = detail?.prospect || rows.find((r) => r.id === selectedId) || null
  const hasActiveFilters = Boolean(search || filterStatus || filterType || filterCommune || filterAssigned)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5 min-h-[calc(100vh-56px)]">
      
      {/* 1. Header Toolbar unique et épuré (Style Notion / Stripe) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Prospects</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {filteredRows.length} {filteredRows.length === 1 ? 'lead' : 'leads'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez votre pipeline commercial, qualifiez vos acheteurs et locataires, et déclenchez vos relances WhatsApp.
          </p>
        </div>

        {/* Liens sous-modules & Actions rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs font-medium">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-semibold">
              Pipeline
            </span>
            <Link
              href="/admin/prospects/qualite"
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-900 transition-colors"
            >
              Qualité
            </Link>
            <Link
              href="/admin/prospects/doublons"
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-900 transition-colors"
            >
              Doublons
            </Link>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          <a
            href="/api/admin/fiche-visite"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
            title="Bon de visite vierge au format PDF"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Bon de visite vierge</span>
          </a>

          <a
            href="/api/admin/prospects/export"
            download="prospects.csv"
            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
            title="Exporter la liste au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Filtres & Recherche (Une seule ligne bien ordonnée) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Onglets de Statut (Segmented Control style Notion) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: '', label: 'Tous', count: totalCount },
            { key: 'nouveau', label: 'À contacter', count: statusCounts.nouveau ?? 0 },
            { key: 'contacte', label: 'En cours', count: statusCounts.contacte ?? 0 },
            { key: 'visite_planifiee', label: 'Visites', count: statusCounts.visite ?? 0 },
            { key: 'relance', label: 'Relances', count: statusCounts.relance ?? 0 },
            { key: 'gagne', label: 'Conclus', count: statusCounts.gagne ?? 0 },
          ].map((tab) => {
            const active = filterStatus === tab.key
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Recherche et sélecteurs */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1 max-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, +225..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 placeholder:text-slate-400 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Profil"
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="">Tous profils</option>
            <option value="client">Clients directs</option>
            <option value="agent">Démarcheurs</option>
          </select>

          <select
            value={filterCommune}
            onChange={(e) => setFilterCommune(e.target.value)}
            aria-label="Commune"
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:bg-white hidden md:block"
          >
            <option value="">Toutes communes</option>
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
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Grand Tableau Pleine Largeur Aéré */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Prospect / Contact</th>
                <th className="py-3 px-4">Projet recherché</th>
                <th className="py-3 px-4">Statut Pipeline</th>
                <th className="py-3 px-4 hidden md:table-cell">Activité &amp; Assignation</th>
                <th className="py-3 px-4 text-right sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <p className="font-medium text-slate-600">Aucun prospect trouvé</p>
                    <p className="text-xs mt-1">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => {
                  const isSelected = r.id === selectedId
                  const config = STATUT_CONFIG[r.statut] || STATUT_CONFIG.nouveau
                  const isAgent = r.source_detail === 'agent'
                  const isStatusOpen = openStatusMenuId === r.id

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-blue-50/40'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Colonne 1 : Prospect & Numéro */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {r.nom || 'Prospect sans nom'}
                          </span>
                          {isAgent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Démarcheur
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 font-mono text-[11px]">
                          <span>+225 {r.phone.replace(/^225/, '')}</span>
                        </div>
                      </td>

                      {/* Colonne 2 : Projet & Budget */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {[r.type_bien, r.commune, r.quartier].filter(Boolean).join(' · ') || 'Projet non précisé'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {r.budget != null ? (
                            <span className="font-semibold text-slate-700">{formatFCFA(r.budget)}</span>
                          ) : (
                            <span className="text-slate-400">Budget libre</span>
                          )}
                        </div>
                      </td>

                      {/* Colonne 3 : Statut Pipeline (Modifiable directement au clic !) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenStatusMenuId(isStatusOpen ? null : r.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${config.bg} ${config.text} ${config.border} hover:opacity-90`}
                            title="Changer de statut"
                          >
                            <span>{config.label}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          {/* Petit menu déroulant rapide de changement de statut */}
                          {isStatusOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setOpenStatusMenuId(null)}
                              />
                              <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in duration-100">
                                {Object.entries(STATUT_CONFIG).map(([st, cfg]) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      updateProspect(r.id, 'status', { status: st })
                                      setOpenStatusMenuId(null)
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                      r.statut === st ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${cfg.bg} border ${cfg.border}`} />
                                      <span>{cfg.label}</span>
                                    </span>
                                    {r.statut === st && <Check className="w-3 h-3 text-blue-600" />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Colonne 4 : Activité & Assignation */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-500">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{relativeTime(r.last_seen)}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium truncate max-w-[130px]">
                          {r.assigned_to ? nameById[r.assigned_to] || 'Assigné' : 'Non assigné'}
                        </div>
                      </td>

                      {/* Colonne 5 : Actions d'un clic */}
                      <td className="py-3.5 px-4 sm:pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Bouton WhatsApp direct */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(r.phone, r.statut, r.id)}
                            className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 flex items-center gap-1 text-xs font-semibold transition-colors"
                            title="Contacter sur WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">WhatsApp</span>
                          </button>

                          {/* Bon de visite PDF */}
                          <a
                            href={`/api/admin/prospects/${r.id}/fiche-visite`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
                            title="Télécharger la fiche de visite"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          {/* Ouvrir la fiche complète */}
                          <button
                            type="button"
                            onClick={() => setSelectedId(r.id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <span>Dossier</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Slide-Over Drawer Élégant (Fiche complète du prospect au clic) */}
      {selectedId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop transparent estompé */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSelectedId(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
              
              {/* En-tête du tiroir */}
              <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {selectedProspect?.nom || 'Prospect sans nom'}
                    </h2>
                    {selectedProspect?.source_detail === 'agent' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Démarcheur
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-700">
                      +225 {selectedProspect?.phone.replace(/^225/, '')}
                    </span>
                    <span>·</span>
                    <span>Actif {selectedProspect ? relativeTime(selectedProspect.last_seen) : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedProspect && (
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(selectedProspect.phone, selectedProspect.statut, selectedProspect.id)}
                      className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Fermer (Échap)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Barre de Progression du Pipeline (1 clic pour avancer) */}
              {selectedProspect && (
                <div className="px-5 py-3 border-b border-slate-200 bg-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Progression Pipeline
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PIPELINE_FLOW.map((stepKey, idx) => {
                      const currentIdx = PIPELINE_FLOW.indexOf(selectedProspect.statut)
                      const isDone = currentIdx >= idx
                      const isCurrent = selectedProspect.statut === stepKey
                      const cfg = STATUT_CONFIG[stepKey] || { label: stepKey }

                      return (
                        <button
                          key={stepKey}
                          type="button"
                          onClick={() => updateProspect(selectedProspect.id, 'status', { status: stepKey })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                            isCurrent
                              ? 'bg-slate-900 text-white shadow-xs'
                              : isDone
                              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Onglets du tiroir */}
              <div className="flex items-center px-5 border-b border-slate-200 bg-white gap-6 text-xs font-medium">
                {[
                  { key: 'dossier', label: 'Dossier & Suivi' },
                  { key: 'chat', label: `WhatsApp (${detail?.messages?.length ?? '...'})` },
                  { key: 'visites', label: `Visites (${detail?.visites?.length ?? 0})` },
                  { key: 'historique', label: 'Historique' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key as typeof activeTab)}
                    className={`py-3 relative transition-colors ${
                      activeTab === t.key
                        ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Contenu de l'onglet */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {isLoadingDetail && !detail ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Chargement des détails du prospect...
                  </div>
                ) : !selectedProspect ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Prospect introuvable.
                  </div>
                ) : (
                  <>
                    {/* ONGLET 1 : DOSSIER & SUIVI */}
                    {activeTab === 'dossier' && (
                      <div className="space-y-6">
                        
                        {/* Bloc 1 : Qualification commerciale */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Qualification Commerciale
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                Conseiller assigné
                              </label>
                              <select
                                value={selectedProspect.assigned_to || ''}
                                onChange={(e) =>
                                  updateProspect(selectedProspect.id, 'assign', {
                                    assigned_to: e.target.value || null,
                                  })
                                }
                                className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                              >
                                <option value="">Non assigné</option>
                                {assignees.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.full_name || 'Agent sans nom'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                Type de profil
                              </label>
                              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProspect(selectedProspect.id, 'type_contact', {
                                      source_detail: 'direct',
                                    })
                                  }
                                  className={`flex-1 py-1 text-center rounded text-xs font-semibold transition-colors ${
                                    selectedProspect.source_detail !== 'agent'
                                      ? 'bg-slate-900 text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Client
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProspect(selectedProspect.id, 'type_contact', {
                                      source_detail: 'agent',
                                    })
                                  }
                                  className={`flex-1 py-1 text-center rounded text-xs font-semibold transition-colors ${
                                    selectedProspect.source_detail === 'agent'
                                      ? 'bg-slate-900 text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Démarcheur
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Relance */}
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                              Date de prochaine relance
                            </label>
                            <input
                              type="date"
                              value={selectedProspect.relance_le ? selectedProspect.relance_le.split('T')[0] : ''}
                              onChange={(e) =>
                                updateProspect(selectedProspect.id, 'reminder', {
                                  relance_le: e.target.value ? new Date(e.target.value).toISOString() : null,
                                })
                              }
                              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                            />
                          </div>
                        </div>

                        {/* Bloc 2 : Projet immobilier */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Critères du Projet
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 block">Type de bien</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {selectedProspect.type_bien || 'Non renseigné'}
                              </span>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 block">Localisation</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {[selectedProspect.commune, selectedProspect.quartier].filter(Boolean).join(' - ') || 'Non renseignée'}
                              </span>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 block">Budget mensuel / global</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {selectedProspect.budget != null ? formatFCFA(selectedProspect.budget) : 'Non précisé'}
                              </span>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                              <span className="text-[11px] text-slate-400 block">Date souhaitée</span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {selectedProspect.date_souhaitee || 'Dès que possible'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bloc 3 : Notes Internes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Notes Internes
                            </h3>
                            {isSaving && <span className="text-[11px] text-blue-600">Sauvegarde...</span>}
                            {saveSuccess && <span className="text-[11px] text-emerald-600">Enregistré ✓</span>}
                          </div>
                          <textarea
                            defaultValue={selectedProspect.note || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (selectedProspect.note || '')) {
                                updateProspect(selectedProspect.id, 'note', { note: e.target.value })
                              }
                            }}
                            placeholder="Saisissez des informations sur la négociation, les besoins spécifiques..."
                            rows={4}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* ONGLET 2 : WHATSAPP CHAT */}
                    {activeTab === 'chat' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            Transcription des échanges sur le numéro officiel WhatsApp.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(selectedProspect.phone, selectedProspect.statut, selectedProspect.id)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <span>Ouvrir l&apos;application</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {detail?.messages && detail.messages.length > 0 ? (
                            detail.messages.map((m, i) => {
                              const isOutbound = m.direction === 'outbound'
                              return (
                                <div
                                  key={i}
                                  className={`flex flex-col max-w-[85%] ${
                                    isOutbound ? 'ml-auto items-end' : 'mr-auto items-start'
                                  }`}
                                >
                                  <div
                                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                      isOutbound
                                        ? 'bg-slate-900 text-white rounded-br-xs'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap">{m.body}</p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic py-8 text-center">
                              Aucun message archivé pour ce numéro.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ONGLET 3 : VISITES & CATALOGUE */}
                    {activeTab === 'visites' && (
                      <div className="space-y-6">
                        {/* Visites programmées */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Visites Programmées
                            </h3>
                            <a
                              href={`/api/admin/prospects/${selectedProspect.id}/fiche-visite`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Bon de visite (PDF)</span>
                            </a>
                          </div>

                          {detail?.visites && detail.visites.length > 0 ? (
                            <div className="space-y-2">
                              {detail.visites.map((v) => (
                                <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-900">
                                      {v.biens?.titre || 'Bien immobilier'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                                      {v.statut}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 text-[11px] mt-1">
                                    Prévue le {new Date(v.date_souhaitee).toLocaleDateString('fr-FR')} {v.heure_debut ? `à ${v.heure_debut}` : ''}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                              Aucune visite enregistrée pour ce prospect.
                            </p>
                          )}
                        </div>

                        {/* Suggestions catalogue */}
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                            Biens Correspondants au Profil
                          </h3>
                          {detail?.matchingBiens && detail.matchingBiens.length > 0 ? (
                            <div className="space-y-2">
                              {detail.matchingBiens.map((b) => (
                                <div key={b.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{b.titre}</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">{b.commune} · {b.prix_label}</p>
                                  </div>
                                  <a
                                    href={b.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                              Aucun bien correspondant dans le catalogue pour ces critères.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ONGLET 4 : HISTORIQUE */}
                    {activeTab === 'historique' && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          Journal d&apos;audit de toutes les actions commerciales enregistrées.
                        </p>
                        {detail?.crmEvents && detail.crmEvents.length > 0 ? (
                          <div className="space-y-2">
                            {detail.crmEvents.map((ev) => (
                              <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                  <span>{new Date(ev.created_at).toLocaleString('fr-FR')}</span>
                                  {ev.actor_name && <span className="font-medium text-slate-700">{ev.actor_name}</span>}
                                </div>
                                <p className="font-medium text-slate-800 mt-1">
                                  {ev.event_type} {ev.to_status ? `→ ${ev.to_status}` : ''}
                                </p>
                                {ev.note && <p className="text-slate-600 mt-0.5">{ev.note}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-8 text-center">
                            Aucun événement historique consigné.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
