'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, BedDouble, Key, Wallet, MapPin, Sparkles } from 'lucide-react'

const TYPE_FILTERS = [
  { id: 'all', label: 'Tout Explorer', icon: Sparkles, params: { type_bien: '' } },
  { id: 'residence_meublee', label: 'Meublés', icon: BedDouble, params: { type_bien: 'residence_meublee' } },
  { id: 'appartement', label: 'Appartements', icon: Key, params: { type_bien: 'appartement' } },
  { id: 'villa', label: 'Villas', icon: Wallet, params: { type_bien: 'villa' } },
]

const COMMUNE_FILTERS = [
  { id: 'cocody', label: 'Cocody', params: { commune: 'Cocody' } },
  { id: 'riviera', label: 'Riviera', params: { commune: 'Riviera' } },
  { id: 'plateau', label: 'Plateau', params: { commune: 'Plateau' } },
  { id: 'marory', label: 'Marcory', params: { commune: 'Marcory' } },
  { id: 'yopougon', label: 'Yopougon', params: { commune: 'Yopougon' } },
  { id: 'bingerville', label: 'Bingerville', params: { commune: 'Bingerville' } },
]

export function QuickFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type_bien')
  const currentCommune = searchParams.get('commune')

  const handleFilter = (filterParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    // Reset page on filter
    params.delete('page')
    router.push(`/recherche?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 lg:hidden">
      {/* Types Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        {TYPE_FILTERS.map((f) => {
          const isActive = (f.id === 'all' && !currentType) || currentType === f.params.type_bien
          const Icon = f.icon
          
          return (
            <button
              key={f.id}
              onClick={() => handleFilter(f.params)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 active:scale-95",
                isActive 
                  ? "bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-[var(--on-accent)] shadow-xl shadow-[var(--accent-luxury)]/20" 
                  : "bg-[var(--midnight-muted)]/50 border-[var(--border)] text-[var(--text-muted)] hover:border-white/20"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-[var(--on-accent)]" : "text-[var(--accent-luxury)]")} />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Communes Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        <div className="flex items-center px-3 py-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
        </div>
        {COMMUNE_FILTERS.map((f) => {
          const isActive = currentCommune?.toLowerCase() === f.params.commune.toLowerCase()
          
          return (
            <button
              key={f.id}
              onClick={() => handleFilter(f.params)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border shrink-0 active:scale-95",
                isActive 
                  ? "bg-[var(--accent-luxury)]/20 border-[var(--accent-luxury)]/40 text-[var(--accent-luxury)]" 
                  : "bg-white/5 border-white/10 text-[var(--text-muted)]"
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
