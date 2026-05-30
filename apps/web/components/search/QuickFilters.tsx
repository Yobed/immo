'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Sparkles, BedDouble, Building2, Palmtree, Home as HomeIcon,
  Briefcase, Store, Shovel, Warehouse, MapPin, Key, Tag, ShieldCheck, Wallet,
} from 'lucide-react'

/**
 * Filtres rapides type + offre + commune + budget — pédagogiques.
 * Reste sur la page courante (au lieu de toujours renvoyer vers /recherche).
 */

const TYPE_FILTERS = [
  { id: 'all',                label: 'Tout',          icon: Sparkles,  type: '' },
  { id: 'residence_meublee',  label: 'Meublés',       icon: BedDouble, type: 'residence_meublee' },
  { id: 'appartement',        label: 'Appartement',   icon: Building2, type: 'appartement' },
  { id: 'villa',              label: 'Villa',         icon: Palmtree,  type: 'villa' },
  { id: 'maison',             label: 'Maison',        icon: HomeIcon,  type: 'maison' },
  { id: 'studio',             label: 'Studio',        icon: Warehouse, type: 'studio' },
  { id: 'terrain',            label: 'Terrain',       icon: Shovel,    type: 'terrain' },
  { id: 'bureau',             label: 'Bureau',        icon: Briefcase, type: 'bureau' },
  { id: 'commerce',           label: 'Commerce',      icon: Store,     type: 'commerce' },
] as const

const OFFRE_FILTERS = [
  { id: 'all',      label: 'Vente + Location', icon: Tag,  offre: '' },
  { id: 'location', label: 'À louer',          icon: Key,  offre: 'location' },
  { id: 'vente',    label: 'À vendre',         icon: HomeIcon, offre: 'vente' },
] as const

/** Communes par défaut (fallback si aucune liste dynamique n'est fournie). */
const DEFAULT_COMMUNE_FILTERS = [
  { id: 'cocody',      label: 'Cocody',       commune: 'Cocody' },
  { id: 'riviera',     label: 'Riviera',      commune: 'Riviera' },
  { id: 'plateau',     label: 'Plateau',      commune: 'Plateau' },
  { id: 'marcory',     label: 'Marcory',      commune: 'Marcory' },
  { id: 'yopougon',    label: 'Yopougon',     commune: 'Yopougon' },
  { id: 'bingerville', label: 'Bingerville',  commune: 'Bingerville' },
  { id: 'songon',      label: 'Songon',       commune: 'Songon' },
  { id: 'abobo',       label: 'Abobo',        commune: 'Abobo' },
  { id: 'treichville', label: 'Treichville',  commune: 'Treichville' },
]

/** Tranches budget mensuel (location) — adapté au marché ivoirien */
const BUDGET_FILTERS = [
  { id: 'b1', label: '≤ 300k',  value: '300000' },
  { id: 'b2', label: '≤ 800k',  value: '800000' },
  { id: 'b3', label: '≤ 1.5M',  value: '1500000' },
  { id: 'b4', label: '≤ 5M',    value: '5000000' },
  { id: 'b5', label: '≤ 50M',   value: '50000000' },
] as const

const SUPPORTED_PAGES = ['/recherche', '/catalogue', '/offre-flash'] as const

interface QuickFiltersProps {
  /**
   * Communes réellement présentes dans le catalogue (vérifiés + flash),
   * fournies par la page serveur. Si absent/vide → liste par défaut.
   */
  communes?: string[]
}

