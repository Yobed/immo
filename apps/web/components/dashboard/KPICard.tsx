'use client'
import { Card, Metric, Text, BadgeDelta } from '@tremor/react'

export interface KPICardProps {
  titre:       string
  valeur:      string      // Pre-formate (ex: "1 250 000 FCFA", "73%", "3")
  sous_titre?: string
  variation?:  number      // % changement vs periode precedente (positif = hausse)
  alerte?:     boolean     // Afficher badge rouge si true
}

export function KPICard({ titre, valeur, sous_titre, variation, alerte }: KPICardProps) {
  const deltaType = variation === undefined ? undefined
    : variation > 0  ? 'increase'
    : variation < 0  ? 'decrease'
    : 'unchanged'

  return (
    <Card className="rounded-card shadow-sm">
      <Text className="text-muted text-sm">{titre}</Text>
      <Metric className={`font-mono mt-1 ${alerte ? 'text-danger' : 'text-primary'}`}>
        {valeur}
        {alerte && <span className="ml-2 text-xs bg-danger text-white px-2 py-0.5 rounded-pill font-sans">!</span>}
      </Metric>
      {(sous_titre || variation !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {sous_titre && <Text className="text-muted text-xs">{sous_titre}</Text>}
          {deltaType && variation !== undefined && (
            <BadgeDelta deltaType={deltaType} size="xs">
              {Math.abs(variation).toFixed(1)}%
            </BadgeDelta>
          )}
        </div>
      )}
    </Card>
  )
}
