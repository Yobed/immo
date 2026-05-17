'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export interface RevenueData {
  mois:  string   // ex: "Jan", "Fev"
  total: number   // FCFA
}

export function RevenueBarChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-card p-4 shadow-sm">
      <h3 className="text-sm font-medium text-[var(--text)] mb-4">Revenus des 12 derniers mois</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${((v as number) / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: unknown) => [`${(v as number).toLocaleString('fr-FR')} FCFA`, 'Revenus']}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-card)', color: 'var(--text)', fontSize: 12 }}
          />
          <Bar dataKey="total" fill="var(--accent-luxury)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
