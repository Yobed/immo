import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { renderToBuffer }            from '@react-pdf/renderer'
import { createElement }             from 'react'
import { ContratDocument }           from '@/lib/contrat-pdf'
import type { ContratProps }         from '@/lib/contrat-pdf'

// Ce handler utilise renderToBuffer — necessite serverExternalPackages dans next.config.ts

export async function POST(req: NextRequest) {
  // Utiliser service role key : appelable depuis webhook (non authentifie) apres paiement confirme
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const body = await req.json() as { reservationId: string }
  if (!body.reservationId) {
    return NextResponse.json({ error: 'reservationId requis' }, { status: 400 })
  }

  // Recuperer la reservation + bien + locataire + proprietaire
  const { data: resa, error: resaError } = await supabase
    .from('reservations')
    .select(`
      id, date_debut, date_fin, montant_loyer_fcfa, locataire_id,
      biens (
        id, titre, adresse_complete, commune, surface_m2, nb_pieces,
        charges_mois_fcfa, depot_garantie_fcfa,
        proprietaire_id
      ),
      profiles!locataire_id ( nom_complet, telephone )
    `)
    .eq('id', body.reservationId)
    .single()

  if (resaError || !resa) {
    return NextResponse.json({ error: 'Reservation introuvable' }, { status: 404 })
  }

  // Recuperer le profil bailleur
  const { data: bailleur } = await supabase
    .from('profiles')
    .select('nom_complet, telephone')
    .eq('id', (resa.biens as unknown as { proprietaire_id: string }).proprietaire_id)
    .single()

  const bien      = resa.biens as unknown as {
    id: string; titre: string; adresse_complete: string; commune: string;
    surface_m2: number; nb_pieces: number; charges_mois_fcfa: number;
    depot_garantie_fcfa: number; proprietaire_id: string
  }
  const locataire = resa.profiles as unknown as { nom_complet: string; telephone: string } | null
  const today     = new Date().toLocaleDateString('fr-FR')

  const contratProps: ContratProps = {
    contratId:          resa.id,
    reservationId:      resa.id,
    dateDebut:          resa.date_debut,
    dateFin:            resa.date_fin,
    bailleurNom:        (bailleur as { nom_complet: string } | null)?.nom_complet ?? 'Non renseigne',
    bailleurCni:        '—',
    bailleurTel:        (bailleur as { telephone: string } | null)?.telephone ?? '—',
    preneurNom:         locataire?.nom_complet ?? 'Non renseigne',
    preneurCni:         '—',
    preneurTel:         locataire?.telephone   ?? '—',
    bienAdresse:        bien.adresse_complete  ?? bien.titre,
    bienCommune:        bien.commune,
    surfaceM2:          bien.surface_m2        ?? 0,
    nbPieces:           bien.nb_pieces         ?? 0,
    loyerMoisFcfa:      Number(resa.montant_loyer_fcfa),
    chargesMoisFcfa:    Number(bien.charges_mois_fcfa ?? 0),
    depotGarantieFcfa:  Number(bien.depot_garantie_fcfa ?? 0),
    dateSignature:      today,
    lieuSignature:      bien.commune,
  }

  // Generer le PDF buffer — necessite serverExternalPackages: ['@react-pdf/renderer']
  const pdfBuffer = await renderToBuffer(createElement(ContratDocument, contratProps) as any)

  // RESA-06 : Creer le bucket 'contrats' s'il n'existe pas encore
  await supabase.storage.createBucket('contrats', { public: false }).catch(() => {
    // Ignorer si le bucket existe deja (erreur Duplicate)
  })

  const fileName = `contrat-${resa.id}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('contrats')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Generer une URL signee valable 1 an (3600 * 24 * 365 secondes)
  const { data: signedData } = await supabase.storage
    .from('contrats')
    .createSignedUrl(fileName, 3600 * 24 * 365)

  const pdfUrl = signedData?.signedUrl ?? ''

  // Inserer dans la table contrats
  const { data: contrat } = await supabase
    .from('contrats')
    .insert({
      reservation_id:      resa.id,
      bien_id:             bien.id,
      bailleur_id:         bien.proprietaire_id,
      preneur_id:          resa.locataire_id,
      date_debut:          resa.date_debut,
      date_fin:            resa.date_fin,
      loyer_mois_fcfa:     contratProps.loyerMoisFcfa,
      charges_mois_fcfa:   contratProps.chargesMoisFcfa,
      depot_garantie_fcfa: contratProps.depotGarantieFcfa,
      statut:              'brouillon',
      pdf_url:             pdfUrl,
    })
    .select('id')
    .single()

  return NextResponse.json({ contratId: (contrat as { id: string } | null)?.id, pdfUrl })
}
