'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavLink {
  href: string
  label: string
  icon?: string
}

interface MobileMenuProps {
  links: NavLink[]
  ctaLinks?: { href: string; label: string; variant: 'primary' | 'outline' }[]
  user?: { email: string; role: 'pro' | 'client' | 'public'; isAdmin?: boolean }
}

export function MobileMenu({ links, ctaLinks, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const close = () => setOpen(false)

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col gap-1.5 p-2 rounded-btn hover:bg-[var(--surface)] transition-colors md:hidden"
        aria-label="Menu"
      >
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-transform duration-200', open && 'translate-y-2 rotate-45')} />
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-opacity duration-200', open && 'opacity-0')} />
        <span className={cn('block w-5 h-0.5 bg-[var(--text)] transition-transform duration-200', open && '-translate-y-2 -rotate-45')} />
      </button>

      {/* Overlay plein écran — fond blanc fixe, fondu, aucun gap */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-white flex flex-col md:hidden transition-opacity duration-250',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg text-slate-900">Menu</span>
            <ThemeToggle />
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-btn hover:bg-slate-100 transition-colors text-slate-700"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-sans text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              {link.icon && <span className="text-base">{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA / User */}
        <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 font-sans">Connecté en tant que</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-semibold text-slate-800 truncate max-w-[180px]">
                    {user.email}
                  </span>
                  {user.role === 'pro' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pro</span>
                  )}
                  {user.role === 'client' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Locataire</span>
                  )}
                  {user.role === 'public' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Visiteur</span>
                  )}
                  {user.isAdmin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">Admin</span>
                  )}
                </div>
              </div>
              {user.isAdmin && (
                <Link
                  href="/admin/moderation"
                  onClick={close}
                  className="w-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-sans font-bold"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Modération
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full border border-red-300 text-red-600 hover:bg-red-50 transition-colors block text-center py-2.5 rounded-xl text-sm font-sans font-medium"
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
                    onClick={close}
                    className={cn(
                      'block w-full text-center py-3 rounded-xl text-sm font-sans font-medium transition-colors',
                      cta.variant === 'primary'
                        ? 'bg-slate-900 text-white hover:bg-slate-700'
                        : 'border border-slate-300 text-slate-700 hover:border-slate-400'
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
