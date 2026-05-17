import { NextRequest, NextResponse } from 'next/server'
import { markInviteClicked } from '@/lib/outreach/agent-prospects'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bogbes-groupe.vercel.app'

/**
 * Landing du lien d'invitation envoyé par WhatsApp aux agents.
 * Logge le click puis redirige vers /register avec un cookie de tracking.
 * URL : https://site.com/invite/<token>
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  if (!token || token.length < 8) {
    return NextResponse.redirect(new URL('/register', SITE_URL))
  }

  // Best-effort : un token invalide ne bloque pas la redirection
  await markInviteClicked(token).catch(() => null)

  const target = new URL('/register', SITE_URL)
  target.searchParams.set('ref', 'outreach')
  target.searchParams.set('t', token)

  const response = NextResponse.redirect(target)
  // Cookie httpOnly pour que la conversion finale puisse retrouver le token
  response.cookies.set('outreach_token', token, {
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
  })
  return response
}
