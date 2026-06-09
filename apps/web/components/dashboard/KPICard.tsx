'use client'
import { Card, Metric, Text, BadgeDelta } from '@tremor/react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface KPICardProps {
  titre:       string
  valeur:      string      // Pre-formate (ex: "1 250 000 FCFA", "73%", "3")
  sous_titre?: string
  variation?:  number      // % changement vs periode precedente (positif = hausse)
  alerte?:     boolean     // Afficher badge rouge si true
  /**
   * Si fourni, la carte devient cliquable et navigue vers cette route.
   * Idéal pour les KPI actionnables (réservations en attente, messages non lus, etc.).
   */
  href?:       string
}

export function KPICard({ titre, valeur, sous_titre, variation, alerte, href }: KPICardProps) {
  const deltaType = variation === undefined ? undefined
    : variation > 0  ? 'increase'
    : variation < 0  ? 'decrease'
    : 'unchanged'

  const inner = (
    <Card className={`rounded-card shadow-sm !bg-[var(--surface)] !border-[var(--border)] ${
      href ? 'hover:!border-accent-luxury/40 hover:shadow-md transition-all cursor-pointer group' : ''
    }`}>
      <div className="flex items-start justify-between gap-2">
        <Text className="!text-[var(--text-muted)] text-sm">{titre}</Text>
        {href && (
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
        )}
      </div>
      <Metric className={`font-mono mt-1 ${alerte ? '!text-red-500' : '!text-[var(--text)]'}`}>
        {valeur}
        {alerte && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-pill font-sans">!</span>}
      </Metric>
      {(sous_titre || variation !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {sous_titre && <Text className="!text-[var(--text-muted)] text-xs">{sous_titre}</Text>}
          {deltaType && variation !== undefined && (
            <BadgeDelta deltaType={deltaType} size="xs">
              {Math.abs(variation).toFixed(1)}%
            </BadgeDelta>
          )}
        </div>
      )}
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}
