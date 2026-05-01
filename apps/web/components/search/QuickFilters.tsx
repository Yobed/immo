'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, BedDouble, Key, Wallet } from 'lucide-react'

const FILTERS = [
  { id: 'all', label: 'Tout', icon: Home, params: { type_bien: '' } },
  { id: 'meuble', label: 'Meublés', icon: BedDouble, params: { type_bien: 'Résidence Meublée' } },
  { id: 'location', label: 'Locations', icon: Key, params: { type_bien: 'Appartement' } }, // Simple map for now
  { id: 'vente', label: 'Ventes', icon: Wallet, params: { type_bien: 'Vente' } }, // Hypothetical
]

export function QuickFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type_bien')

  const handleFilter = (filterParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`/recherche?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:hidden">
      {FILTERS.map((f) => {
        const isActive = (f.id === 'all' && !currentType) || currentType === f.params.type_bien
        const Icon = f.icon
        
        return (
          <button
            key={f.id}
            onClick={() => handleFilter(f.params)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
              isActive 
                ? "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20 scale-105" 
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-amber-500")} />
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
