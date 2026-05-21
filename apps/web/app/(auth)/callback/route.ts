import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const verifyType = searchParams.get('type') as
    | 'signup'
    | 'invite'
    | 'magiclink'
    | 'recovery'
    | 'email_change'
    | 'email'
    | null

  if (code || (tokenHash && verifyType)) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Deux flows possibles :
    // - PKCE (OAuth Google, magic links modernes) → exchangeCodeForSession
    // - Legacy (anciens templates email Supabase) → verifyOtp(token_hash)
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: verifyType === 'email' ? 'email' : verifyType!,
        })

    if (!error) {
      // Get the 'next' parameter for redirection after login
      const next = searchParams.get('next') || ''
      
      // Récupérer l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const provider = user.app_metadata?.provider ?? ''

        // Vérifier si c'est un nouvel utilisateur Google (profil incomplet)
        if (provider === 'google') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single()

          // Nouveau user Google : full_name vide → onboarding
          if (!profile || profile.full_name === '') {
            return NextResponse.redirect(`${origin}/complete-profile${next ? `?next=${encodeURIComponent(next)}` : ''}`)
          }
        }

        // If 'next' is provided, use it (safeguard: check if it starts with /)
        if (next && next.startsWith('/')) {
          return NextResponse.redirect(`${origin}${next}`)
        }

        // Utilisateur existant → rediriger selon le rôle
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('[callback] profile read failed', { userId: user.id, error: profileError.message })
        }

        const role = (profile?.role ?? '').toString().trim().toLowerCase()
        if (role === 'admin') {
          return NextResponse.redirect(`${origin}/admin/suivi`)
        }
        if (role === 'proprietaire') {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/`)
      }

      return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
