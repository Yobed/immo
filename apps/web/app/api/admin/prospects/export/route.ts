import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** Échappe une valeur pour CSV (guillemets + séparateur + retour ligne). */
function csv(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: Request) {
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('prospects')
    .select('nom, phone, type_bien, commune, quartier, budget, date_souhaitee, statut, message_count, first_seen, last_seen')
    .order('last_seen', { ascending: false })
    .limit(5000)

  const headers = [
    'Nom', 'Numéro', 'Type de bien', 'Commune', 'Quartier', 'Budget (FCFA)',
    'Date souhaitée', 'Statut', 'Nb messages', 'Premier contact', 'Dernier contact',
  ]
  const lines = [headers.join(';')]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    lines.push(
      [
        csv(r.nom), csv(r.phone), csv(r.type_bien), csv(r.commune), csv(r.quartier),
        csv(r.budget), csv(r.date_souhaitee), csv(r.statut), csv(r.message_count),
        csv(r.first_seen?.slice(0, 10)), csv(r.last_seen?.slice(0, 10)),
      ].join(';'),
    )
  }
  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const body = '﻿' + lines.join('\r\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="prospects-bogbes-${date}.csv"`,
    },
  })
}
