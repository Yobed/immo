'use client'
import { authFetch } from '@/lib/auth-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

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

      if (res.status === 401) {
        // Non authentifié : redirige vers login + retour vers cette page
        const redirect = typeof window !== 'undefined' ? window.location.pathname : '/'
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
        return
      }
      if (res.status === 429) {
        setError('Trop de réservations en peu de temps. Patientez quelques minutes.')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `Erreur (${res.status}) lors de la création de la réservation`)
        return
      }
      setReservationId(data.id)
      setStep('paiement')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de contacter le serveur')
    } finally {
      setLoading(false)
    }
  }

  // Tunnel en 3 étapes — explicité pour que le visiteur sache où il en est
  // et ce qu'il reste à faire (aucun indicateur auparavant).
  const STEPS = [
    { key: 'dates',    label: 'Vos dates',    hint: isNuitee ? 'Choisissez vos dates d’arrivée et de départ.' : 'Indiquez la période souhaitée.' },
    { key: 'recap',    label: 'Vérification', hint: 'Vérifiez votre demande avant de confirmer.' },
    { key: 'paiement', label: 'Paiement',     hint: 'Réglez en ligne pour bloquer la réservation.' },
  ] as const
  const currentIdx = Math.max(0, STEPS.findIndex(s => s.key === step))

  return (
    <div className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-6 shadow-sm">
      <h2 className="font-display text-xl text-primary mb-1">
        {isNuitee ? 'Réserver ce séjour' : 'Réserver ce bien'}
      </h2>
      {isNuitee && (
        <p className="text-sm text-muted font-sans mb-3">{formatFCFA(prixNuitFcfa!)} / nuit</p>
      )}

      {/* Indicateur d'étape — numéro + barre de progression + intitulé */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
          Étape {currentIdx + 1}/3 · {STEPS[currentIdx].label}
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? 'bg-primary' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted font-sans mt-2">{STEPS[currentIdx].hint}</p>
      </div>

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

          <p className="text-xs text-muted font-sans leading-relaxed">
            En confirmant, votre demande part à notre équipe qui vérifie la disponibilité avec le propriétaire.
            Le paiement se fait juste après (Wave, Orange Money, carte). Caution et charges éventuelles sont
            vues directement avec votre conseiller — rien d’autre n’est prélevé ici.
          </p>

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
            Réservation créée ! Dernière étape : le paiement ci-dessous bloque votre réservation.
          </div>
          <PaiementButton
            reservationId={reservationId}
            montantFcfa={montantAffiche}
            description={`Réservation : ${bienTitre}`}
            className="w-full"
          />
          <p className="text-xs text-muted font-sans leading-relaxed text-center">
            Paiement sécurisé. Un conseiller vous recontacte pour la suite (visite, contrat, remise des clés).
          </p>
        </div>
      )}
    </div>
  )
}
