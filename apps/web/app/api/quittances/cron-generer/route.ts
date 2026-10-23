import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
 * Endpoint Cron (appelé par n8n le 1er du mois ou par Vercel Cron) :
 * Parcourt tous les contrats de bail actifs ('signe') et initialise les quittances du mois.
 */
export async function POST(req: NextRequest) {
  if (!hasInternalAuth(req)) {
    return NextResponse.json({ error: 'Authentification interne requise' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const now = new Date()
  const moisIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Échéance fixée au 5 du mois en cours
  const echeance = new Date(now.getFullYear(), now.getMonth(), 5)
  const dateEcheanceIso = echeance.toISOString().split('T')[0]

  try {
    // 1. Charger tous les contrats signés
    const { data: contrats, error: contratsErr } = await supabase
      .from('contrats')
      .select('id, locataire_id, proprietaire_id, loyer_mois_fcfa, charges_mois_fcfa')
      .eq('statut', 'signe')

    if (contratsErr) throw contratsErr

    let created = 0
    let alreadyExists = 0

    for (const c of contrats ?? []) {
      const loyer = Number(c.loyer_mois_fcfa || 0)
      const charges = Number(c.charges_mois_fcfa || 0)
      const total = loyer + charges

      // Vérifier si la quittance du mois existe déjà pour ce contrat
      const { data: existing } = await supabase
        .from('quittances')
        .select('id')
        .eq('contrat_id', c.id)
        .eq('mois', moisIso)
        .maybeSingle()

      if (existing) {
        alreadyExists++
        continue
      }

      // Créer la quittance en attente de paiement
      const { error: insErr } = await supabase.from('quittances').insert({
        contrat_id: c.id,
        locataire_id: c.locataire_id,
        proprietaire_id: c.proprietaire_id,
        mois: moisIso,
        date_echeance: dateEcheanceIso,
        montant_loyer_fcfa: loyer,
        montant_charges_fcfa: charges,
        montant_total_fcfa: total,
        statut: 'en_attente',
      })

      if (!insErr) {
        created++
      }
    }

    return NextResponse.json({
      ok: true,
      mois: moisIso,
      totalContrats: contrats?.length ?? 0,
      created,
      alreadyExists,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erreur interne quittances' }, { status: 500 })
  }
}

export const GET = POST
