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
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-[var(--glass-surface)] backdrop-blur-2xl border-t border-[var(--border)] shadow-[0_-8px_32px_rgba(0,0,0,0.05)]" />
      
      {/* Safe area spacer for modern iPhones */}
      <div className="relative pb-[env(safe-area-inset-bottom,1rem)]">
        <nav className="flex items-center justify-around h-[72px] px-3">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 relative",
                  isActive ? "text-[var(--accent-luxury)]" : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                )}
              >
                <div className={cn(
                  "relative p-1.5 rounded-2xl transition-all duration-500",
                  isActive && "bg-[var(--accent-luxury)]/10"
                )}>
                  <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "stroke-[3] scale-110" : "stroke-[2]")} />
                  {isActive && (
                    <motion.span 
                      layoutId="activeTabDot"
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[var(--accent-luxury)] rounded-full shadow-[0_0_12px_var(--accent-luxury)]" 
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-[0.25em] transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0 text-[var(--accent-luxury)]" : "opacity-40 translate-y-1"
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
