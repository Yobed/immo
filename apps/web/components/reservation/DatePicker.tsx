'use client'
import { useState } from 'react'

interface Props {
  onDatesSelected: (dateDebut: string, dateFin: string) => void
  minDate?: string   // ISO date string
}

export function DatePicker({ onDatesSelected, minDate }: Props) {
  const today   = minDate ?? new Date().toISOString().split('T')[0]
  const [debut, setDebut] = useState('')
  const [fin,   setFin]   = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (!debut || !fin) { setError('Veuillez selectionner les deux dates'); return }
    if (fin <= debut)   { setError('La date de fin doit etre apres la date de debut'); return }
    setError('')
    onDatesSelected(debut, fin)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">Date d&apos;arrivee</label>
          <input
            type="date"
            min={today}
            value={debut}
            onChange={e => setDebut(e.target.value)}
            className="w-full border border-[var(--border)] rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1">Date de depart</label>
          <input
            type="date"
            min={debut || today}
            value={fin}
            onChange={e => setFin(e.target.value)}
            className="w-full border border-[var(--border)] rounded-btn px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        onClick={handleConfirm}
        className="w-full bg-primary text-white py-2 rounded-btn font-medium hover:opacity-90 transition-opacity"
      >
        Confirmer les dates
      </button>
    </div>
  )
}
