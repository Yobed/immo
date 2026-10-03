import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'
import { callCrmRpc } from '@/lib/crm/rpc'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const admin = createAdminClient()

  const [
    { data: p },
    { count: contactCount },
    { count: visiteCount },
    { count: reservationCount },
    timelineResult,
    visitesResult,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('prospects').select('*').eq('id', id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('contact_requests').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('visites').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('reservations').select('id', { count: 'exact', head: true }).eq('prospect_id', id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('crm_prospect_timeline', { p_id: id, p_limit: 30 }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('visites')
      .select(`
        id, date_souhaitee, heure_debut, heure_fin, statut, notes,
        biens ( id, titre, type_bien, commune, quartier, prix_mois_fcfa, prix_vente_fcfa )
      `)
      .eq('prospect_id', id)
      .order('date_souhaitee', { ascending: false }),
  ])

  if (!p) return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })

  // Messages WhatsApp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let msgQuery = (admin as any)
    .from('whatsapp_messages')
    .select('direction, body, created_at, metadata')
    .order('created_at', { ascending: true })
    .limit(60)
  if (p.jid) msgQuery = msgQuery.eq('jid', p.jid)
  else msgQuery = msgQuery.ilike('jid', `%${p.phone}%`)
  const { data: msgsRaw } = await msgQuery

  // Biens catalogue correspondants
  let matchingBiens: any[] = []
  if (p.commune || p.type_bien) {
    try {
      const { items } = await getConsolidatedCatalogue({
        commune: p.commune ?? undefined,
        type_bien: p.type_bien ?? undefined,
        prix_max: p.budget ? Math.round(p.budget * 1.15) : undefined,
        sort: 'verified_first',
        limitPerSource: 3,
      })
      matchingBiens = items.slice(0, 4)
    } catch {
      matchingBiens = []
    }
  }

  return NextResponse.json({
    prospect: p,
    contactCount: contactCount ?? 0,
    visiteCount: visiteCount ?? 0,
    reservationCount: reservationCount ?? 0,
    crmEvents: timelineResult.error ? [] : timelineResult.data ?? [],
    visites: ((visitesResult.data ?? []) as any[]).filter((v) => v.statut !== 'annulee' && v.statut !== 'refusee'),
    messages: msgsRaw ?? [],
    matchingBiens,
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const { operation, values, version } = body

  const admin = createAdminClient()

  if (operation === 'type_contact') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from('prospects').update({ source_detail: values.type_contact }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, version })
  }

  try {
    await callCrmRpc('crm_update_prospect', {
      p_id: id,
      p_operation: operation,
      p_values: values,
      p_version: version ?? 1,
    })
    return NextResponse.json({ ok: true, version: (version ?? 1) + 1 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur de mise à jour' }, { status: 400 })
  }
}