export function QuickFilters({ communes }: QuickFiltersProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type_bien')
  const currentOffre = searchParams.get('type_offre')
  const currentCommune = searchParams.get('commune')
  const currentPrixMax = searchParams.get('prix_max')
  const currentSource = searchParams.get('source')

  const targetPath = SUPPORTED_PAGES.find((p) => pathname === p || pathname.startsWith(p + '/'))
    ?? '/recherche'

  const handleFilter = (filterParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('page')
    const qs = params.toString()
    router.push(`${targetPath}${qs ? `?${qs}` : ''}`)
  }

  const verifiedActive = currentSource === 'bogbes'

  // Puces commune : dynamiques (issues des biens réels) si fournies, sinon défaut.
  const communeChips =
    communes && communes.length > 0
      ? communes.map((c) => ({ id: c.toLowerCase().replace(/\s+/g, '-'), label: c, commune: c }))
      : DEFAULT_COMMUNE_FILTERS

  return (
    <div className="flex flex-col gap-3">
      {/* Ligne 1 — Types de biens */}
      <FilterRow label="Type">
        {TYPE_FILTERS.map((f) => {
          const isActive = (f.id === 'all' && !currentType) || currentType === f.type
          const Icon = f.icon
          return (
            <Chip
              key={f.id}
              active={isActive}
              icon={<Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[var(--on-accent)]' : 'text-[var(--accent-luxury)]')} />}
              onClick={() => handleFilter({ type_bien: f.type })}
              label={f.label}
            />
          )
        })}
      </FilterRow>

      {/* Ligne 2 — Type d'offre (Vente / Location) + Vérifié toggle */}
      <FilterRow label="Offre">
        {OFFRE_FILTERS.map((f) => {
          const isActive = (f.id === 'all' && !currentOffre) || currentOffre === f.offre
          const Icon = f.icon
          return (
            <Chip
              key={f.id}
              active={isActive}
              icon={<Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[var(--on-accent)]' : 'text-blue-500')} />}
              onClick={() => handleFilter({ type_offre: f.offre })}
              label={f.label}
            />
          )
        })}
        {/* Séparateur visuel */}
        <div className="w-px h-6 bg-[var(--border)] self-center shrink-0" />
        <Chip
          active={verifiedActive}
          icon={<ShieldCheck className={cn('w-3.5 h-3.5', verifiedActive ? 'text-white' : 'text-blue-600')} />}
          onClick={() => handleFilter({ source: verifiedActive ? '' : 'bogbes' })}
          label="Vérifié uniquement"
          variant="verified"
        />
      </FilterRow>

      {/* Ligne 3 — Budget tranches */}
      <FilterRow label="Budget">
        <Chip
          active={!currentPrixMax}
          icon={<Wallet className={cn('w-3.5 h-3.5', !currentPrixMax ? 'text-[var(--on-accent)]' : 'text-emerald-500')} />}
          onClick={() => handleFilter({ prix_max: '' })}
          label="Tout budget"
        />
        {BUDGET_FILTERS.map((b) => {
          const isActive = currentPrixMax === b.value
          return (
            <Chip
              key={b.id}
              active={isActive}
              onClick={() => handleFilter({ prix_max: isActive ? '' : b.value })}
              label={b.label}
            />
          )
        })}
      </FilterRow>

      {/* Ligne 4 — Communes */}
      <FilterRow label="Commune">
        <div className="flex items-center px-2.5 py-2 bg-white/5 rounded-lg border border-white/10 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
        </div>
        {communeChips.map((f) => {
          const isActive = currentCommune?.toLowerCase() === f.commune.toLowerCase()
          return (
            <Chip
              key={f.id}
              active={isActive}
              onClick={() => handleFilter({ commune: isActive ? '' : f.commune })}
              label={f.label}
              variant="muted"
            />
          )
        })}
      </FilterRow>
    </div>
  )
}

/** Ligne de filtres scrollable horizontalement avec label (caché sur mobile pour gagner de la verticale) */
function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] shrink-0 hidden lg:inline-block w-16">
        {label}
      </span>
      {children}
    </div>
  )
}

interface ChipProps {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'muted' | 'verified'
}

function Chip({ active, onClick, label, icon, variant = 'default' }: ChipProps) {
  const activeBase = 'bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-[var(--on-accent)] shadow-sm'
  const inactiveByVariant = {
    default: 'bg-surface-raised/50 border-[var(--border)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text)]',
    muted: 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text)]',
    verified: 'bg-blue-500/10 border-blue-500/30 text-blue-700 hover:bg-blue-500/20',
  }
  const activeByVariant = {
    default: activeBase,
    muted: 'bg-accent-luxury/20 border-accent-luxury/50 text-[var(--accent-luxury)]',
    verified: 'bg-blue-600 border-blue-600 text-white shadow-sm',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 active:scale-95',
        active ? activeByVariant[variant] : inactiveByVariant[variant],
      )}
    >
      {icon}
      {label}
    </button>
  )
}
