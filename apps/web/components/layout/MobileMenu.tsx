'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

interface NavLink {
  href: string
  label: string
  icon?: string
}

interface MobileMenuProps {
  links: NavLink[]
  ctaLinks?: { href: string; label: string; variant: 'primary' | 'outline' }[]
  user?: { email: string; role: 'pro' | 'client' | 'public' }
}

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function MobileMenu({ links, ctaLinks, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Bloque le scroll du body quand le menu est ouvert (évite le décalage)
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [open])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col gap-1.5 p-2 rounded-btn hover:bg-[var(--surface)] transition-colors md:hidden"
        aria-label="Menu"
      >
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-transform duration-200', open && 'translate-y-2 rotate-45')} />
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-opacity duration-200', open && 'opacity-0')} />
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-transform duration-200', open && '-translate-y-2 -rotate-45')} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 bottom-0 z-[100] w-72 bg-[var(--background)] shadow-2xl flex flex-col transition-transform duration-300 md:hidden',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
             <span className="font-display text-lg text-primary">Menu</span>
             <ThemeToggle />
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-btn hover:bg-[var(--surface)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-card text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-primary transition-colors"
            >
              {link.icon && <span className="text-base">{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA buttons / User info */}
        <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--surface-card)] mt-auto">
          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--text-muted)] font-sans">Connecté en tant que</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-semibold text-[var(--text)] truncate max-w-[180px]">
                    {user.email}
                  </span>
                  {user.role === 'pro' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                      Pro
                    </span>
                  )}
                  {user.role === 'client' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Locataire
                    </span>
                  )}
                  {user.role === 'public' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      Visiteur
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors block text-center py-2.5 rounded-btn text-sm font-sans font-medium"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            ctaLinks && ctaLinks.length > 0 && (
              <div className="space-y-2">
                {ctaLinks.map((cta) => (
                  <Link
                    key={cta.href}
                    href={cta.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block w-full text-center py-3 rounded-btn text-sm font-sans font-medium transition-colors',
                      cta.variant === 'primary'
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'border border-[var(--border)] text-[var(--text)] hover:border-primary/40'
                    )}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
