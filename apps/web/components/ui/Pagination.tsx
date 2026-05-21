import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  /** Index courant (0-based) */
  pageIdx: number
  /** Nombre total de pages */
  totalPages: number
  /** Builder d'URL pour une page donnée */
  buildHref: (pageIdx: number) => string
  /** Nombre de boutons visibles autour de la page courante (window). Défaut: 2 */
  siblingCount?: number
}

/**
 * Pagination avec ellipsis "..." pour naviguer sans limite.
 * Ex. (page 7 / 42 total) : [‹] 1 ... 5 6 [7] 8 9 ... 42 [›]
 */
export function Pagination({ pageIdx, totalPages, buildHref, siblingCount = 2 }: Props) {
  if (totalPages <= 1) return null

  const items = buildPaginationItems(pageIdx, totalPages, siblingCount)

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
      <div className="flex gap-1 p-1.5 bg-[var(--midnight-muted)]/50 backdrop-blur-xl rounded-2xl border border-[var(--border)]">
        {pageIdx > 0 && (
          <Link
            href={buildHref(pageIdx - 1)}
            aria-label="Page précédente"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)] transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}

        {items.map((item, i) =>
          item === 'ellipsis' ? (
            <span
              key={`ell-${i}`}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)] text-[11px]"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item)}
              aria-current={item === pageIdx ? 'page' : undefined}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all ${
                item === pageIdx
                  ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]'
              }`}
            >
              {item + 1}
            </Link>
          ),
        )}

        {pageIdx < totalPages - 1 && (
          <Link
            href={buildHref(pageIdx + 1)}
            aria-label="Page suivante"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)] transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </nav>
  )
}

/**
 * Construit la séquence de pages à afficher avec ellipsis.
 * Renvoie un tableau d'index 0-based ou 'ellipsis'.
 */
function buildPaginationItems(
  current: number,
  total: number,
  siblings: number,
): Array<number | 'ellipsis'> {
  const items: Array<number | 'ellipsis'> = []
  const first = 0
  const last = total - 1
  const start = Math.max(first + 1, current - siblings)
  const end = Math.min(last - 1, current + siblings)

  items.push(first)
  if (start > first + 1) items.push('ellipsis')
  for (let i = start; i <= end; i++) {
    if (i !== first && i !== last) items.push(i)
  }
  if (end < last - 1) items.push('ellipsis')
  if (last !== first) items.push(last)

  return items
}
