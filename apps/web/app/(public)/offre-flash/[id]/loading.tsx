export default function OffreFlashDetailLoading() {
  return (
    <main className="bg-[var(--surface-hover)] min-h-screen pb-12">
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-[var(--surface-hover)] animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-orange-100 animate-pulse" />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
          <div className="space-y-5">
            <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
            <div className="bg-[var(--surface-card)] rounded-2xl p-6 border border-[var(--border)] space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                <div className="h-5 w-20 rounded-full bg-[var(--surface-hover)] animate-pulse" />
              </div>
              <div className="h-7 w-3/4 rounded bg-[var(--surface-hover)] animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-[var(--surface-hover)] animate-pulse" />
              <div className="h-10 w-2/3 rounded bg-orange-100 animate-pulse mt-4" />
            </div>
            <div className="bg-[var(--surface-card)] rounded-2xl p-6 border border-[var(--border)] space-y-2">
              <div className="h-3 w-24 rounded bg-[var(--surface-hover)] animate-pulse" />
              <div className="h-3 w-full rounded bg-[var(--surface-hover)] animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-[var(--surface-hover)] animate-pulse" />
              <div className="h-3 w-4/6 rounded bg-[var(--surface-hover)] animate-pulse" />
            </div>
          </div>
          <aside className="space-y-4">
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 h-20 animate-pulse" />
            <div className="bg-[var(--surface-card)] rounded-2xl p-5 border border-[var(--border)] h-64 animate-pulse" />
          </aside>
        </div>
      </div>
    </main>
  )
}
