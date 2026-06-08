import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
  className?: string
  variant?: 'dark' | 'light'
}

/**
 * Fil d'Ariane compact, accessible (nav aria-label="Breadcrumb").
 * variant 'dark' = fond clair, 'light' = fond sombre.
 */
export function Breadcrumb({ items, className = '', variant = 'dark' }: Props) {
  const textBase = variant === 'dark' ? 'text-[var(--text-muted)]' : 'text-white/50'
  const textActive = variant === 'dark' ? 'text-[var(--text)]' : 'text-white'
  const textHover = variant === 'dark' ? 'hover:text-[var(--text)]' : 'hover:text-white/80'
  const sepColor = variant === 'dark' ? 'text-[var(--text-subtle)]' : 'text-white/20'

  // Sur mobile : si la chaîne fait + de 2 segments, on cache les intermédiaires
  // et on insère un « … » à leur place pour signaler la coupure.
  const hasHiddenMiddle = items.length > 2

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center gap-1 text-[11px] font-medium overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      <Link
        href="/"
        className={`inline-flex items-center gap-1 ${textBase} ${textHover} transition-colors shrink-0`}
        aria-label="Accueil"
      >
        <Home className="w-3 h-3" />
      </Link>
      {/* Premier segment toujours visible */}
      {items.length > 0 && (() => {
        const first = items[0]
        const isOnlyOne = items.length === 1
        return (
          <span className="inline-flex items-center gap-1 shrink-0">
            <ChevronRight className={`w-3 h-3 ${sepColor}`} />
            {first.href && !isOnlyOne ? (
              <Link
                href={first.href}
                className={`${textBase} ${textHover} transition-colors truncate max-w-[90px] sm:max-w-[150px]`}
              >
                {first.label}
              </Link>
            ) : (
              <span
                className={`${isOnlyOne ? textActive : textBase} truncate max-w-[140px] sm:max-w-[200px] ${isOnlyOne ? 'font-bold' : ''}`}
                aria-current={isOnlyOne ? 'page' : undefined}
              >
                {first.label}
              </span>
            )}
          </span>
        )
      })()}
      {/* « … » mobile entre 1er et dernier — desktop affiche tous les intermédiaires */}
      {hasHiddenMiddle && (
        <span className={`sm:hidden inline-flex items-center gap-1 shrink-0 ${textBase}`} aria-hidden="true">
          <ChevronRight className={`w-3 h-3 ${sepColor}`} />
          <span className="px-0.5">…</span>
        </span>
      )}
      {/* Segments intermédiaires (cachés sur mobile) */}
      {items.slice(1, -1).map((item, i) => (
        <span key={`mid-${i}`} className="hidden sm:inline-flex items-center gap-1 shrink-0">
          <ChevronRight className={`w-3 h-3 ${sepColor}`} />
          {item.href ? (
            <Link href={item.href} className={`${textBase} ${textHover} transition-colors truncate max-w-[150px]`}>
              {item.label}
            </Link>
          ) : (
            <span className={`${textBase} truncate max-w-[200px]`}>{item.label}</span>
          )}
        </span>
      ))}
      {/* Dernier segment (uniquement si >1 items) */}
      {items.length > 1 && (
        <span className="inline-flex items-center gap-1 shrink-0">
          <ChevronRight className={`w-3 h-3 ${sepColor}`} />
          <span
            className={`${textActive} font-bold truncate max-w-[140px] sm:max-w-[200px]`}
            aria-current="page"
          >
            {items[items.length - 1].label}
          </span>
        </span>
      )}
    </nav>
  )
}
