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
          className="w-full flex items-center justify-center gap-1.5 min-h-[36px] px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Refuser
        </button>
      ) : (
        <div className="p-3 bg-[var(--surface-hover)] border border-rose-500/30 rounded-xl space-y-2.5 mt-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <MessageSquareQuote className="w-3 h-3 text-rose-400" /> Motif du refus
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setMotif('')
              }}
              className="text-[11px] text-[var(--text-subtle)] hover:text-rose-400 font-medium"
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
                  className="px-2 py-0.5 rounded-lg text-[10px] bg-[var(--surface-card)] border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-semibold transition-colors"
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
              className="w-full text-xs px-2.5 py-1.5 bg-[var(--surface-card)] border border-rose-500/40 rounded-xl focus:outline-none focus:border-rose-400 resize-none text-[var(--text)] placeholder:text-[var(--text-subtle)]"
            />
            <button
              type="submit"
              disabled={!motif.trim()}
              className="w-full flex items-center justify-center gap-1.5 min-h-[36px] px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
            >
              Confirmer le refus
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
