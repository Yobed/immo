'use client'
import { ProgressBar, Text } from '@tremor/react'

export interface OccupancyData {
  label:       string   // ex: "Villa Cocody"
  taux:        number   // 0-100
  statut:      string   // ex: "Loue" | "Disponible"
}

export function OccupancyGauge({ biens }: { biens: OccupancyData[] }) {
  const tauxGlobal = biens.length > 0
    ? Math.round(biens.filter(b => b.taux === 100).length / biens.length * 100)
    : 0

  return (
    <div className="bg-surface-card rounded-card p-4 shadow-sm">
      <h3 className="text-sm font-medium text-text mb-1">Taux d&apos;occupation</h3>
      <p className="font-mono text-2xl font-bold text-primary mb-3">{tauxGlobal}%</p>
      <div className="space-y-3">
        {biens.map((b, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <Text className="text-xs text-text truncate max-w-[60%]">{b.label}</Text>
              <Text className="text-xs text-muted">{b.statut}</Text>
            </div>
            <ProgressBar
              value={b.taux}
              color={b.taux === 100 ? 'emerald' : 'blue'}
              className="h-2"
            />
          </div>
        ))}
        {biens.length === 0 && (
          <Text className="text-muted text-sm">Aucun bien actif</Text>
        )}
      </div>
    </div>
  )
}
