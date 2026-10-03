import { redirect } from 'next/navigation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/admin/prospects?id=${encodeURIComponent(id)}`)
}
