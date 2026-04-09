import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

export async function POST(req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const body = await req.json() as {
    bienId:    string
    dateDebut: string   // ISO date 'YYYY-MM-DD'
    dateFin:   string
    notes?:    string
  }

  if (!body.bienId || !body.dateDebut || !body.dateFin) {
    return NextResponse.json({ error: 'bienId, dateDebut et dateFin sont requis' }, { status: 400 })
  }
  if (new Date(body.dateFin) <= new Date(body.dateDebut)) {
    return NextResponse.json({ error: 'dateFin doit etre apres dateDebut' }, { status: 400 })
  }

  // RESA-01 : Verifier les conflits de dates avant creation (overlap SQL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conflicts } = await (supabase.from('reservations') as any)
    .select('id')
    .eq('bien_id', body.bienId)
    .not('statut', 'in', '("annulee","terminee")')
    .lte('date_debut', body.dateFin)
    .gte('date_fin', body.dateDebut)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: 'Ces dates sont deja reservees pour ce bien', conflictCount: conflicts.length },
      { status: 409 }
    )
  }

  // Recuperer le prix et le proprietaire_id du bien
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase.from('biens') as any)
    .select('prix_mois_fcfa, charges_mois_fcfa, depot_garantie_fcfa, proprietaire_id')
    .eq('id', body.bienId)
    .single()

  if (!bien) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }

  const loyer   = bien.prix_mois_fcfa ?? 0
  const charges = bien.charges_mois_fcfa ?? 0
  const depot   = bien.depot_garantie_fcfa ?? 0
  // 10 % commission plateforme, arrondie au multiple de 5 (regle XOF)
  const commission = Math.round((loyer * 10 / 100) / 5) * 5
  const total      = loyer + charges + depot

  // RESA-02 : Creer la reservation avec statut en_attente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation, error } = await (supabase.from('reservations') as any)
    .insert({
      bien_id:              body.bienId,
      locataire_id:         user.id,
      proprietaire_id:      bien.proprietaire_id,
      date_debut:           body.dateDebut,
      date_fin:             body.dateFin,
      montant_loyer_fcfa:   loyer,
      montant_total_fcfa:   total,
      charges_fcfa:         charges,
      depot_garantie_fcfa:  depot,
      commission_fcfa:      commission,
      statut:               'en_attente',
      notes:                body.notes ?? '',
    })
    .select('id, bien_id, date_debut, date_fin, montant_loyer_fcfa, montant_total_fcfa, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(reservation, { status: 201 })
}

export async function GET(_req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('reservations') as any)
    .select(`
      id, date_debut, date_fin, montant_loyer_fcfa, montant_total_fcfa, statut, created_at,
      biens ( titre, commune, adresse_complete )
    `)
    .eq('locataire_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
