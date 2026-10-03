'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShieldCheck, CheckSquare, Home, Building2, LogOut, ClipboardCheck,
  Flame, Users, Megaphone, UserSearch, BarChart3, ScanSearch, BookOpen,
  LayoutDashboard, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminShellProps {
  email: string
  pendingCount?: number
  children: React.ReactNode
}

const PRIMARY_NAV = [
  { href: '/admin', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/admin/prospects', label: 'Prospects', icon: UserSearch },
  { href: '/admin/suivi', label: 'Visites & Suivi', icon: CheckSquare },
  { href: '/admin/validation', label: 'Validation', icon: ClipboardCheck, badge: true },
  { href: '/admin/flash', label: 'Offres flash', icon: Flame },
]

const MORE_NAV = [
  { href: '/admin/moderation', label: 'Modération', icon: ShieldCheck },
  { href: '/admin/performance', label: 'Performance', icon: BarChart3 },
  { href: '/admin/comptes', label: 'Comptes', icon: Users },
  { href: '/admin/demarcheurs', label: 'Démarcheurs', icon: Megaphone },
  { href: '/admin/guide', label: 'Guide d’utilisation', icon: BookOpen },
  { href: '/admin/errors', label: 'Journal des erreurs', icon: ScanSearch },
]

export function AdminShell({ email, pendingCount = 0, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isMoreActive = MORE_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans flex flex-col">
      {/* Barre d'en-tête unique épurée (Style Stripe / Notion) */}
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shrink-0">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          
          {/* Gauche : Logo + Navigation principale */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group">
              <Image
                src="/bogbes-logo.png"
                alt="BOGBE'S GROUPE"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
              <span className="font-display text-sm font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                BOGBE&apos;S
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                Admin
              </span>
            </Link>

            {/* Onglets principaux */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
              {PRIMARY_NAV.map((item) => {
                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && pendingCount > 0 && (
                      <span
                        className={`ml-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? 'bg-white text-slate-900'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Menu déroulant "Plus" pour les modules secondaires */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isMoreActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Modules</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {MORE_NAV.map((sub) => {
                      const active = pathname === sub.href || pathname.startsWith(sub.href + '/')
                      const SubIcon = sub.icon
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                            active
                              ? 'bg-slate-100 font-semibold text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sub.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Droite : Liens croisés + Profil */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Accéder à l'espace propriétaire"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Espace propriétaire</span>
            </Link>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Retourner au site public"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Site public</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <span className="hidden xl:inline text-xs text-slate-500 max-w-[150px] truncate" title={email}>
              {email}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
