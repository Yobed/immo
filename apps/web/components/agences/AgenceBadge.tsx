import Link from 'next/link'
import Image from 'next/image'

interface AgenceBadgeProps {
  slug: string
  nom_commercial: string
  logo_url?: string | null
  is_verifie?: boolean
  size?: 'sm' | 'md'
}

export function AgenceBadge({
  slug,
  nom_commercial,
  logo_url,
  is_verifie = false,
  size = 'sm',
}: AgenceBadgeProps) {
  const sizeClasses =
    size === 'md'
      ? 'h-10 gap-2 px-3 text-sm'
      : 'h-7 gap-1.5 px-2 text-xs'
  const logoSize = size === 'md' ? 28 : 20

  return (
    <Link
      href={`/agences/${slug}`}
      className={`inline-flex items-center ${sizeClasses} rounded-pill border border-[var(--border)] bg-[var(--surface)] hover:border-accent-luxury/60 hover:bg-[var(--surface-card)] transition-colors font-sans text-[var(--text)]`}
      title={`Voir l'agence ${nom_commercial}`}
    >
      {logo_url ? (
        <Image
          src={logo_url}
          alt={nom_commercial}
          width={logoSize}
          height={logoSize}
          className="rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="inline-flex items-center justify-center rounded-full bg-accent-luxury/15 text-[var(--accent-luxury)] font-display font-semibold"
          style={{ width: logoSize, height: logoSize, fontSize: logoSize * 0.5 }}
        >
          {nom_commercial.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="truncate max-w-[160px]">{nom_commercial}</span>
      {is_verifie && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--accent-luxury)] shrink-0">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </Link>
  )
}
