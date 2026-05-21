'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Agence } from '@/lib/agences/types'

interface AgenceEditFormProps {
  agence: Agence
}

export function AgenceEditForm({ agence }: AgenceEditFormProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [nom, setNom] = useState(agence.nom_commercial)
  const [description, setDescription] = useState(agence.description ?? '')
  const [telephone, setTelephone] = useState(agence.telephone_public ?? '')
  const [email, setEmail] = useState(agence.email_public ?? '')
  const [rccm, setRccm] = useState(agence.rccm ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/agences/${agence.id}`, {
      method: 'PATCH',
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
      setError(json?.error ?? 'Erreur sauvegarde')
      setLoading(false)
      return
    }
    setSuccess(true)
    setEditing(false)
    setLoading(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <Row label="Nom commercial" value={nom} />
        <Row label="Slug public" value={`/agences/${agence.slug}`} mono />
        <Row label="Description" value={description || '—'} />
        <Row label="Téléphone public" value={telephone || '—'} />
        <Row label="Email public" value={email || '—'} />
        <Row label="RCCM" value={rccm || '—'} />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-[var(--border)] font-sans text-sm text-[var(--text)] hover:border-primary/40 hover:text-primary transition-colors"
          >
            Modifier
          </button>
          {success && (
            <span className="text-sm text-accent font-sans">Profil agence mis à jour</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger/5 border border-danger/20 text-danger px-3 py-2 rounded-card text-sm font-sans">
          {error}
        </div>
      )}

      <Field label="Nom commercial *">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Téléphone public">
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </Field>
        <Field label="Email public">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </Field>
      </div>

      <Field label="RCCM">
        <input
          type="text"
          value={rccm}
          onChange={(e) => setRccm(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-btn text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </Field>

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
          onClick={() => {
            setEditing(false)
            setNom(agence.nom_commercial)
            setDescription(agence.description ?? '')
            setTelephone(agence.telephone_public ?? '')
            setEmail(agence.email_public ?? '')
            setRccm(agence.rccm ?? '')
          }}
          className="px-4 py-2 rounded-btn border border-[var(--border)] font-sans text-sm text-muted hover:border-primary/40 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-sans text-sm text-[var(--text)] ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-sans text-muted uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}
