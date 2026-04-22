import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { wasenderSendMessage } from '@/lib/wasender'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/biens/[id]/broadcast — send WhatsApp blast to interested clients
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bienId } = await params
  const supabase = getSupabase()

  // Fetch the bien details
  const { data: bien } = await supabase
    .from('biens')
    .select('titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, statut')
    .eq('id', bienId)
    .single()

  if (!bien) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }

  // Find unique clients who previously messaged about this commune/type
  // Look in whatsapp_messages for inbound messages mentioning this commune or type
  const { data: messages } = await supabase
    .from('whatsapp_messages')
    .select('jid, metadata')
    .eq('direction', 'inbound')
    .ilike('body', `%${bien.commune}%`)
    .order('created_at', { ascending: false })

  // Deduplicate by JID
  const seen = new Set<string>()
  const recipients: { jid: string; name: string }[] = []

  for (const msg of messages || []) {
    if (!msg.jid || seen.has(msg.jid)) continue
    seen.add(msg.jid)
    const name = (msg.metadata as any)?.contactName || 'Client'
    recipients.push({ jid: msg.jid, name })
  }

  if (recipients.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Aucun client intéressé trouvé' })
  }

  // Build the broadcast message
  const prix = bien.prix_nuit_fcfa
    ? `${(bien.prix_nuit_fcfa as number).toLocaleString()} FCFA/nuit`
    : bien.prix_vente_fcfa
      ? `${(bien.prix_vente_fcfa as number).toLocaleString()} FCFA (vente)`
      : bien.prix_mois_fcfa
        ? `${(bien.prix_mois_fcfa as number).toLocaleString()} FCFA/mois`
        : 'Prix à confirmer'

  const message = `Bonjour 👋 Nouveau bien disponible qui pourrait vous intéresser !

🏠 *${bien.titre}*
📍 ${bien.commune}${bien.quartier ? ` · ${bien.quartier}` : ''}
💰 ${prix}

Intéressé(e) ? Répondez ici pour plus d'infos ou pour planifier une visite. 😊

👉 https://immo-sigma.vercel.app/biens/${bienId}`

  // Send to all recipients with a small delay between messages
  let sent = 0
  const errors: string[] = []

  for (const r of recipients) {
    const phone = r.jid.split('@')[0]
    try {
      const result = await wasenderSendMessage(phone, message, 'text')
      if ((result as any).status !== false) sent++
    } catch (err: any) {
      errors.push(`${phone}: ${err.message}`)
    }
    // Small delay to avoid rate limiting
    await new Promise(res => setTimeout(res, 300))
  }

  // Save broadcast record
  await supabase.from('whatsapp_broadcasts').insert({
    bien_id: bienId,
    message,
    recipients: recipients,
    sent_count: sent,
  })

  return NextResponse.json({ sent, total: recipients.length, errors })
}
