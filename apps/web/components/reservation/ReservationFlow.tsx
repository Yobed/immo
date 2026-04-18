'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { DatePicker }     from './DatePicker'
import { PaiementButton } from '@/components/paiements/PaiementButton'

type Step = 'dates' | 'recap' | 'paiement'

interface Props {
  bienId:        string
  bienTitre:     string
  prixMoisFcfa:  number
  prixNuitFcfa?: number   // défini → mode location à la nuitée
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
}

export function ReservationFlow({ bienId, bienTitre, prixMoisFcfa, prixNuitFcfa }: Props) {
  const isNuitee = prixNuitFcfa !== undefined && prixNuitFcfa > 0

  const [step,          setStep]          = useState<Step>('dates')
  const [dateDebut,     setDateDebut]     = useState('')
  const [dateFin,       setDateFin]       = useState('')
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)

  function handleDatesSelected(debut: string, fin: string) {
    setDateDebut(debut)
    setDateFin(fin)
    setStep('recap')
  }

  const nbNuits = dateDebut && dateFin
    ? Math.max(0, Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / 86400000))
    : 0

  const montantAffiche = isNuitee
    ? prixNuitFcfa! * nbNuits
    : prixMoisFcfa

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
        setError(data.error ?? 'Erreur lors de la création de la réservation')
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

  return (
    <div className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-6 shadow-sm">
      <h2 className="font-display text-xl text-primary mb-1">
        {isNuitee ? 'Réserver ce séjour' : 'Réserver ce bien'}
      </h2>
      {isNuitee && (
        <p className="text-sm text-muted font-sans mb-4">{formatFCFA(prixNuitFcfa!)} / nuit</p>
      )}

      {step === 'dates' && (
        <DatePicker onDatesSelected={handleDatesSelected} />
      )}

      {step === 'recap' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-btn p-4 space-y-2 text-sm font-sans">
            <div className="flex justify-between">
              <span className="text-muted">Bien</span>
              <span className="font-medium text-[var(--text)]">{bienTitre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Arrivée</span>
              <span className="font-medium text-[var(--text)]">{dateDebut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Départ</span>
              <span className="font-medium text-[var(--text)]">{dateFin}</span>
            </div>
            {isNuitee && (
              <div className="flex justify-between">
                <span className="text-muted">Durée</span>
                <span className="font-medium text-[var(--text)]">{nbNuits} nuit{nbNuits > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="border-t border-[var(--border)] pt-2 flex justify-between font-medium">
              <span className="text-[var(--text)]">
                {isNuitee ? `${formatFCFA(prixNuitFcfa!)} × ${nbNuits} nuit${nbNuits > 1 ? 's' : ''}` : 'Loyer mensuel'}
              </span>
              <span className="font-mono text-lg text-primary">{formatFCFA(montantAffiche)}</span>
            </div>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('dates'); setError(null) }}
              className="flex-1 border border-[var(--border)] text-[var(--text)] py-2 rounded-btn text-sm hover:bg-surface transition-colors"
            >
              Modifier les dates
            </button>
            <button
              onClick={handleConfirmerReservation}
              disabled={loading || (isNuitee && nbNuits === 0)}
              className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Confirmation…' : 'Confirmer la réservation'}
            </button>
          </div>
        </div>
      )}

      {step === 'paiement' && reservationId && (
        <div className="space-y-4">
          <div className="bg-accent-light rounded-btn p-3 text-accent text-sm font-sans">
            Réservation créée ! Finalisez par le paiement.
          </div>
          <PaiementButton
            reservationId={reservationId}
            montantFcfa={montantAffiche}
            description={`Réservation : ${bienTitre}`}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}
