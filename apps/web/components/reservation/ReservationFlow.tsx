'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { DatePicker }     from './DatePicker'
import { PaiementButton } from '@/components/paiements/PaiementButton'

type Step = 'dates' | 'recap' | 'paiement'

interface Props {
  bienId:       string
  bienTitre:    string
  prixMoisFcfa: number
}

export function ReservationFlow({ bienId, bienTitre, prixMoisFcfa }: Props) {
  const [step,          setStep]          = useState<Step>('dates')
  const [dateDebut,     setDateDebut]     = useState('')
  const [dateFin,       setDateFin]       = useState('')
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)

  async function handleDatesSelected(debut: string, fin: string) {
    setDateDebut(debut)
    setDateFin(fin)
    setStep('recap')
  }

  async function handleConfirmerReservation() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/reservations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bienId, dateDebut, dateFin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la creation de la reservation')
        return
      }
      setReservationId(data.id)
      setStep('paiement')
    } catch {
      setError('Impossible de contacter le serveur')
    } finally {
      setLoading(false)
    }
  }

  const nbNuits = dateDebut && dateFin
    ? Math.max(0, Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000))
    : 0

  return (
    <div className="bg-surface-card rounded-card p-6 shadow-sm">
      <h2 className="font-display text-xl text-primary mb-4">Reserver ce bien</h2>

      {step === 'dates' && (
        <DatePicker onDatesSelected={handleDatesSelected} />
      )}

      {step === 'recap' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Bien : <span className="text-text font-medium">{bienTitre}</span></p>
          <p className="text-sm text-muted">Arrivee : <span className="text-text font-medium">{dateDebut}</span></p>
          <p className="text-sm text-muted">Depart : <span className="text-text font-medium">{dateFin}</span></p>
          <p className="text-sm text-muted">Duree : <span className="text-text font-medium">{nbNuits} nuit(s)</span></p>
          <p className="text-lg font-semibold font-mono text-primary">
            {prixMoisFcfa.toLocaleString('fr-FR')} FCFA / mois
          </p>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('dates'); setError(null) }}
              className="flex-1 border border-[var(--border)] text-text py-2 rounded-btn text-sm hover:bg-surface transition-colors"
            >
              Modifier les dates
            </button>
            <button
              onClick={handleConfirmerReservation}
              disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Confirmation...' : 'Confirmer la reservation'}
            </button>
          </div>
        </div>
      )}

      {step === 'paiement' && reservationId && (
        <div className="space-y-4">
          <div className="bg-accent-light rounded-btn p-3 text-accent text-sm">
            Reservation creee ! Finalisez par le paiement.
          </div>
          <PaiementButton
            reservationId={reservationId}
            montantFcfa={prixMoisFcfa}
            description={`Reservation : ${bienTitre}`}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}
