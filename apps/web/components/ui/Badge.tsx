import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'photo' | 'video' | 'vue360' | 'plan' | 'luxury' | 'premium' | 'exclusive'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]',
  success:  'bg-accent-light text-accent',
  warning:  'bg-yellow-50 text-yellow-700',
  danger:   'bg-danger-light text-danger',
  info:     'bg-primary-light text-primary',
  photo:    'bg-accent-light text-accent',
  video:    'bg-secondary-light text-secondary',
  vue360:   'bg-purple-100 text-purple-700',
  plan:     'bg-primary-light text-primary',
  luxury:   'bg-accent-luxury/10 text-accent-luxury border border-accent-luxury/20',
  premium:  'bg-secondary/40 text-off-white border border-white/10 backdrop-blur-md',
  exclusive: 'bg-black text-accent-luxury border border-accent-luxury/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
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
