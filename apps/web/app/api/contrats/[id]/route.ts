import { NextRequest, NextResponse } from 'next/server'
import { getServerUser }              from '@/lib/server-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: contrat } = await supabase
    .from('contrats' as never)
    .select('id, pdf_url, bailleur_id, preneur_id')
    .eq('id', id)
    .single()

  if (!contrat) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })

  const c = contrat as { id: string; pdf_url: string; bailleur_id: string; preneur_id: string }
  if (c.bailleur_id !== user.id && c.preneur_id !== user.id)
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })

  return NextResponse.json({ pdfUrl: c.pdf_url })
}
