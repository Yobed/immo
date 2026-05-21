import { NextRequest, NextResponse } from 'next/server'
import { runLocauxDedup } from '@/lib/locaux/dedup'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Endpoint cron protégé pour ré-exécuter le dédup sur la table locaux.
 *
 * Appelé:
 * - Auto par Vercel Cron (configuré dans vercel.json) — header `Authorization: Bearer ${CRON_SECRET}`
 * - Manuellement: curl -H "Authorization: Bearer <CRON_SECRET>" https://bogbes-groupe.vercel.app/api/cron/dedup-locaux
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET?.trim().replace(/^﻿/, '') || ''

  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await runLocauxDedup()
    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      ...result,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: (e as Error).message?.slice(0, 200) || 'unknown',
    }, { status: 500 })
  }
}

// Vercel Cron utilise GET. POST autorisé pour test manuel facile aussi.
export const POST = GET
