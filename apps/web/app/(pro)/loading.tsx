export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--surface)] animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-white rounded-card border border-[var(--border)] w-56" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-card border border-[var(--border)] p-4 flex gap-4">
              <div className="w-20 h-16 bg-[var(--border)] rounded-card flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--border)] rounded w-2/3" />
                <div className="h-3 bg-[var(--border)] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
