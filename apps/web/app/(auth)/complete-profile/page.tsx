'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'locataire' | 'proprietaire'>('locataire')
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
    window.location.href = role === 'proprietaire' ? '/dashboard' : '/'
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
        <h1 className="text-3xl font-bold text-primary font-display">Immo CI</h1>
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
          <div className="grid grid-cols-2 gap-3">
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
                <div className="text-2xl mb-1">🏠</div>
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
                <div className="text-2xl mb-1">🔑</div>
                <span className="text-sm font-medium text-[var(--text)]">Propriétaire</span>
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
