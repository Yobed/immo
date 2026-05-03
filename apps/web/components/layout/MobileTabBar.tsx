'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const TABS = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/recherche', icon: Search, label: 'Rechercher' },
  { href: '/offre-flash', icon: Sparkles, label: 'Flash' },
  { href: '/favoris', icon: Heart, label: 'Favoris' },
  { href: '/dashboard', icon: User, label: 'Compte' },
]

export function MobileTabBar() {
  const pathname = usePathname()

  // On cache la barre sur la fiche bien car il y a déjà le StickyMobileCTA
  const isPropertyDetail = pathname.startsWith('/biens/') && pathname.split('/').length > 2
  // On cache aussi sur les pages d'auth pour garder le focus
  const isAuth = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isPropertyDetail || isAuth) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
      {/* Background with glassmorphism — Enhanced for luxury */}
      <div className="absolute inset-0 bg-[var(--nav-bg)] backdrop-blur-3xl border-t border-white/5 shadow-[0_-12px_40px_rgba(0,0,0,0.4)]" />
      
      {/* Safe area spacer for modern iPhones */}
      <div className="relative pb-[env(safe-area-inset-bottom,1rem)]">
        <nav className="flex items-center justify-around h-[76px] px-2">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative min-w-[44px]",
                  isActive ? "text-[var(--accent-luxury)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                )}
              >
                <div className={cn(
                  "relative p-2.5 rounded-2xl transition-all duration-500",
                  isActive && "bg-[var(--accent-luxury)]/15 shadow-[0_0_20px_var(--accent-glow)]"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-transform duration-300",
                    isActive ? "stroke-[2.5] scale-110" : "stroke-[1.75]",
                    tab.label === 'Flash' && !isActive && "animate-pulse text-amber-500/70"
                  )} />
                  {isActive && (
                    <motion.span
                      layoutId="activeTabDot"
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--accent-luxury)] rounded-full shadow-[0_0_12px_var(--accent-luxury)]"
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 leading-none",
                  isActive ? "opacity-100 text-[var(--accent-luxury)]" : "opacity-55 translate-y-0.5"
                )}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
