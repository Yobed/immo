import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

// POST — créer une demande de visite
export async function POST(request: Request) {
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { bien_id, date_souhaitee, creneau, message } = body

  if (!bien_id || !date_souhaitee || !creneau) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  // Sécurité : récupère le proprio depuis la DB, ne pas faire confiance au body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien, error: bienError } = await (supabase as any)
    .from('biens')
    .select('proprietaire_id, statut')
    .eq('id', bien_id)
    .single()

  if (bienError || !bien) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }
  if (bien.statut !== 'publie') {
    return NextResponse.json({ error: 'Ce bien n\'est pas disponible' }, { status: 400 })
  }
  if (bien.proprietaire_id === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas demander une visite pour votre propre bien' }, { status: 400 })
  }

  // creneau format: "08:00 - 09:00" → heure_debut: "08:00", heure_fin: "09:00"
  const parts = (creneau as string).split(' - ').map((s: string) => s.trim())
  const heure_debut = parts[0] ?? null
  const heure_fin = parts[1] ?? null

  const { data, error } = await (supabase as any)
    .from('visites')
    .insert({
      bien_id,
      locataire_id: user.id,
      proprietaire_id: bien.proprietaire_id, // from DB, not body
      date_souhaitee,
      heure_debut,
      heure_fin,
      notes: message ?? null,
      statut: 'en_attente',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}

// PATCH — propriétaire confirme ou annule
export async function PATCH(request: Request) {
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { visite_id, statut } = await request.json()
  if (!visite_id || !['confirmee', 'annulee'].includes(statut)) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('visites')
    .update({ statut })
    .eq('id', visite_id)
    .eq('proprietaire_id', user.id) // RLS: seul le proprio peut confirmer/annuler
    .select('id, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Non trouvé ou non autorisé' }, { status: 404 })
  return NextResponse.json(data)
}
