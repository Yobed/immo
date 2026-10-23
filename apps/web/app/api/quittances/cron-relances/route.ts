import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { wasenderSendMessage } from '@/lib/wasender'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

function sameSecret(actual: string | null, expected: string | undefined): boolean {
  if (!actual || !expected) return false
  const a = Buffer.from(actual.trim())
  const b = Buffer.from(expected.trim())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function hasInternalAuth(req: NextRequest): boolean {
  const serviceKey = req.headers.get('x-service-key')
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  return (
    isVercelCron ||
    sameSecret(serviceKey, process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    sameSecret(bearer, process.env.CRON_SECRET)
  )
}

/**
 * Endpoint Cron (appelé quotidiennement par n8n ou Vercel Cron) :
 * Vérifie les quittances impayées et émet les alertes WhatsApp / in-app
 * selon les jalons J-3, J-1, J+1 (retard), J+7 (mise en demeure amiable).
 */
export async function POST(req: NextRequest) {
  if (!hasInternalAuth(req)) {
    return NextResponse.json({ error: 'Authentification interne requise' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // 1. Charger les quittances impayées
    const { data: quittances, error } = await supabase
      .from('quittances')
      .select(`
        id, mois, date_echeance, montant_total_fcfa, statut,
        locataire:profiles!locataire_id ( id, full_name, phone ),
        proprietaire:profiles!proprietaire_id ( id, full_name, phone ),
        contrat:contrats ( id, biens ( titre, commune ) )
      `)
      .eq('statut', 'en_attente')

    if (error) throw error

    let relancesSent = 0

    for (const q of quittances ?? []) {
      if (!q.date_echeance) continue

      const echeance = new Date(q.date_echeance)
      echeance.setHours(0, 0, 0, 0)

      const diffDays = Math.round((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))

      let jalon: 'J-3' | 'J-1' | 'J+1' | 'J+7' | null = null
      if (diffDays === -3) jalon = 'J-3'
      else if (diffDays === -1) jalon = 'J-1'
      else if (diffDays === 1) jalon = 'J+1'
      else if (diffDays >= 7 && diffDays <= 8) jalon = 'J+7'

      if (!jalon) continue

      const locataire = q.locataire
      if (!locataire?.phone) continue

      const bienTitre = q.contrat?.biens?.titre || 'votre logement'
      const montant = Number(q.montant_total_fcfa || 0).toLocaleString('fr-FR')

      let message = ''
      if (jalon === 'J-3') {
        message = `Bonjour ${locataire.full_name || ''} 👋\n\nRappel : votre loyer pour *${bienTitre}* (${montant} FCFA) arrive à échéance le ${q.date_echeance}.\n\nMerci de procéder à votre règlement.\n— *BOGBE'S GROUPE*`
      } else if (jalon === 'J-1') {
        message = `Bonjour ${locataire.full_name || ''} 👋\n\nVotre loyer pour *${bienTitre}* (${montant} FCFA) arrive à échéance DEMAIN.\n\nMerci de régler ou d'indiquer votre mode de paiement sur votre espace client.\n— *BOGBE'S GROUPE*`
      } else if (jalon === 'J+1') {
        message = `Bonjour ${locataire.full_name || ''} ⚠️\n\nVotre loyer pour *${bienTitre}* (${montant} FCFA) était dû hier (${q.date_echeance}) et n'apparaît pas encore comme réglé.\n\nMerci de régulariser la situation dès aujourd'hui.\n— *BOGBE'S GROUPE*`
      } else if (jalon === 'J+7') {
        message = `URGENT - Bonjour ${locataire.full_name || ''}\n\nVotre loyer pour *${bienTitre}* accuse désormais 7 jours de retard (${montant} FCFA).\n\nVeuillez contacter d'urgence votre gestionnaire pour éviter l'application des pénalités contractuelles.\n— *BOGBE'S GROUPE*`
      }

      // Envoi WhatsApp avec fallback automatique
      await wasenderSendMessage(locataire.phone, message, 'text').catch(() => null)

      // Enregistrement in-app notification
      if (locataire.id) {
        await supabase.from('notifications').insert({
          user_id: locataire.id,
          type: 'relance_loyer',
          titre: `Échéance de loyer (${jalon})`,
          message,
          lien_type: 'quittance',
          lien_id: q.id,
        }).catch(() => null)
      }

      relancesSent++
    }

    return NextResponse.json({
      ok: true,
      processed: quittances?.length ?? 0,
      relancesSent,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erreur relances quittances' }, { status: 500 })
  }
}

export const GET = POST
