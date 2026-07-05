import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSeoCommune, communePageMeta } from '@/lib/seo/communes'
import { CommuneLanding } from '@/components/seo/CommuneLanding'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ commune: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { commune } = await params
  const c = getSeoCommune(commune)
  // notFound() ici (et pas seulement dans la page) : generateMetadata s'exécute
  // avant le streaming du loading.tsx → l'HTTP 404 est réellement envoyé.
  if (!c) notFound()
  return communePageMeta('vente', c)
}

export default async function VenteCommunePage({ params }: Props) {
  const { commune } = await params
  const c = getSeoCommune(commune)
  if (!c) notFound()
  return <CommuneLanding offre="vente" commune={c} />
}
