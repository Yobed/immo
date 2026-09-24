// apps/web/app/api/admin/prospects/[id]/fiche-visite/route.ts
// Génération de la Fiche de Visite Prospect (Tournée de visites) en PDF pour un prospect

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FicheVisiteDocument, type FicheVisiteProps, type BienVisiteItem } from '@/lib/fiche-visite-pdf'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  // 2. Récupération du prospect
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prospect, error: pErr } = await (admin as any)
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (pErr || !prospect) {
    return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 })
  }

  // Commercial assigné
  let commercialNom = profile.full_name || 'Conseiller BOGBE\'S'
  let commercialTel = profile.phone || '+225 07 48 48 37 37'
  if (prospect.assigned_to) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assignedProfile } = await (admin as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', prospect.assigned_to)
      .maybeSingle()
    if (assignedProfile?.full_name) {
      commercialNom = assignedProfile.full_name
      commercialTel = assignedProfile.phone || commercialTel
    }
  }

  // 3. Biens à faire visiter
  const biensList: BienVisiteItem[] = []

  // Vérifier d'abord les visites programmées pour ce prospect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scheduledVisites } = await (admin as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes,
      biens ( id, titre, type_bien, commune, quartier, adresse_complete, prix_mois_fcfa, prix_vente_fcfa )
    `)
    .eq('prospect_id', id)
    .order('date_souhaitee', { ascending: false })
    .limit(4)

  let dateVisite = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  let creneauHoraire = 'Heure à convenir'

  if (scheduledVisites && scheduledVisites.length > 0) {
    const firstVisite = scheduledVisites[0]
    if (firstVisite.date_souhaitee) {
      try {
        dateVisite = new Date(firstVisite.date_souhaitee).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      } catch {
        dateVisite = firstVisite.date_souhaitee
      }
    }
    if (firstVisite.heure_debut && firstVisite.heure_fin) {
      creneauHoraire = `${firstVisite.heure_debut} - ${firstVisite.heure_fin}`
    } else if (firstVisite.heure_debut) {
      creneauHoraire = firstVisite.heure_debut
    }

    for (const v of scheduledVisites) {
      const b = v.biens
      if (b && !biensList.some((item) => item.ref === String(b.id).slice(0, 8).toUpperCase())) {
        biensList.push({
          ref: String(b.id).slice(0, 8).toUpperCase(),
          titre: b.titre || 'Bien sans titre',
          typeBien: b.type_bien || 'Immobilier',
          localisation: [b.commune, b.quartier].filter(Boolean).join(' · ') || 'Abidjan',
          prixLabel: b.prix_mois_fcfa
            ? `${Number(b.prix_mois_fcfa).toLocaleString('fr-FR')} FCFA/mois`
            : b.prix_vente_fcfa
              ? `${Number(b.prix_vente_fcfa).toLocaleString('fr-FR')} FCFA`
              : 'Prix sur demande',
          observations: v.notes || '',
        })
      }
    }
  }

  // Si aucune visite programmée, charger les biens correspondants du catalogue
  if (biensList.length === 0 && (prospect.commune || prospect.type_bien)) {
    try {
      const inferredOffre =
        prospect.budget && prospect.budget <= 5_000_000 && prospect.type_bien !== 'terrain'
          ? 'location'
          : undefined
      const { items } = await getConsolidatedCatalogue({
        commune: prospect.commune ?? undefined,
        type_bien: prospect.type_bien ?? undefined,
        type_offre: inferredOffre,
        prix_max: prospect.budget ? Math.round(prospect.budget * 1.15) : undefined,
        sort: 'verified_first',
        limitPerSource: 3,
      })
      for (const item of items.slice(0, 3)) {
        biensList.push({
          ref: item.sourceId.slice(0, 8).toUpperCase(),
          titre: item.titre,
          typeBien: item.type_bien,
          localisation: [item.commune, item.quartier].filter(Boolean).join(' · '),
          prixLabel: item.prix_label,
          observations: '',
        })
      }
    } catch {
      /* catalogue indisponible */
    }
  }

  const props: FicheVisiteProps = {
    ficheNum: `BV-P${prospect.id.slice(0, 7).toUpperCase()}`,
    dateEdition: new Date().toLocaleDateString('fr-FR'),
    prospectNom: prospect.nom || 'Prospect Client',
    prospectTel: prospect.phone || '',
    prospectEmail: prospect.email || undefined,
    prospectCritere: [prospect.type_bien, prospect.commune, prospect.quartier]
      .filter(Boolean)
      .join(' · '),
    prospectBudget: prospect.budget
      ? `${Number(prospect.budget).toLocaleString('fr-FR')} FCFA`
      : undefined,
    dateVisite,
    creneauHoraire,
    commercialNom,
    commercialTel,
    biens: biensList,
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
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="fiche-visite-${prospect.id.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[pdf] Erreur génération fiche de visite prospect:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
