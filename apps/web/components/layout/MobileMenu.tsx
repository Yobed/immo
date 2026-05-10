'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, LayoutDashboard, Home, Search, Heart, MessageSquare, Menu, X, ArrowRight } from 'lucide-react'

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
        className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[var(--surface-hover)] transition-all md:hidden border border-[var(--border)]"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5 text-[var(--text)]" /> : <Menu className="w-5 h-5 text-[var(--text)]" />}
      </button>

      {/* Overlay — Theme Aware */}
      <div
        className={cn(
          'fixed inset-0 z-[300] bg-[var(--background)] flex flex-col md:hidden transition-all duration-500 ease-[var(--ease-expo)]',
          open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        )}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--glass-surface)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-black text-[var(--text)] italic uppercase tracking-tighter">Menu</span>
            <ThemeToggle />
            <LanguageSwitcher variant="compact" />
          </div>
          <button
            onClick={close}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-6 py-8 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex items-center gap-4 p-4 rounded-2xl text-base font-bold text-[var(--text)] hover:bg-[var(--surface-card)] hover:border-[var(--accent-luxury)]/20 border border-transparent transition-all group active:scale-[0.98]"
            >
              <span className="w-8 h-8 rounded-lg bg-[var(--surface)] flex items-center justify-center group-hover:bg-[var(--accent-luxury)]/10 transition-colors">
                <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-luxury)]" />
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User / CTA Section */}
        <div className="p-6 pb-12 space-y-4 bg-[var(--surface-card)] border-t border-[var(--border)] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-luxury)]/20 flex items-center justify-center text-[var(--accent-luxury)]">
                  <User size={24} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Connecté en tant que</span>
                  <span className="text-sm font-bold text-[var(--text)] truncate">{user.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { router.push('/dashboard'); close() }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-luxury)]/40 transition-all"
                >
                  <LayoutDashboard size={20} className="text-[var(--accent-luxury)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Quitter</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/login"
                onClick={close}
                className="w-full py-5 bg-[var(--accent-luxury)] text-[var(--on-accent)] font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl text-center shadow-xl shadow-[var(--accent-glow)] transition-all active:scale-[0.98]"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="w-full py-5 border border-[var(--border)] text-[var(--text)] font-black uppercase tracking-[0.25em] text-[11px] rounded-2xl text-center bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
