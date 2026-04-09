import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

export async function POST(req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json() as {
    reservationId: string
    cibleId: string
    note: number
    commentaire?: string
  }

  const { reservationId, cibleId, note, commentaire } = body

  if (!reservationId || !cibleId || !note) {
    return NextResponse.json({ error: 'reservationId, cibleId et note requis' }, { status: 400 })
  }
  if (note < 1 || note > 5) {
    return NextResponse.json({ error: 'note doit être entre 1 et 5' }, { status: 400 })
  }

  // Vérifier que la réservation est terminée et que l'auteur est une des parties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resa } = await (supabase.from('reservations') as any)
    .select('id, locataire_id, proprietaire_id, statut')
    .eq('id', reservationId)
    .single()

  if (!resa) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }
  // NOTE: statut 'terminee' (pas 'expiree') — cf STATE.md
  if (resa.statut !== 'terminee') {
    return NextResponse.json(
      { error: 'La réservation doit être terminée pour laisser un avis' },
      { status: 403 }
    )
  }
  if (resa.locataire_id !== user.id && resa.proprietaire_id !== user.id) {
    return NextResponse.json(
      { error: "Vous n'êtes pas partie de cette réservation" },
      { status: 403 }
    )
  }
  // L'auteur doit noter la partie adverse (pas soi-même)
  if (cibleId === user.id) {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas vous noter vous-même' },
      { status: 400 }
    )
  }

  // Insérer l'avis (RLS: auteur_id = auth.uid() vérifié par Supabase)
  // UNIQUE(auteur_id, cible_id, reservation_id) — retourne erreur si doublon
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: avis, error: insertError } = await (supabase.from('avis') as any)
    .insert({
      auteur_id: user.id,
      cible_id: cibleId,
      reservation_id: reservationId,
      note: note,
      commentaire: commentaire ?? null,
    })
    .select('id')
    .single()

  if (insertError) {
    // Code 23505 = violation unique constraint
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Vous avez déjà évalué cette personne pour cette réservation' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Notification pour la cible: avis_recu
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any).insert({
    user_id: cibleId,
    type: 'avis_recu',
    titre: 'Vous avez reçu un nouvel avis',
    contenu: `Un utilisateur vous a attribué ${note}/5 étoiles.${commentaire ? ` "${commentaire.slice(0, 80)}..."` : ''}`,
    lien_type: 'reservation',
    lien_id: reservationId,
  })

  return NextResponse.json({ avisId: (avis as { id: string }).id }, { status: 201 })
}
