'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

interface VisiteRequestFormProps {
  bienId: string
  proprietaireId: string
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

export function VisiteRequestForm({ bienId, proprietaireId }: VisiteRequestFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-card border border-[var(--border)] p-5">
      <h3 className="font-display text-lg text-[var(--text)]">Demander une visite</h3>

      <Input
        label="Date souhaitée"
        type="date"
        min={minDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Créneau horaire</label>
        <div className="grid grid-cols-2 gap-2">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCreneau(c)}
              className={`px-3 py-2 rounded-btn text-xs font-sans border transition-colors ${
                creneau === c
                  ? 'border-primary bg-primary-light text-primary font-medium'
                  : 'border-[var(--border)] text-muted hover:border-primary/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Message (optionnel)
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Informations complémentaires pour le propriétaire..."
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Button type="submit" className="w-full" loading={submitting} disabled={!date || !creneau}>
        Envoyer la demande
      </Button>
    </form>
  )
}
