import { CatalogueSkeleton } from '@/components/catalogue/CatalogueSkeleton'

export default function CatalogueLoading() {
  return (
    <main className="bg-[var(--surface-hover)] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6 space-y-3">
          <div className="h-8 w-64 rounded bg-[var(--surface-hover)] animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-[var(--surface-hover)] animate-pulse" />
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="h-10 w-32 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
          <div className="h-10 w-36 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
        </div>
        <CatalogueSkeleton count={12} />
      </div>
    </main>
  )
}
