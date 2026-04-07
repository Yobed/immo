'use client'
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface FunnelData {
  vues:         number
  contacts:     number
  visites:      number
  reservations: number
  signatures:   number
}

const FUNNEL_COLORS = ['#1A5276', '#2980B9', '#3498DB', '#E67E22', '#27AE60']

export function ConversionFunnel({ data }: { data: FunnelData }) {
  const chartData = [
    { name: 'Vues',         value: data.vues },
    { name: 'Contacts',     value: data.contacts },
    { name: 'Visites',      value: data.visites },
    { name: 'Reservations', value: data.reservations },
    { name: 'Signatures',   value: data.signatures },
  ]

  return (
    <div className="bg-surface-card rounded-card p-4 shadow-sm">
      <h3 className="text-sm font-medium text-text mb-4">Funnel de conversion</h3>
      <ResponsiveContainer width="100%" height={220}>
        <FunnelChart>
          <Tooltip
            formatter={(v: unknown) => [(v as number).toLocaleString('fr-FR'), '']}
            contentStyle={{ borderRadius: '8px', fontSize: 12 }}
          />
          <Funnel dataKey="value" data={chartData} isAnimationActive>
            {chartData.map((_entry, i) => (
              <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
            ))}
            <LabelList position="right" fill="#1C2833" stroke="none" dataKey="name" style={{ fontSize: 11 }} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
