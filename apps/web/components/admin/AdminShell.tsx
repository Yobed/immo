'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldCheck, CheckSquare, Home, Building2, LogOut, ClipboardCheck, Flame, Users, Megaphone, UserSearch, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminShellProps {
  email: string
  pendingCount?: number
  children: React.ReactNode
}

const ADMIN_NAV = [
  { href: '/admin/validation', label: 'Validation', icon: ClipboardCheck, badge: true },
  { href: '/admin/comptes', label: 'Comptes', icon: Users, badge: false },
  { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, badge: false },
  { href: '/admin/suivi', label: 'Suivi', icon: CheckSquare, badge: false },
  { href: '/admin/moderation', label: 'Modération', icon: ShieldCheck, badge: false },
  { href: '/admin/flash', label: 'Offres flash', icon: Flame, badge: false },
  { href: '/admin/prospects', label: 'Prospects', icon: UserSearch, badge: false },
  { href: '/admin/demarcheurs', label: 'Démarcheurs', icon: Megaphone, badge: false },
  { href: '/admin/outreach', label: 'Outreach', icon: Send, badge: false },
  { href: '/admin/errors', label: 'Erreurs', icon: ClipboardCheck, badge: false },
]

/**
 * Chrome de la console d'administration — espace DISSOCIÉ de l'espace
 * propriétaire. Barre sombre dédiée, navigation admin propre, et liens
 * croisés explicites vers l'espace propriétaire (publication de ses biens)
 * et l'accueil public.
 */
export function AdminShell({ email, pendingCount = 0, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[var(--surface-hover)]">
      <header className="relative z-30 bg-[#0a0e1a] text-white border-b border-white/10 shadow-md">
        {/* Ligne 1 : marque + liens croisés (jamais mélangés aux modules) */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-14 flex items-center gap-3">
          <Link href="/admin/suivi" className="flex items-center gap-2 shrink-0 group">
            <Image src="/bogbes-logo.png" alt="BOGBE'S GROUPE" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="inline-flex items-center gap-1.5">
              <span className="font-display text-sm font-bold tracking-tight">BOGBE&apos;S</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/90 text-white px-2 py-0.5 rounded-full">Admin</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              title="Gérer mes propres annonces"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Espace propriétaire</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <span className="hidden lg:block max-w-[160px] truncate text-[11px] text-white/40 px-2" title={email}>
              {email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/70 hover:text-white hover:bg-red-500/30 transition-colors"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : les 9 modules, pleine largeur, s'enroulent (jamais coupés) */}
        <div className="max-w-[1400px] mx-auto px-3 lg:px-5 pb-2">
          <nav className="flex items-center flex-wrap gap-1">
            {ADMIN_NAV.map((item) => {
              const active = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && pendingCount > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-amber-400 text-[#0a0e1a] text-[10px] font-bold">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {children}
    </div>
  )
}
