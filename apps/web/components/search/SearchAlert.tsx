'use client'

import { Bell } from 'lucide-react'

interface SearchAlertProps {
  commune?: string
  typeBien?: string
  prixMax?: string
}

function buildCriteria(commune?: string, typeBien?: string, prixMax?: string): string {
  const parts: string[] = []
  if (typeBien) parts.push(typeBien.replace(/_/g, ' '))
  if (commune) parts.push(`à ${commune}`)
  if (prixMax) parts.push(`budget max ${Number(prixMax).toLocaleString('fr-FR')} FCFA`)
  return parts.length > 0 ? parts.join(', ') : 'nouveaux biens disponibles'
}

export function SearchAlert({ commune, typeBien, prixMax }: SearchAlertProps) {
  const criteria = buildCriteria(commune, typeBien, prixMax)

  const message = encodeURIComponent(
    `Bonjour, je souhaite recevoir des alertes WhatsApp pour : ${criteria}. Merci de m'ajouter à la liste.`
  )
  const href = `https://wa.me/2250544872051?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/6 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-[11px] font-semibold active:scale-95 group"
      aria-label="Recevoir des alertes WhatsApp pour cette recherche"
    >
      <Bell className="w-3.5 h-3.5 text-[var(--accent-luxury)] group-hover:scale-110 transition-transform duration-200 shrink-0" aria-hidden="true" />
      <span>Recevoir des alertes pour cette recherche</span>
    </a>
  )
}
