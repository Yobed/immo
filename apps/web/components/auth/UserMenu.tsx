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
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const initial = email.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-display font-bold text-sm hover:bg-[var(--primary)]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-card)] border border-[var(--border)] rounded-card z-[200] overflow-hidden anim-fade-down"
          style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Email */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between mb-1 gap-2">
              <p className="text-xs text-[var(--text-muted)] font-sans">Connecté en tant que</p>
              <div className="flex items-center gap-1">
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
            </div>
            <p className="text-sm font-sans font-semibold text-[var(--text)] truncate">{email}</p>
          </div>

          {/* Liens admin (visibles uniquement pour admins) */}
          {isAdmin && (
            <div className="py-1 border-b border-[var(--border)]">
              <Link href="/admin/suivi" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans font-semibold text-red-700 hover:bg-red-50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Suivi & Intermédiation
              </Link>
              <Link href="/admin/moderation" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans font-semibold text-red-700 hover:bg-red-50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Modération
              </Link>
            </div>
          )}

          {/* Liens selon le rôle */}
          <div className="py-1">
            {role === 'pro' && (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Tableau de bord
                </Link>
                <Link href="/mes-biens" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Mes annonces
                </Link>
                <Link href="/profil" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Mon profil
                </Link>
              </>
            )}
            {role === 'client' && (
              <>
                <Link href="/biens" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Annonces
                </Link>
                <Link href="/favoris" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  Mes favoris
                </Link>
              </>
            )}
            {role === 'public' && (
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] hover:text-[var(--primary)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-[var(--primary)]/50">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Mon espace
              </Link>
            )}
          </div>

          {/* Déconnexion */}
          <div className="border-t border-[var(--border)]">
            <button type="button" onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors">
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
