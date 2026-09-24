// apps/web/app/api/admin/visites/[id]/fiche/route.ts
// Génération de la Fiche de Visite Prospect (Bon de visite) en PDF

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FicheVisiteDocument, type FicheVisiteProps } from '@/lib/fiche-visite-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDateFR(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1. Authentification Admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  // 2. Récupération de la visite et des entités liées
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visite, error: visiteErr } = await (admin as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes, statut, source,
      client_name, client_phone, created_at, bien_id, prospect_id, assigned_to,
      biens (
        id, titre, type_bien, commune, quartier, adresse_complete,
        prix_mois_fcfa, prix_vente_fcfa, surface_m2, nb_pieces
      ),
      prospect:prospects (
        id, nom, phone, email, commune, quartier, budget, type_bien
      ),
      assigned:profiles!visites_assigned_to_fkey (
        id, full_name, phone
      ),
      locataire:profiles!visites_locataire_id_fkey (
        id, full_name, phone, email
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (visiteErr || !visite) {
    return NextResponse.json({ error: 'Visite non trouvée' }, { status: 404 })
  }

  // 3. Préparation des données pour le document
  const prospectNom =
    visite.prospect?.nom || visite.locataire?.full_name || visite.client_name || 'Prospect Client'
  const prospectTel =
    visite.prospect?.phone || visite.locataire?.phone || visite.client_phone || ''
  const prospectEmail = visite.prospect?.email || visite.locataire?.email || ''

  const dateVisite = visite.date_souhaitee ? formatDateFR(visite.date_souhaitee) : 'Date à convenir'
  const creneauHoraire =
    visite.heure_debut && visite.heure_fin
      ? `${visite.heure_debut} - ${visite.heure_fin}`
      : visite.heure_debut || 'Heure à convenir'

  const commercialNom =
    visite.assigned?.full_name || profile.full_name || 'Conseiller BOGBE\'S'
  const commercialTel = visite.assigned?.phone || profile.phone || '+225 07 48 48 37 37'

  const bien = visite.biens
  const biensList = bien
    ? [
        {
          ref: bien.id ? String(bien.id).slice(0, 8).toUpperCase() : '—',
          titre: bien.titre || 'Bien sans titre',
          typeBien: bien.type_bien || 'Immobilier',
          localisation: [bien.commune, bien.quartier].filter(Boolean).join(' · ') || 'Abidjan',
          prixLabel: bien.prix_mois_fcfa
            ? `${Number(bien.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois`
            : bien.prix_vente_fcfa
              ? `${Number(bien.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA`
              : 'Prix sur demande',
          observations: '',
        },
      ]
    : []

  const props: FicheVisiteProps = {
    ficheNum: `BV-${visite.id.slice(0, 8).toUpperCase()}`,
    dateEdition: new Date().toLocaleDateString('fr-FR'),
    prospectNom,
    prospectTel,
    prospectEmail,
    prospectCritere: visite.prospect?.type_bien || undefined,
    prospectBudget: visite.prospect?.budget
      ? `${Number(visite.prospect.budget).toLocaleString('fr-FR')} FCFA`
      : undefined,
    dateVisite,
    creneauHoraire,
    commercialNom,
    commercialTel,
    biens: biensList,
    notesVisite: visite.notes || undefined,
  }

  // 4. Rendu du PDF en mémoire
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FicheVisiteDocument, props) as any)
    const isDownload = req.nextUrl.searchParams.get('download') === '1'

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="fiche-visite-${id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[pdf] Erreur génération fiche de visite:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
