import { createAdminClient } from '@/lib/supabase/admin'
import { ProspectsMasterDetail, type ProspectRow } from '@/components/admin/ProspectsMasterDetail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function AdminProspectsPage({ searchParams }: PageProps) {
  const { id: initialSelectedId } = await searchParams
  const admin = createAdminClient()

  // Requêtes serveur parallèles ultra-rapides
  const countOf = async (s?: string | string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c = (admin as any).from('prospects').select('id', { count: 'exact', head: true }).is('merged_into', null)
    if (Array.isArray(s)) c = c.in('statut', s)
    else if (s) c = c.eq('statut', s)
    return (await c).count ?? 0
  }

  const [
    { data: rowsData },
    { data: assigneeRows },
    totalCount,
    nNouveau,
    nContacte,
    nVisite,
    nRelance,
    nGagne,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('prospects')
      .select('*')
      .is('merged_into', null)
      .order('last_seen', { ascending: false })
      .limit(500),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('profiles')
      .select('id, full_name')
      .not('full_name', 'is', null)
      .order('full_name', { ascending: true })
      .limit(100),
    countOf(),
    countOf('nouveau'),
    countOf(['contacte', 'en_cours']),
    countOf(['visite_planifiee', 'visite_realisee', 'rdv']),
    countOf('relance'),
    countOf('gagne'),
  ])

  const rows = (rowsData ?? []) as ProspectRow[]
  const assignees = (assigneeRows ?? []) as { id: string; full_name: string | null }[]

  const statusCounts = {
    nouveau: nNouveau,
    contacte: nContacte,
    visite: nVisite,
    relance: nRelance,
    gagne: nGagne,
  }

  return (
    <ProspectsMasterDetail
      initialRows={rows}
      assignees={assignees}
      totalCount={totalCount}
      statusCounts={statusCounts}
      initialSelectedId={initialSelectedId}
    />
  )
}
