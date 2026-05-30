import { PremiumBienCardSkeleton } from '@/components/bien/PremiumBienCardSkeleton'
import { SearchBar } from '@/components/search/SearchBar'
import { Grid, List, Map as MapIcon } from 'lucide-react'

export default function Loading() {
  return (
    <main className="bg-[var(--background)] min-h-screen pt-24 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 animate-pulse">
          <div className="flex-1 max-w-3xl">
            <div className="h-12 w-2/3 bg-[var(--midnight-muted)] rounded-2xl mb-4" />
            <div className="h-16 w-full bg-[var(--midnight-muted)] rounded-2xl" />
          </div>
          
          <div className="flex items-center gap-6 self-end lg:self-center opacity-50">
            <div className="text-right">
              <div className="h-8 w-12 bg-[var(--midnight-muted)] rounded-lg mb-2 ml-auto" />
              <div className="h-3 w-24 bg-[var(--midnight-muted)] rounded-lg" />
            </div>
            <div className="h-12 w-px bg-white/5" />
            <div className="flex gap-1.5 p-1.5 bg-[var(--midnight-muted)] rounded-2xl border border-[var(--border)]">
              {[Grid, List, MapIcon].map((Icon, i) => (
                <div key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5">
                  <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                  <div className="h-3 w-10 bg-muted/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Side Filters Skeleton */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-28 bg-[var(--surface-card)] rounded-[3rem] border border-[var(--border)] p-8 h-[600px] animate-pulse">
              <div className="h-6 w-1/2 bg-[var(--midnight-muted)] rounded-lg mb-8" />
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 w-1/3 bg-[var(--midnight-muted)] rounded" />
                    <div className="h-10 w-full bg-[var(--midnight-muted)] rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Area Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <PremiumBienCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
