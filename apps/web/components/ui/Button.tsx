import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-mid)] btn-primary-glow',
  secondary: 'bg-[var(--secondary)] text-[var(--on-accent)] hover:opacity-90 btn-secondary-glow',
  outline:   'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors duration-200',
  ghost:     'text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors duration-200',
  danger:    'bg-[var(--danger)] text-white hover:opacity-90 transition-opacity duration-200',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans font-medium',
        'rounded-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      aria-busy={loading}
      aria-live="polite"
      {...props}
    >
      {loading && (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="sr-only">Chargement en cours</span>
        </>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
