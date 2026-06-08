import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  /** Forme prédéfinie : "text" (ligne fine), "circle", "card", "image" */
  variant?: 'text' | 'circle' | 'card' | 'image' | 'block'
}

/**
 * Bloc de chargement avec shimmer animé.
 *
 * Utilisation :
 *   <Skeleton variant="image" className="aspect-[4/3] rounded-xl" />
 *   <Skeleton variant="text" className="w-2/3 h-4" />
 *   <Skeleton variant="circle" className="w-10 h-10" />
 */
export function Skeleton({ className, variant = 'block' }: SkeletonProps) {
  const base = 'skeleton-shimmer'
  const shape = {
    text: 'h-3 rounded',
    circle: 'rounded-full',
    card: 'rounded-2xl',
    image: 'rounded-xl',
    block: 'rounded-md',
  }[variant]

  return (
    <div
      className={cn(base, shape, className)}
      aria-hidden="true"
      role="presentation"
    />
  )
}

/**
 * Composé : carte de bien en mode chargement (équivalent UnifiedBienCard).
 * Utilisable comme placeholder dans une grille pendant le fetch.
 */
export function BienCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[var(--surface-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <Skeleton variant="image" className="aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <Skeleton variant="text" className="w-3/4 h-3.5" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton variant="text" className="w-12 h-2.5" />
          <Skeleton variant="text" className="w-10 h-2.5" />
        </div>
      </div>
    </div>
  )
}
