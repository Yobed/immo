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

  return (
    <nav aria-label="Fil d'Ariane" className={`flex items-center gap-1 text-[11px] font-medium overflow-x-auto no-scrollbar ${className}`}>
      <Link
        href="/"
        className={`inline-flex items-center gap-1 ${textBase} ${textHover} transition-colors shrink-0`}
        aria-label="Accueil"
      >
        <Home className="w-3 h-3" />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1 shrink-0">
            <ChevronRight className={`w-3 h-3 ${sepColor}`} />
            {item.href && !isLast ? (
              <Link href={item.href} className={`${textBase} ${textHover} transition-colors truncate max-w-[150px]`}>
                {item.label}
              </Link>
            ) : (
              <span className={`${isLast ? textActive : textBase} truncate max-w-[200px] ${isLast ? 'font-bold' : ''}`} aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
