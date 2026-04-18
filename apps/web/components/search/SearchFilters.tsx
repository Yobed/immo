'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { CommuneAutocomplete } from './CommuneAutocomplete'
import {
  TYPES_BIEN,
  TYPES_BIEN_LABELS,
  EQUIPEMENTS_DISPONIBLES,
  EQUIPEMENTS_LABELS,
} from '@immo-ci/shared/constants/biens'
import { cn } from '@/lib/utils'

/* ── Icônes SVG inline ── */
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconType = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconBudget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
)
const IconEquip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
)
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 250ms ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

/* ── Section accordéon ── */
function FilterSection({
  icon, label, badge, children, defaultOpen = true,
}: {
  icon: React.ReactNode
  label: string
  badge?: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface)] transition-colors duration-150 group"
      >
        <div className="flex items-center gap-2.5 text-[var(--primary)]">
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
          <span className="font-sans text-sm font-semibold text-[var(--text)] tracking-tight">{label}</span>
          {badge != null && badge > 0 && (
            <span className="bg-[var(--primary)] text-white text-[10px] font-bold rounded-pill px-1.5 py-0.5 leading-none min-w-[18px] text-center">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[var(--text-muted)]"><IconChevron open={open} /></span>
      </button>
      {open && (
        <div className="px-5 pb-4">{children}</div>
      )}
    </div>
  )
}

/* ── Type de bien — config ── */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  villa: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  appartement: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="1"/><path d="M2 9h20M2 15h20M9 3v18M15 3v18"/>
    </svg>
  ),
  studio: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M3 7h18M3 12h18M5 17h14"/><rect x="2" y="3" width="20" height="18" rx="1"/>
    </svg>
  ),
  maison: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M1 11l11-9 11 9"/><path d="M4 10v10a1 1 0 001 1h4v-6h6v6h4a1 1 0 001-1V10"/>
    </svg>
  ),
  residence_meublee: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z"/>
      <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/>
    </svg>
  ),
  bureau: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  commerce: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M2 7l2-4h16l2 4"/><rect x="2" y="7" width="20" height="14" rx="1"/>
      <path d="M8 21V11h8v10"/>
    </svg>
  ),
  terrain: (
    <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
      <path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>
    </svg>
  ),
}

