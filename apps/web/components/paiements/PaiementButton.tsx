'use client'
import { useState } from 'react'

interface Props {
  reservationId: string
  montantFcfa:   number
  description:   string
  className?:    string
}

export function PaiementButton({ reservationId, montantFcfa, description, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/paiements/initier', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reservationId, montantFcfa, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'initiation du paiement')
        return
      }
      window.location.href = data.paymentUrl
    } catch {
      setError('Impossible de contacter le serveur de paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className={`bg-secondary text-white px-6 py-3 rounded-btn font-medium hover:opacity-90 disabled:opacity-50 transition-opacity ${className ?? ''}`}
      >
        {loading ? 'Redirection...' : `Payer ${montantFcfa.toLocaleString('fr-FR')} FCFA`}
      </button>
      {error && <p className="text-danger text-sm mt-2">{error}</p>}
    </div>
  )
}
