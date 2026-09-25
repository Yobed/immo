// apps/web/app/api/admin/fiche-visite/route.ts
// Route directe pour générer une Fiche de Visite Prospect (vierge ou pré-remplie via query params)

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { FicheVisiteDocument, type FicheVisiteProps } from '@/lib/fiche-visite-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, phone')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const qType = sp.get('typeContact')
  const typeContact: 'prospect' | 'agent' = qType === 'agent' ? 'agent' : 'prospect'

  const props: FicheVisiteProps = {
    ficheNum: `BV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    dateEdition: new Date().toLocaleDateString('fr-FR'),
    prospectNom: sp.get('nom') || '',
    prospectTel: sp.get('tel') || '',
    prospectEmail: sp.get('email') || '',
    prospectCritere: sp.get('critere') || '',
    prospectBudget: sp.get('budget') || '',
    typeContact,
    agenceOuStructure: sp.get('agence') || undefined,
    nomClientRepresente: sp.get('client') || undefined,
    dateVisite: sp.get('date') || '____ / ____ / 2026',
    creneauHoraire: sp.get('heure') || '____h____ à ____h____',
    commercialNom: profile.full_name || 'Conseiller BOGBE\'S',
    commercialTel: profile.phone || '+225 07 48 48 37 37',
    biens: [],
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(FicheVisiteDocument, props) as any)
    const isDownload = sp.get('download') === '1'

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="fiche-visite-bogbes.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[pdf] Erreur génération fiche de visite:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
  }
}
