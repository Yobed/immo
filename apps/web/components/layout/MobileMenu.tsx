'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LogOut, LayoutDashboard, Home, Search, Heart, MessageSquare, Menu, X,
  Building2, Flame, BookOpen, Phone, HelpCircle, Sparkles, ChevronRight,
  type LucideIcon,
} from 'lucide-react'

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

// Map href patterns → semantic icon
function iconForHref(href: string): LucideIcon {
  const h = href.toLowerCase()
  if (h === '/' || h.includes('accueil')) return Home
  if (h.includes('offre-flash') || h.includes('flash')) return Flame
  if (h.includes('bien')) return Building2
  if (h.includes('favori')) return Heart
  if (h.includes('message')) return MessageSquare
  if (h.includes('blog') || h.includes('actualite')) return BookOpen
  if (h.includes('contact') || h.includes('support')) return Phone
  if (h.includes('about') || h.includes('propos') || h.includes('aide')) return HelpCircle
  if (h.includes('chat') || h.includes('sapphire')) return Sparkles
  return Search
}

export function MobileMenu({ links, user }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
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
  const initial = user?.email?.charAt(0).toUpperCase() ?? ''

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl hover:bg-[var(--surface-hover)] transition-all md:hidden border border-[var(--border)]"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5 text-[var(--text)]" /> : <Menu className="w-5 h-5 text-[var(--text)]" />}
      </button>

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[400] bg-[var(--background)] flex flex-col md:hidden transition-all duration-400 ease-[var(--ease-expo)]',
          open ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-full pointer-events-none'
        )}
      >
        {/* HEADER — logo + close only */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
          <Link href="/" onClick={close} className="flex items-center gap-2.5">
            <Image src="/bogbes-logo.png" alt="BOGBE'S" width={36} height={36} className="object-contain" />
            <span className="font-display text-base font-bold text-[var(--text)] tracking-tight leading-tight">
              BOGBE&apos;S <span className="text-[var(--secondary)]">GROUPE</span>
            </span>
          </Link>
          <button
            onClick={close}
            aria-label="Fermer"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text)] active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* USER CARD (if logged in) */}
          {user && (
            <div className="px-5 pt-5">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center text-[var(--on-accent)] font-display font-bold text-lg shrink-0 shadow-md">
                  {initial}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Connecté</span>
                    {user.isAdmin && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">Admin</span>
                    )}
                    {user.role === 'pro' && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--accent-luxury)] bg-[var(--accent-luxury)]/10 px-1.5 py-0.5 rounded-full border border-[var(--accent-luxury)]/20">Propriétaire</span>
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--text)] truncate">{user.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <nav className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3 px-1">Navigation</p>
            <ul className="space-y-1">
              {links.map((link) => {
                const Icon = iconForHref(link.href)
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-[var(--text)] hover:bg-[var(--surface-card)] active:bg-[var(--surface-card)] active:scale-[0.98] transition-all group"
                    >
                      <span className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--accent-luxury)]/40 group-hover:bg-[var(--accent-luxury)]/5 transition-colors shrink-0">
                        <Icon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-luxury)]" />
                      </span>
                      <span className="flex-1">{link.label}</span>
                      <ChevronRight size={16} className="text-[var(--text-muted)]/40 shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* QUICK ACTIONS for logged-in users */}
          {user && (
            <div className="px-5 pb-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2 px-1">Mon compte</p>
              <button
                onClick={() => { router.push('/dashboard'); close() }}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-[var(--text)] hover:bg-[var(--surface-card)] active:scale-[0.98] transition-all group"
              >
                <span className="w-9 h-9 rounded-lg bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/20 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={16} className="text-[var(--accent-luxury)]" />
                </span>
                <span className="flex-1 text-left">Tableau de bord</span>
                <ChevronRight size={16} className="text-[var(--text-muted)]/40 shrink-0" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-red-500 hover:bg-red-500/10 active:scale-[0.98] transition-all group"
              >
                <span className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <LogOut size={16} className="text-red-500" />
                </span>
                <span className="flex-1 text-left">Se déconnecter</span>
              </button>
            </div>
          )}
        </div>

        {/* FOOTER — preferences (theme + lang) + auth CTAs (if not logged in) */}
        <div className="border-t border-[var(--border)] bg-[var(--surface-card)] px-5 py-4 space-y-4 shrink-0">
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={close}
                className="py-3 border border-[var(--border)] text-[var(--text)] font-bold uppercase tracking-[0.15em] text-[10px] rounded-xl text-center bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all active:scale-[0.98]"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="py-3 bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold uppercase tracking-[0.15em] text-[10px] rounded-xl text-center shadow-md transition-all active:scale-[0.98]"
              >
                Créer un compte
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Préférences</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
