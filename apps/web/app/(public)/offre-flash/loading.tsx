import { CatalogueSkeleton } from '@/components/catalogue/CatalogueSkeleton'

export default function OffreFlashLoading() {
  return (
    <main className="bg-[var(--surface-hover)] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6 space-y-3">
          <div className="h-8 w-72 rounded bg-[var(--surface-hover)] animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-[var(--surface-hover)] animate-pulse" />
        </div>
        <CatalogueSkeleton count={12} />
      </div>
    </main>
  )
}
