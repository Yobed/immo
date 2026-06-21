import { MetadataRoute } from 'next'

// .trim() defensive : Vercel env vars peuvent contenir un trailing \r\n
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bogbes-groupe.vercel.app').trim().replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /pro/ supprimé (route fantôme). On bloque les zones authentifiées
      // et l'API pour éviter les crawls inutiles.
      disallow: [
        '/admin/',
        '/dashboard/',
        '/mes-biens/',
        '/mes-visites/',
        '/mes-avis/',
        '/messages/',
        '/profil/',
        '/notifications/',
        '/favoris/',
        '/reservations/',
        '/reservations-recues/',
        '/visites/',
        '/quittances/',
        '/avis-recus/',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
