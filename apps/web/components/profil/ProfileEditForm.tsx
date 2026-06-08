'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileEditFormProps {
  initialNom: string
  initialTelephone: string
  userId: string
}

export function ProfileEditForm({ initialNom, initialTelephone, userId }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [nom, setNom] = useState(initialNom)
  const [telephone, setTelephone] = useState(initialTelephone)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    // ⚠️ La colonne en base s'appelle `phone` (pas `telephone`).
    // Bug historique : utiliser le mauvais nom de colonne renvoie une erreur
    // PostgreSQL "column does not exist" → affichait juste un message générique.
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: nom.trim(), phone: telephone.trim() })
      .eq('id', userId)

    if (err) {
      // Expose le vrai message d'erreur pour débugger plus vite côté utilisateur
      setError(`Erreur : ${err.message}`)
    } else {
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">Nom complet</label>
          <p className="font-sans text-[var(--text)]">{nom || '—'}</p>
        </div>
        <div>
          <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">Téléphone</label>
          <p className="font-sans text-[var(--text)]">{telephone || '—'}</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Modifier
          </button>
          {success && <span className="text-sm text-accent font-sans flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Profil mis à jour
          </span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger px-3 py-2 rounded-card text-sm font-sans">
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">Nom complet</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          placeholder="Votre nom complet"
        />
      </div>
      <div>
        <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">Téléphone</label>
        <input
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          placeholder="+225 07 00 00 00 00"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 rounded-btn bg-primary text-white font-sans text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setNom(initialNom); setTelephone(initialTelephone) }}
          className="px-4 py-2 rounded-btn border border-[var(--border)] font-sans text-sm text-muted hover:border-primary/40 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
