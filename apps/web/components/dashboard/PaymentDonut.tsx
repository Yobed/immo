'use client'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export interface PaymentMethodData {
  methode: string   // 'wave' | 'orange_money' | 'mtn' | 'moov' | 'carte_bancaire'
  total:   number
  count:   number
}

const METHODE_LABELS: Record<string, string> = {
  wave:           'Wave',
  orange_money:   'Orange Money',
  mtn:            'MTN',
  moov:           'Moov',
  carte_bancaire: 'Carte bancaire',
}

const COULEURS = ['#1A5276', '#E67E22', '#27AE60', '#8E44AD', '#E74C3C']

export function PaymentDonut({ data }: { data: PaymentMethodData[] }) {
  const chartData = data.map(d => ({
    name:  METHODE_LABELS[d.methode] ?? d.methode,
    value: d.total,
  }))

  return (
    <div className="bg-surface-card rounded-card p-4 shadow-sm">
      <h3 className="text-sm font-medium text-text mb-4">Repartition des paiements</h3>
      {chartData.length === 0 ? (
        <p className="text-muted text-sm py-8 text-center">Aucun paiement ce mois</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_entry, i) => (
                <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: unknown) => `${(v as number).toLocaleString('fr-FR')} FCFA`}
              contentStyle={{ borderRadius: '8px', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
