'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

interface VisiteRequestFormProps {
  bienId: string
  proprietaireId: string
  isPremium?: boolean
}

const CRENEAUX = [
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
]

export function VisiteRequestForm({ bienId, proprietaireId, isPremium = false }: VisiteRequestFormProps) {
  const [date, setDate] = useState('')
  const [creneau, setCreneau] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Date minimum: demain
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !creneau) return

    setSubmitting(true)
    const res = await authFetch('/api/visites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bien_id: bienId, proprietaire_id: proprietaireId, date_souhaitee: date, creneau, message }),
    })

    if (res.ok) {
      setSuccess(true)
    } else if (res.status === 401) {
      router.push('/login')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="p-4 bg-accent-light rounded-card border border-accent/20 text-center">
        <p className="text-accent font-sans font-medium">Demande de visite envoyée !</p>
        <p className="text-sm text-muted mt-1">Le propriétaire vous contactera pour confirmer.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-card p-5 ${
        isPremium
          ? 'bg-[var(--midnight-muted)] border border-[var(--border)] text-[var(--text)]'
          : 'bg-[var(--surface-card)] border border-[var(--border)]'
      }`}
    >
      <h3
        className={`font-display text-lg ${
          isPremium ? 'text-[var(--text)]' : 'text-[var(--text)]'
        }`}
      >
        Demander une visite
      </h3>

      <Input
        label="Date souhaitée"
        type="date"
        min={minDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className={isPremium ? 'bg-[var(--text)]/5 border-[var(--text)]/10 text-[var(--text)]' : ''}
      />

      <div>
        <label
          className={`block text-sm font-sans font-medium mb-2 ${
            isPremium ? 'text-[var(--text)]/70' : 'text-[var(--text)]'
          }`}
        >
          Créneau horaire
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCreneau(c)}
              className={`px-3 py-2 rounded-btn text-xs font-sans border transition-all ${
                creneau === c
                  ? isPremium
                    ? 'border-[var(--accent-luxury)] bg-[var(--accent-luxury)]/20 text-[var(--accent-luxury)] font-bold'
                    : 'border-primary bg-primary-light text-primary font-medium'
                  : isPremium
                    ? 'border-[var(--text)]/10 text-[var(--text)]/50 hover:border-[var(--text)]/30'
                    : 'border-[var(--border)] text-muted hover:border-primary/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          className={`block text-sm font-sans font-medium mb-2 ${
            isPremium ? 'text-[var(--text)]/70' : 'text-[var(--text)]'
          }`}
        >
          Message (optionnel)
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Informations complémentaires pour le propriétaire..."
          className={`w-full rounded-btn px-3 py-2 text-sm font-sans resize-none focus:outline-none focus:ring-2 ${
            isPremium
              ? 'bg-[var(--text)]/5 border-[var(--text)]/10 text-[var(--text)] focus:ring-[var(--text)]/20'
              : 'bg-[var(--surface-card)] border border-[var(--border)] focus:ring-primary/30'
          }`}
        />
      </div>

      <Button
        type="submit"
        className={`w-full ${isPremium ? 'bg-[var(--accent-luxury)] text-[var(--midnight)] hover:bg-[var(--accent-luxury)]/90 shadow-lg shadow-[var(--accent-luxury)]/20' : ''}`}
        loading={submitting}
        disabled={!date || !creneau}
      >
        Envoyer la demande
      </Button>
    </form>
  )
}
