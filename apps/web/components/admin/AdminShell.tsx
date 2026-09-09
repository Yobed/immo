'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldCheck, CheckSquare, Home, Building2, LogOut, ClipboardCheck, Flame, Users, Megaphone, UserSearch, Send, BarChart3, ScanSearch, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AdminShellProps {
  email: string
  pendingCount?: number
  children: React.ReactNode
}

const ADMIN_NAV_GROUPS = [
  {
    label: 'À traiter',
    items: [
      { href: '/admin/suivi', label: 'Suivi', icon: CheckSquare, badge: false },
      { href: '/admin/prospects', label: 'Prospects', icon: UserSearch, badge: false },
      { href: '/admin/performance', label: 'Performance', icon: BarChart3, badge: false },
      { href: '/admin/prospects/qualite', label: 'Qualité', icon: ScanSearch, badge: false },
      { href: '/admin/guide', label: 'Guide', icon: BookOpen, badge: false },
    ],
  },
  {
    label: 'Annonces',
    items: [
      { href: '/admin/validation', label: 'Validation', icon: ClipboardCheck, badge: true },
      { href: '/admin/moderation', label: 'Modération', icon: ShieldCheck, badge: false },
      { href: '/admin/flash', label: 'Offres flash', icon: Flame, badge: false },
    ],
  },
  {
    label: 'Équipe',
    items: [
      { href: '/admin/comptes', label: 'Comptes', icon: Users, badge: false },
      { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck, badge: false },
      { href: '/admin/demarcheurs', label: 'Démarcheurs', icon: Megaphone, badge: false },
    ],
  },
  {
    label: 'Système',
    items: [
      { href: '/admin/outreach', label: 'Outreach', icon: Send, badge: false },
      { href: '/admin/errors', label: 'Erreurs', icon: ClipboardCheck, badge: false },
    ],
  },
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
      <header className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-md text-[var(--text)] border-b border-[var(--border)] shadow-md">
        {/* Ligne 1 : marque + liens croisés (jamais mélangés aux modules) */}
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-14 flex items-center gap-3">
          <Link href="/admin/suivi" className="flex items-center gap-2 shrink-0 group">
            <Image src="/bogbes-logo.png" alt="BOGBE'S GROUPE" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="inline-flex items-center gap-1.5">
              <span className="font-display text-sm font-bold tracking-tight">BOGBE&apos;S</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] border border-[var(--accent-luxury)]/30 px-2 py-0.5 rounded-md">Admin</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
              title="Gérer mes propres annonces"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Espace propriétaire</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <span className="hidden lg:block max-w-[160px] truncate text-[11px] text-[var(--text-muted)] px-2" title={email}>
              {email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--text-muted)] hover:text-red-300 hover:bg-red-500/15 transition-colors"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>

        {/* Navigation par missions : les modules sont regroupés pour réduire la charge cognitive. */}
        <div className="max-w-[1400px] mx-auto px-3 lg:px-5 pb-2">
          <nav aria-label="Navigation administrateur" className="flex items-start gap-3 overflow-x-auto no-scrollbar">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.label} className="shrink-0 border-l border-[var(--border)] pl-2 first:border-l-0 first:pl-0">
                <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{group.label}</p>
                <div className="flex items-center gap-1">
                  {group.items.map((item) => {
                    const active = pathname.startsWith(item.href)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex min-h-[40px] items-center gap-1.5 px-3 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                          active
                            ? 'bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] border-l-2 border-[var(--accent-luxury)] shadow-none'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                        {item.badge && pendingCount > 0 && (
                          <span className={`ml-0.5 min-w-[20px] h-[20px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)]' : 'bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)]'}`}>
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </div>
  )
}
