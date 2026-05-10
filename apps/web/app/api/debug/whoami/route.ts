import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Diagnostic endpoint — affiche ce que le SSR client lit pour l'utilisateur courant.
 * À supprimer en prod une fois le bug admin résolu.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      userError: userError?.message ?? null,
    })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
    },
    profile: profile ?? null,
    profileError: profileError
      ? {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
        }
      : null,
    profileRoleType: typeof profile?.role,
    profileRoleLength:
      typeof profile?.role === 'string' ? profile.role.length : null,
    profileRoleEqualsAdmin: profile?.role === 'admin',
  })
}
