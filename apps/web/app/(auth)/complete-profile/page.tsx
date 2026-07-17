'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'visiteur' | 'locataire' | 'proprietaire' | 'agence'>('visiteur')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      // Pré-remplir nom depuis Google
      const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
      setFullName(googleName)
      setChecking(false)
    }
    init()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Veuillez saisir votre nom complet.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/complete-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), role }),
    })

    if (!res.ok) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
      return
    }

    // Rediriger selon le rôle choisi
    window.location.href = (role === 'proprietaire' || role === 'agence') ? '/dashboard' : '/'
  }

  if (checking) {
    return (
      <div className="max-w-md w-full flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary font-display">BOGBE'S GROUPE</h1>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">
          Compléter votre profil
        </h2>
        <p className="mt-2 text-sm text-muted">
          Dernière étape avant d&apos;accéder à votre espace
        </p>
      </div>

      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger px-4 py-3 rounded-card text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom complet */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-[var(--text)] mb-1">
            Nom complet
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
            placeholder="Kouassi Jean-Baptiste"
            required
          />
        </div>

        {/* Sélection rôle */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Je suis un(e)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setRole('visiteur')}
              className={`flex items-center justify-center p-4 border-2 rounded-card transition-colors ${
                role === 'visiteur'
                  ? 'border-primary bg-primary/5'
                  : 'border-[var(--border)] hover:border-primary/40'
              }`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">Visiteur</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('locataire')}
              className={`flex items-center justify-center p-4 border-2 rounded-card transition-colors ${
                role === 'locataire'
                  ? 'border-primary bg-primary/5'
                  : 'border-[var(--border)] hover:border-primary/40'
              }`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                    <path d="M9 21V12h6v9"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">Locataire</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('proprietaire')}
              className={`flex items-center justify-center p-4 border-2 rounded-card transition-colors ${
                role === 'proprietaire'
                  ? 'border-primary bg-primary/5'
                  : 'border-[var(--border)] hover:border-primary/40'
              }`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="7.5" cy="15.5" r="5.5"/>
                    <path d="M10.5 12.5 L19 4"/>
                    <path d="M19 4 l2 2"/>
                    <path d="M17 6 l2 2"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">Propriétaire</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('agence')}
              className={`flex items-center justify-center p-4 border-2 rounded-card transition-colors ${
                role === 'agence'
                  ? 'border-primary bg-primary/5'
                  : 'border-[var(--border)] hover:border-primary/40'
              }`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <line x1="9" y1="22" x2="9" y2="16"/>
                    <line x1="15" y1="22" x2="15" y2="16"/>
                    <line x1="9" y1="16" x2="15" y2="16"/>
                    <path d="M8 6h.01"/>
                    <path d="M16 6h.01"/>
                    <path d="M8 10h.01"/>
                    <path d="M16 10h.01"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">Agence</span>
              </div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Continuer'}
        </button>
      </form>
    </div>
  )
}
