// apps/web/app/api/quittances/generer/route.ts
// POST webhook — reçoit {contratId, mois?} de n8n (via Edge Function ou appel direct)
// Service role key utilisée: appelable depuis webhook non authentifié
// Idempotent: UNIQUE INDEX sur (contrat_id, mois) évite les doublons

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { renderToBuffer }            from '@react-pdf/renderer'
import { createElement }             from 'react'
import { QuittanceDocument }         from '@/lib/quittance-pdf'
import type { QuittanceProps }       from '@/lib/quittance-pdf'

// Ce handler utilise renderToBuffer — necessite serverExternalPackages dans next.config.ts

export async function POST(req: NextRequest) {
  // Auth: x-service-key optionnel (Edge Function) — service role suffit pour DB
  // En production: valider x-service-key === process.env.SUPABASE_SERVICE_ROLE_KEY

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const body = await req.json() as { contratId: string; mois?: string }
  if (!body.contratId) {
    return NextResponse.json({ error: 'contratId requis' }, { status: 400 })
  }

  // Calculer le mois: 1er du mois courant si non fourni
  const moisDate = body.mois
    ? new Date(body.mois)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const moisIso = moisDate.toISOString().split('T')[0]  // '2026-02-01'

  // Date d'echeance: 5 du mois courant
  const echeance = new Date(moisDate)
  echeance.setDate(5)
  const dateEcheanceIso = echeance.toISOString().split('T')[0]

  // Recuperer le contrat + bien + profiles (locataire + proprietaire)
  const { data: contrat, error: contratError } = await supabase
    .from('contrats')
    .select(`
      id, locataire_id, proprietaire_id, bien_id,
      loyer_mois_fcfa, charges_mois_fcfa,
      biens ( id, adresse_complete, commune ),
      profiles!locataire_id ( nom_complet, telephone ),
      profiles!proprietaire_id ( nom_complet, telephone )
    `)
    .eq('id', body.contratId)
    .eq('statut', 'signe')
    .single()

  if (contratError || !contrat) {
    return NextResponse.json({ error: 'Contrat introuvable ou non signe' }, { status: 404 })
  }

  const bien = contrat.biens as unknown as { id: string; adresse_complete: string; commune: string } | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locataire = (contrat as any)['profiles!locataire_id'] as { nom_complet: string; telephone: string } | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proprietaire = (contrat as any)['profiles!proprietaire_id'] as { nom_complet: string; telephone: string } | null

  const loyerMoisFcfa   = Number(contrat.loyer_mois_fcfa)
  const chargesMoisFcfa = Number(contrat.charges_mois_fcfa ?? 0)
  const totalFcfa       = loyerMoisFcfa + chargesMoisFcfa

  // Verifier si une quittance existe deja pour ce mois (index unique contrat_id+mois)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('quittances') as any)
    .select('id, pdf_url')
    .eq('contrat_id', body.contratId)
    .eq('mois', moisIso)
    .single()

  let quittanceId: string

  if (existing) {
    quittanceId = existing.id
    // Quittance deja creee — retourner si pdf_url existe
    if (existing.pdf_url) {
      return NextResponse.json({ quittanceId, pdfUrl: existing.pdf_url, skipped: true })
    }
  } else {
    // Inserer la quittance (statut en_attente par defaut)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabase.from('quittances') as any)
      .insert({
        contrat_id:           body.contratId,
        locataire_id:         contrat.locataire_id,
        proprietaire_id:      contrat.proprietaire_id,
        mois:                 moisIso,
        montant_loyer_fcfa:   loyerMoisFcfa,
        montant_charges_fcfa: chargesMoisFcfa,
        montant_total_fcfa:   totalFcfa,
        date_echeance:        dateEcheanceIso,
        statut:               'en_attente',
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message ?? 'Erreur insertion' }, { status: 500 })
    }
    quittanceId = inserted.id
  }

  // Generer le PDF avec renderToBuffer (necessite serverExternalPackages: ['@react-pdf/renderer'])
  // OBLIGATOIRE: createElement() — NE PAS passer du JSX direct a renderToBuffer
  const quittanceProps: QuittanceProps = {
    quittanceId,
    contratId:       body.contratId,
    mois:            moisIso,
    bailleurNom:     proprietaire?.nom_complet ?? 'Non renseigne',
    bailleurTel:     proprietaire?.telephone   ?? '—',
    preneurNom:      locataire?.nom_complet    ?? 'Non renseigne',
    preneurTel:      locataire?.telephone      ?? '—',
    bienAdresse:     bien?.adresse_complete    ?? '—',
    bienCommune:     bien?.commune             ?? '—',
    loyerMoisFcfa,
    chargesMoisFcfa,
    totalFcfa,
    dateEcheance:    new Date(dateEcheanceIso).toLocaleDateString('fr-FR'),
    statut:          'en_attente',
  }

  const pdfBuffer = await renderToBuffer(createElement(QuittanceDocument, quittanceProps) as any)

  // Creer le bucket 'quittances' si necessaire
  await supabase.storage.createBucket('quittances', { public: false }).catch(() => {
    // Ignorer si le bucket existe deja (erreur Duplicate)
  })

  const fileName = `quittance-${quittanceId}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('quittances')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // URL signee valable 1 an (3600 * 24 * 365 secondes)
  const { data: signedData } = await supabase.storage
    .from('quittances')
    .createSignedUrl(fileName, 3600 * 24 * 365)

  const pdfUrl = signedData?.signedUrl ?? ''

  // Mettre a jour pdf_url dans la table quittances
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('quittances') as any).update({ pdf_url: pdfUrl }).eq('id', quittanceId)

  // Inserer notification loyer_rappel pour le locataire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any).insert({
    user_id:   contrat.locataire_id,
    type:      'loyer_rappel',
    titre:     'Votre quittance de loyer est disponible',
    contenu:   `Quittance pour ${new Date(moisIso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} — Total: ${totalFcfa.toLocaleString('fr-FR')} FCFA`,
    lien_type: 'quittance',
    lien_id:   quittanceId,
  })

  return NextResponse.json({ quittanceId, pdfUrl, locataireTel: locataire?.telephone })
}
