'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Sparkles, BedDouble, Building2, Palmtree, Home as HomeIcon,
  Briefcase, Store, Shovel, Warehouse, MapPin,
} from 'lucide-react'

/**
 * Filtres rapides type + commune, partagés entre /recherche, /catalogue et /offre-flash.
 * Reste sur la page courante (au lieu de toujours renvoyer vers /recherche).
 *
 * Couvre tous les TYPES_BIEN : studio, appartement, villa, maison, bureau,
 * commerce, terrain, residence_meublee.
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

const COMMUNE_FILTERS = [
  { id: 'cocody',      label: 'Cocody',       commune: 'Cocody' },
  { id: 'riviera',     label: 'Riviera',      commune: 'Riviera' },
  { id: 'plateau',     label: 'Plateau',      commune: 'Plateau' },
  { id: 'marcory',     label: 'Marcory',      commune: 'Marcory' },
  { id: 'yopougon',    label: 'Yopougon',     commune: 'Yopougon' },
  { id: 'bingerville', label: 'Bingerville',  commune: 'Bingerville' },
  { id: 'songon',      label: 'Songon',       commune: 'Songon' },
  { id: 'abobo',       label: 'Abobo',        commune: 'Abobo' },
  { id: 'treichville', label: 'Treichville',  commune: 'Treichville' },
] as const

/** Pages où ce composant est utilisé — on reste sur celle où l'on est */
const SUPPORTED_PAGES = ['/recherche', '/catalogue', '/offre-flash'] as const

export function QuickFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type_bien')
  const currentCommune = searchParams.get('commune')

  // Détermine la page de destination : on RESTE sur la page courante si supportée,
  // sinon fallback vers /recherche.
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

  return (
    <div className="flex flex-col gap-3">
      {/* Types — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {TYPE_FILTERS.map((f) => {
          const isActive = (f.id === 'all' && !currentType) || currentType === f.type
          const Icon = f.icon
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilter({ type_bien: f.type })}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 active:scale-95',
                isActive
                  ? 'bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-[var(--on-accent)] shadow-md'
                  : 'bg-[var(--midnight-muted)]/50 border-[var(--border)] text-[var(--text-muted)] hover:border-white/20 hover:text-[var(--text)]',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[var(--on-accent)]' : 'text-[var(--accent-luxury)]')} />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Communes — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center px-2.5 py-2 bg-white/5 rounded-lg border border-white/10 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
        </div>
        {COMMUNE_FILTERS.map((f) => {
          const isActive = currentCommune?.toLowerCase() === f.commune.toLowerCase()
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleFilter({ commune: isActive ? '' : f.commune })}
              className={cn(
                'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 active:scale-95',
                isActive
                  ? 'bg-[var(--accent-luxury)]/20 border-[var(--accent-luxury)]/50 text-[var(--accent-luxury)]'
                  : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
