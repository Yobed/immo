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
    const { error: err } = await supabase
      .from('profiles')
      .update({ nom_complet: nom.trim(), telephone: telephone.trim() })
      .eq('id', userId)

    if (err) {
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.')
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
            className="px-4 py-2 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 hover:text-primary transition-colors"
          >
            ✏️ Modifier
          </button>
          {success && <span className="text-sm text-accent font-sans">✓ Profil mis à jour</span>}
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
