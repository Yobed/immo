// apps/web/app/api/quittances/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Payload envoyé par n8n pour chaque quittance
interface RelancePayload {
  quittanceId:    string
  locataireId:    string
  proprietaireId: string
  jalon:          'J-3' | 'J-1' | 'J+1' | 'J+7'
  montantFcfa:    number
  dateEcheance:   string
}

export async function POST(req: NextRequest) {
  // Service role: webhook non authentifié depuis n8n
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  let payload: RelancePayload
  try {
    payload = await req.json() as RelancePayload
  } catch {
    // Body invalide — retourner 200 pour éviter les retries n8n
    return NextResponse.json({ status: 'ok', warning: 'body invalide' })
  }

  const { quittanceId, locataireId, proprietaireId, jalon, montantFcfa, dateEcheance } = payload

  if (!quittanceId || !jalon) {
    return NextResponse.json({ status: 'ok', warning: 'quittanceId ou jalon manquant' })
  }

  // J+1: passer le statut à 'en_retard'
  if (jalon === 'J+1') {
    await supabase
      .from('quittances')
      .update({ statut: 'en_retard' })
      .eq('id', quittanceId)
      .eq('statut', 'en_attente')  // ne pas écraser si déjà en_retard

    // Notification locataire: loyer_retard
    await supabase.from('notifications').insert({
      user_id:   locataireId,
      type:      'loyer_retard',
      titre:     'Loyer en retard',
      contenu:   `Votre loyer de ${montantFcfa.toLocaleString('fr-FR')} FCFA était dû le ${dateEcheance} et n'a pas été reçu.`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // J+7: notification propriétaire (loyer_retard)
  if (jalon === 'J+7') {
    await supabase.from('notifications').insert({
      user_id:   proprietaireId,
      type:      'loyer_retard',
      titre:     'Loyer impayé — 7 jours de retard',
      contenu:   `Un locataire a ${montantFcfa.toLocaleString('fr-FR')} FCFA en retard depuis 7 jours (échéance: ${dateEcheance}).`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // J-3 et J-1: notification locataire loyer_rappel
  if (jalon === 'J-3' || jalon === 'J-1') {
    await supabase.from('notifications').insert({
      user_id:   locataireId,
      type:      'loyer_rappel',
      titre:     `Rappel loyer — ${jalon}`,
      contenu:   `Votre loyer de ${montantFcfa.toLocaleString('fr-FR')} FCFA est dû le ${dateEcheance}.`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // CRITIQUE: toujours retourner 200 — sinon n8n retente indéfiniment
  return NextResponse.json({ status: 'ok', processed: quittanceId, jalon })
}
