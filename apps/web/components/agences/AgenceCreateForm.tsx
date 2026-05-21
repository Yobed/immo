'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AgenceCreateForm() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [rccm, setRccm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/agences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom_commercial: nom,
        description,
        telephone_public: telephone,
        email_public: email,
        rccm,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? 'Erreur création')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger px-3 py-2 rounded-card text-sm font-sans">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">
          Nom commercial *
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          placeholder="Ex : Ivoire Immo SARL"
        />
      </div>

      <div>
        <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">
          Description courte
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          placeholder="Votre spécialité, vos zones, votre histoire..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">
            Téléphone public
          </label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="+225 07 00 00 00 00"
          />
        </div>
        <div>
          <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">
            Email public
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            placeholder="contact@agence.ci"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">
          Registre du Commerce (RCCM)
        </label>
        <input
          type="text"
          value={rccm}
          onChange={(e) => setRccm(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          placeholder="CI-ABJ-2024-B-12345"
        />
        <p className="text-xs text-muted font-sans mt-1">
          Nécessaire pour la validation KYC de l&apos;agence (vérification manuelle par notre équipe).
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || nom.trim().length < 2}
        className="w-full sm:w-auto px-5 py-2.5 rounded-btn bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? 'Création...' : 'Créer mon agence'}
      </button>
    </form>
  )
}
