'use client'

import dynamic from 'next/dynamic'

// Next 15 : `ssr: false` avec next/dynamic est interdit dans un Server Component.
// Les graphiques recharts doivent rester client-only (évite le mismatch
// d'hydratation). On isole donc leurs imports dynamiques dans ce module client,
// importé par le dashboard (Server Component).
export const RevenueBarChart = dynamic(
  () => import('./RevenueBarChart').then((m) => m.RevenueBarChart),
  { ssr: false },
)

export const PaymentDonut = dynamic(
  () => import('./PaymentDonut').then((m) => m.PaymentDonut),
  { ssr: false },
)

export const ConversionFunnel = dynamic(
  () => import('./ConversionFunnel').then((m) => m.ConversionFunnel),
  { ssr: false },
)
