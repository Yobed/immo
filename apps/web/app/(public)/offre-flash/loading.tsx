import { CatalogueSkeleton } from '@/components/catalogue/CatalogueSkeleton'

export default function OffreFlashLoading() {
  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6 space-y-3">
          <div className="h-8 w-72 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-80 max-w-full rounded bg-slate-100 animate-pulse" />
        </div>
        <CatalogueSkeleton count={12} />
      </div>
    </main>
  )
}
