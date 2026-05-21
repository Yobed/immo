/**
 * Skeleton loader pour /catalogue et /offre-flash.
 * Server component — rendu pendant la résolution de la query Supabase.
 * Match la grille 2/3/4 colonnes du UnifiedBienCard.
 */
export function CatalogueSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-200 animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton liste (UnifiedBienListCard horizontal).
 */
export function CatalogueListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-2xl overflow-hidden border border-slate-200 bg-white p-3"
        >
          <div className="w-32 md:w-48 aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 w-2/3 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
            <div className="h-5 w-1/2 rounded bg-slate-200 animate-pulse mt-3" />
            <div className="flex gap-2 mt-2">
              <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
              <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
