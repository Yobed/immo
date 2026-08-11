import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SEO_COMMUNES } from '@/lib/seo/communes'
import { BLOG_SLUGS } from '@/lib/blog/posts'

const SEO_COMMUNE_SLUGS = new Set(SEO_COMMUNES.map((c) => c.slug))

export async function middleware(request: NextRequest) {
  // Pages SEO /location/[commune], /vente/[commune] et /blog/[slug] : les slugs
  // inconnus doivent renvoyer un VRAI HTTP 404. Le notFound() de la page ne
  // suffit pas : le loading.tsx de (public) fait streamer un 200 avant qu'il
  // se déclenche. → rewrite vers une route inexistante = 404 natif.
  const seoMatch = request.nextUrl.pathname.match(/^\/(location|vente|blog)\/([^/]+)$/)
  if (seoMatch) {
    const slugs = seoMatch[1] === 'blog' ? BLOG_SLUGS : SEO_COMMUNE_SLUGS
    if (!slugs.has(seoMatch[2].toLowerCase())) {
      const url = request.nextUrl.clone()
      url.pathname = '/__not-found__'
      return NextResponse.rewrite(url)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getUser() server-side (validates JWT, never reads from cookie directly)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes protégées par login. Liste explicite, pas de match large : '/pro'
  // matchait à tort /proprietaires (page publique d'explication offre).
  const protectedRoutes = ['/client', '/admin', '/dashboard', '/mes-biens', '/mes-avis', '/mes-visites', '/visites', '/quittances', '/profil', '/avis-recus', '/reservations']
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Include search parameters (like ?bienId=...) in the redirect parameter
    const redirectTo = request.nextUrl.pathname + request.nextUrl.search
    url.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Toutes les pages SAUF : statics Next, images, et TOUTES les routes /api
    // (les API — dont le webhook WhatsApp — doivent rester publiques et ne
    // passent pas par la session Supabase du middleware).
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