export function SearchFilters({ onApply }: { onApply?: () => void } = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [commune, setCommune] = useState(searchParams.get('commune') ?? '')
  const [prixMin, setPrixMin] = useState(searchParams.get('prix_min') ?? '')
  const [prixMax, setPrixMax] = useState(searchParams.get('prix_max') ?? '')
  const [typeBien, setTypeBien] = useState(searchParams.get('type_bien') ?? '')
  const [equipements, setEquipements] = useState<string[]>(
    searchParams.get('equipements')?.split(',').filter(Boolean) ?? []
  )

  const toggleEquipement = (eq: string) =>
    setEquipements(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq])

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '0')
    if (commune) params.set('commune', commune); else params.delete('commune')
    if (prixMin) params.set('prix_min', prixMin); else params.delete('prix_min')
    if (prixMax) params.set('prix_max', prixMax); else params.delete('prix_max')
    if (typeBien) params.set('type_bien', typeBien); else params.delete('type_bien')
    if (equipements.length) params.set('equipements', equipements.join(',')); else params.delete('equipements')
    router.push(`${pathname}?${params.toString()}`)
    onApply?.()
  }, [commune, prixMin, prixMax, typeBien, equipements, pathname, searchParams, router, onApply])

  const clearFilters = () => {
    setCommune(''); setPrixMin(''); setPrixMax(''); setTypeBien(''); setEquipements([])
    const q = searchParams.get('q')
    router.push(`${pathname}${q ? `?q=${q}` : ''}`)
  }

  const hasActiveFilters = !!(commune || prixMin || prixMax || typeBien || equipements.length)
  const locBadge = commune ? 1 : 0
  const budgetBadge = prixMin || prixMax ? 1 : 0
  const typeBadge = typeBien ? 1 : 0
  const equipBadge = equipements.length

  return (
    <div className="bg-[var(--midnight-muted)] rounded-[18px] border border-[var(--border)] overflow-hidden"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"
            className="text-[var(--primary)]">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span className="font-sans font-semibold text-sm text-[var(--text)]">Filtres</span>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[var(--danger)] hover:text-[var(--danger)]/80 font-sans font-medium transition-colors duration-150">
            <IconClose />
            Effacer tout
          </button>
        )}
      </div>

      {/* ── Sections accordéon ── */}

      {/* Localisation */}
      <FilterSection icon={<IconLocation />} label="Localisation" badge={locBadge}>
        <CommuneAutocomplete
          value={commune}
          onChange={setCommune}
          placeholder="Commune ou quartier..."
        />
      </FilterSection>

      {/* Type de bien */}
      <FilterSection icon={<IconType />} label="Type de bien" badge={typeBadge}>
        <div className="space-y-0.5">
          {/* Tous */}
          <button type="button" onClick={() => setTypeBien('')}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-sans transition-all duration-150',
              !typeBien
                ? 'bg-[var(--accent-luxury)] text-white font-medium shadow-lg shadow-[var(--accent-luxury)]/20'
                : 'text-[var(--text-muted)] hover:bg-[var(--midnight-light)] hover:text-[var(--off-white)]'
            )}>
            <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Tous les types
          </button>
          {TYPES_BIEN.map(t => (
            <button key={t} type="button"
              onClick={() => setTypeBien(t === typeBien ? '' : t)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-sans transition-all duration-150',
                typeBien === t
                  ? 'bg-[var(--primary)] text-white font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
              )}>
              <span className={typeBien === t ? 'text-white/80' : 'text-[var(--primary)]/50'}>
                {TYPE_ICONS[t]}
              </span>
              {TYPES_BIEN_LABELS[t]}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Budget */}
      <FilterSection icon={<IconBudget />} label="Budget (FCFA/mois)" badge={budgetBadge}>
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs text-[var(--text-muted)] font-sans mb-1">Minimum</label>
            <input
              type="number"
              value={prixMin}
              onChange={e => setPrixMin(e.target.value)}
              placeholder="ex : 100 000"
              className="w-full px-3 py-2 text-sm font-sans border border-[var(--border)] rounded-btn bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-subtle)] font-sans">à</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] font-sans mb-1">Maximum</label>
            <input
              type="number"
              value={prixMax}
              onChange={e => setPrixMax(e.target.value)}
              placeholder="ex : 500 000"
              className="w-full px-3 py-2 text-sm font-sans border border-[var(--border)] rounded-btn bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
            />
          </div>
        </div>
      </FilterSection>

      {/* Équipements */}
      <FilterSection icon={<IconEquip />} label="Équipements" badge={equipBadge} defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPEMENTS_DISPONIBLES.map(eq => (
              <button key={eq} type="button" onClick={() => toggleEquipement(eq)}
                className={cn(
                  'px-3 py-1.5 rounded-pill text-xs font-sans border transition-all duration-150 select-none',
                  equipements.includes(eq)
                    ? 'bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-white font-medium shadow-lg shadow-[var(--accent-luxury)]/20'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-luxury)]/50 hover:text-[var(--off-white)] bg-[var(--midnight-light)]'
                )}>
                {EQUIPEMENTS_LABELS[eq]}
              </button>
            ))}
          </div>
        </FilterSection>
  
        {/* ── Bouton appliquer ── */}
        <div className="px-5 py-4 bg-[var(--midnight-muted)] border-t border-[var(--border)]">
          <button
            onClick={applyFilters}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent-luxury)] text-white text-sm font-sans font-semibold rounded-btn hover:opacity-90 transition-all shadow-xl shadow-[var(--accent-luxury)]/20 active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Appliquer les filtres
          </button>
        </div>
      </div>
    )
  }
