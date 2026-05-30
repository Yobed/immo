'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  email: string
  role?: 'pro' | 'client' | 'public'
  isAdmin?: boolean
}

export function UserMenu({ email, role = 'public', isAdmin = false }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Compteur de demandes en attente pour admin (visites + reservations + contacts)
  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    const supabase = createClient()
    ;(async () => {
      try {
        const [visites, reservations, contacts] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('visites').select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('reservations').select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('contact_requests').select('id', { count: 'exact', head: true }).eq('admin_validation_status', 'pending'),
        ])
        if (cancelled) return
        const total = (visites.count ?? 0) + (reservations.count ?? 0) + (contacts.count ?? 0)
        setPendingCount(total)
      } catch {
        // silently ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const initial = email.charAt(0).toUpperCase()
  const showBadge = isAdmin && pendingCount > 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center text-[var(--on-accent)] font-display font-bold text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--accent-luxury)]/40 shadow-md"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Menu utilisateur (${email})${showBadge ? ` — ${pendingCount} demandes en attente` : ''}`}
      >
        <span aria-hidden="true">{initial}</span>
        {showBadge && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--surface)] shadow-sm"
            aria-hidden="true"
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-card)] border border-[var(--border)] rounded-card z-[200] overflow-hidden anim-fade-down"
          style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Email + badges (stacked vertically pour éviter le wrap) */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-sans font-semibold mb-1.5">
              Connecté en tant que
            </p>
            <p className="text-sm font-sans font-semibold text-[var(--text)] truncate mb-2">{email}</p>
            {(isAdmin || role === 'pro') && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {isAdmin && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                    Admin
                  </span>
                )}
                {role === 'pro' && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
                    Propriétaire
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Accès à la console d'administration — espace dédié et dissocié */}
          {isAdmin && (
            <div className="py-1 border-b border-[var(--border)]">
              <Link href="/admin/suivi" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Console Admin
              </Link>
            </div>
          )}

          {/* Liens selon le rôle */}
          <div className="py-1">
            {role === 'pro' && (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Tableau de bord
                </Link>
                <Link href="/mes-biens" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Mes annonces
                </Link>
                <Link href="/visites" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Visites
                </Link>
                <Link href="/messages" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Messages
                </Link>
                <Link href="/quittances" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Quittances
                </Link>
                <Link href="/profil" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profil & KYC
                </Link>
                <Link href="/biens" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors border-t border-[var(--border)] mt-1 pt-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Vue publique
                </Link>
              </>
            )}
            {role === 'client' && (
              <>
                <Link href="/biens" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Annonces
                </Link>
                <Link href="/favoris" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  Mes favoris
                </Link>
              </>
            )}
            {role === 'public' && (
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--accent-luxury)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--text-muted)]">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Mon espace
              </Link>
            )}
          </div>

          {/* Déconnexion */}
          <div className="border-t border-[var(--border)]">
            <button type="button" onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-red-500 hover:bg-red-500/10 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
