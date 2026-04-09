export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--surface)] animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 bg-white rounded-card border border-[var(--border)] w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-card border border-[var(--border)] p-4 space-y-2">
              <div className="h-4 bg-[var(--border)] rounded w-1/2" />
              <div className="h-3 bg-[var(--border)] rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
