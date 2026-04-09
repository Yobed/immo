'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  email: string
  role?: 'pro' | 'client' | 'public'
}

export function UserMenu({ email, role = 'public' }: UserMenuProps) {
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
        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[var(--border)] rounded-card shadow-xl z-[200] overflow-hidden">
          {/* Email */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
            <p className="text-xs text-muted font-sans">Connecté en tant que</p>
            <p className="text-sm font-sans font-medium text-[var(--text)] truncate mt-0.5">{email}</p>
          </div>

          {/* Liens selon le rôle */}
          {role === 'pro' && (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
                🏠 Tableau de bord
              </Link>
              <Link href="/profil" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
                👤 Mon profil
              </Link>
            </>
          )}
          {role === 'client' && (
            <>
              <Link href="/biens" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
                🏠 Annonces
              </Link>
              <Link href="/favoris" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
                ❤️ Mes favoris
              </Link>
            </>
          )}
          {role === 'public' && (
            <Link href="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-[var(--text)] hover:bg-[var(--surface)] transition-colors">
              🏠 Mon espace
            </Link>
          )}

          {/* Déconnexion */}
          <div className="border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-danger hover:bg-danger/5 transition-colors"
            >
              🚪 Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
