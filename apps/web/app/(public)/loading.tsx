export default function Loading() {
  return (
    <div className="min-h-screen bg-surface animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-[var(--border)] rounded-card w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-card border border-[var(--border)] overflow-hidden">
              <div className="aspect-[4/3] bg-[var(--border)]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                <div className="h-3 bg-[var(--border)] rounded w-1/2" />
                <div className="h-5 bg-[var(--border)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
