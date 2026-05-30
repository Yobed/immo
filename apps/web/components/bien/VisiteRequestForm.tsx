'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { CheckCircle2, Calendar, Clock, MessageSquare } from 'lucide-react'

interface VisiteRequestFormProps {
  bienId: string
  proprietaireId: string
  isPremium?: boolean
  onSuccess?: () => void
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

export function VisiteRequestForm({ bienId, proprietaireId, isPremium = false, onSuccess }: VisiteRequestFormProps) {
  const [date, setDate] = useState('')
  const [creneau, setCreneau] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

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
      onSuccess?.()
    } else if (res.status === 401) {
      router.push('/login')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="p-10 rounded-[2.5rem] text-center bg-[var(--surface-card)] border border-[var(--border)] shadow-[var(--shadow-premium)] my-4">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-2xl font-black text-[var(--text)] tracking-tight mb-3">Demande transmise !</h3>
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-[240px] mx-auto font-medium">
          Un conseiller BOGBE'S GROUPE ou le propriétaire reviendra vers vous pour valider le créneau.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${isPremium ? 'p-1' : 'p-2 py-4'}`}>
      <div className="space-y-6">
        {/* Date Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Calendar className="w-4 h-4 text-[var(--accent-luxury)]" />
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em]">
              Date de visite
            </label>
          </div>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full h-16 px-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-base font-bold focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all"
          />
        </div>

        {/* Time Slots Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Clock className="w-4 h-4 text-[var(--accent-luxury)]" />
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em]">
              Créneau horaire
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {CRENEAUX.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCreneau(c)}
                className={`h-14 rounded-xl text-[11px] border transition-all duration-300 font-black tracking-tight active:scale-[0.97] ${
                  creneau === c
                    ? 'border-[var(--accent-luxury)] bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-[0_8px_20px_var(--accent-glow)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-card)] hover:border-accent-luxury/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Message Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <MessageSquare className="w-4 h-4 text-[var(--accent-luxury)]" />
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.25em]">
              Message particulier
            </label>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Ex: Je souhaite venir avec mon architecte..."
            className="w-full px-6 py-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[var(--accent-glow)] focus:border-[var(--accent-luxury)] transition-all resize-none placeholder:text-[var(--text-subtle)]"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={submitting || !date || !creneau} 
        className="w-full h-16 bg-[var(--accent-luxury)] hover:bg-accent-luxury/90 text-[var(--on-accent)] font-black uppercase tracking-[0.25em] text-[12px] rounded-2xl shadow-[0_15px_35px_var(--accent-glow)] transition-all active:scale-[0.98] mt-4 border border-white/20 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        {submitting ? 'Traitement...' : 'Confirmer la visite'}
      </Button>

      <p className="text-[10px] text-[var(--text-subtle)] text-center font-medium leading-relaxed px-4">
        En confirmant, vous acceptez d&apos;être recontacté par nos services pour la finalisation de votre demande.
      </p>
    </form>
  )
}
