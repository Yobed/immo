'use client'

import { useState } from 'react'
import { X, MessageSquareQuote } from 'lucide-react'

interface ValidationRefusalFormProps {
  bienId: string
  action: (formData: FormData) => Promise<void>
}

const PRESET_MOTIFS = [
  { label: 'Photos floues/manquantes', text: 'Photos insuffisantes ou de mauvaise qualité. Merci de fournir au moins 3 photos nettes et lumineuses du bien.' },
  { label: 'Prix anormal', text: 'Prix non conforme au marché ou montant manifestement erroné. Merci de vérifier le tarif.' },
  { label: 'Localisation imprécise', text: 'Commune ou quartier imprécis. Merci de renseigner la localisation exacte du bien.' },
  { label: 'Bien déjà indisponible', text: 'Ce bien semble déjà loué ou vendu selon nos informations. Merci de mettre à jour sa disponibilité.' },
  { label: 'Description incomplète', text: 'Description trop succincte. Merci de préciser le nombre de pièces et les commodités.' },
]

export function ValidationRefusalForm({ bienId, action }: ValidationRefusalFormProps) {
  const [motif, setMotif] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Refuser
        </button>
      ) : (
        <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-2.5 mt-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-900 flex items-center gap-1">
              <MessageSquareQuote className="w-3 h-3 text-red-600" /> Motif du refus
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setMotif('')
              }}
              className="text-[11px] text-[var(--text-subtle)] hover:text-red-700 font-medium"
            >
              Annuler
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Motifs rapides (1 clic) :</p>
            <div className="flex flex-wrap gap-1">
              {PRESET_MOTIFS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMotif(preset.text)}
                  className="px-2 py-0.5 rounded text-[10px] bg-white border border-red-200 text-red-800 hover:bg-red-100 font-semibold transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          <form action={action} className="space-y-2">
            <input type="hidden" name="bienId" value={bienId} />
            <textarea
              name="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              required
              rows={2}
              placeholder="Motif communiqué au propriétaire…"
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-red-300 rounded-lg focus:outline-none focus:border-red-500 resize-none text-[var(--text)]"
            />
            <button
              type="submit"
              disabled={!motif.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Confirmer le refus
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
