import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'photo' | 'video' | 'vue360' | 'plan' | 'luxury' | 'premium' | 'exclusive'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

// All variants now derive from semantic tokens — no Tailwind palette leakage,
// no "bg-accent-light" / "text-off-white" undefined classes.
const variants: Record<BadgeVariant, string> = {
  default:   'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
  success:   'bg-[var(--success-soft)] text-[var(--success)] border border-success/20',
  warning:   'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-soft)]',
  danger:    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  info:      'bg-[var(--info-soft)] text-[var(--info)] border border-info/20',
  photo:     'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]',
  video:     'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]',
  vue360:    'bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] border border-accent-luxury/20',
  plan:      'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]',
  luxury:    'bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] border border-accent-luxury/20',
  premium:   'bg-secondary/15 text-secondary border border-secondary/25',
  exclusive: 'bg-[var(--surface-card)] text-[var(--accent-luxury)] border border-accent-luxury/30',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
