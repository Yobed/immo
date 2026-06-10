import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { notifyAdminVisitRequest, notifyOwnerVisitApproved, type VisitContext } from '@/lib/notifications/whatsapp-notifier'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// POST — créer une demande de visite (workflow admin-first)
// Le propriétaire EST notifié à ce stade pour vérifier sa disponibilité.
export async function POST(request: Request) {
  // Rate limit : max 5 demandes de visite par IP / 5 minutes (anti-spam)
  const rl = checkRateLimit(request, { scope: 'visite-create', max: 5, windowMs: 5 * 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)

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
    .select('proprietaire_id, statut, titre, commune')
    .eq('id', bien_id)
    .single()

  if (bienError || !bien) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }
  // Autoriser les demandes de visite sur les biens publiés ET ceux en attente
  // de validation admin (visibles publiquement depuis migration 022).
  if (!['publie', 'en_attente'].includes(bien.statut)) {
    return NextResponse.json({ error: 'Ce bien n\'est plus disponible (statut: ' + bien.statut + ')' }, { status: 400 })
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
      admin_validation_status: 'pending',
      source: 'web',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Récupérer les infos visiteur pour la notif admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visitor } = await (supabase as any)
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const ctx: VisitContext = {
    id: data.id,
    bienTitre: bien.titre || 'Bien sans titre',
    bienCommune: bien.commune ?? null,
    dateSouhaitee: date_souhaitee,
    heureDebut: heure_debut,
    heureFin: heure_fin,
    visitorName: visitor?.full_name || 'Visiteur',
    visitorPhone: visitor?.phone || '—',
    notes: message ?? null,
  }

  // Notif équipe admin et propriétaire
  // ⚠ Vercel serverless : les fonctions sont gelées dès la réponse HTTP.
  // On AWAIT pour garantir l'envoi avant fin de la requête.
  let notifAdmin: { sent: number; total: number } = { sent: 0, total: 0 }
  try {
    notifAdmin = await notifyAdminVisitRequest(supabase, ctx)
  } catch (err) {
    // Notification failure is non-critical
  }

  // Notif propriétaire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: owner } = await (supabase as any)
    .from('profiles')
    .select('full_name, phone')
    .eq('id', bien.proprietaire_id)
    .single()

  if (owner) {
    ctx.ownerName = owner.full_name
    ctx.ownerPhone = owner.phone
    try {
      await notifyOwnerVisitApproved(supabase, ctx)
    } catch {
      // Notification failure is non-critical
    }
  }

  // ─── Notification in-app pour le PROPRIO ────────────────────────────────
  // Visible dans son bell. Aucune info personnelle du visiteur — uniquement
  // les détails de la visite (bien, date souhaitée). Le contact est géré
  // ensuite par notre équipe.
  try {
    const fmtDateTime = (iso: string | undefined) => {
      if (!iso) return 'à préciser'
      const d = new Date(iso)
      if (isNaN(d.getTime())) return iso
      return d.toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    }
    const contenu = [
      `Bien : ${ctx.bienTitre}${ctx.bienCommune ? ` — ${ctx.bienCommune}` : ''}`,
      `Date souhaitée : ${fmtDateTime(ctx.dateSouhaitee)}`,
      ``,
      `Notre équipe vérifie la demande et vous tient informé.`,
    ].join('\n')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).insert({
      user_id:   bien.proprietaire_id,
      type:      'visite_demandee',
      titre:     'Nouvelle demande de visite',
      contenu,
      lien_type: 'visite',
      lien_id:   data.id,
    })
  } catch {
    // non-critique
  }

  return NextResponse.json(
    { id: data.id, admin_validation_status: 'pending', notified: notifAdmin },
    { status: 201 }
  )
}

// PATCH — propriétaire confirme ou annule
// BLOQUÉ tant que l'admin n'a pas approuvé.
export async function PATCH(request: Request) {
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { visite_id, statut } = await request.json()
  if (!visite_id || !['confirmee', 'annulee'].includes(statut)) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  // Vérifier que l'admin a déjà validé
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visite, error: fetchErr } = await (supabase as any)
    .from('visites')
    .select('id, proprietaire_id, admin_validation_status')
    .eq('id', visite_id)
    .single()

  if (fetchErr || !visite) {
    return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 })
  }
  if (visite.proprietaire_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (visite.admin_validation_status !== 'approved') {
    return NextResponse.json(
      { error: 'Cette demande est en cours de validation par notre équipe' },
      { status: 409 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('visites')
    .update({ statut })
    .eq('id', visite_id)
    .eq('proprietaire_id', user.id)
    .select('id, statut')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Non trouvé ou non autorisé' }, { status: 404 })
  return NextResponse.json(data)
}
