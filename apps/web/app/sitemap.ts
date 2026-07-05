import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { SEO_COMMUNES } from '@/lib/seo/communes'

// .trim() defensive : Vercel env vars peuvent contenir un trailing \r\n
// (artefact courant de copy-paste depuis le dashboard) qui casse les URLs.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bogbes-groupe.vercel.app').trim().replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Routes publiques statiques (priority décroissante par importance SEO)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/catalogue`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${SITE_URL}/offre-flash`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/proprietaires`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/comment-ca-marche`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/a-propos`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // /equipe, /blog, /partenariats, /presse sont des placeholders sans
    // contenu — retirés du sitemap tant qu'ils n'ont pas de contenu publié,
    // pour ne pas faire indexer du vide par Google (pénalité "thin content").
    // Toujours accessibles via le footer.
    { url: `${SITE_URL}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/cgu`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Pages d'atterrissage par commune ("location à Cocody", "vente à Marcory"…)
  // — cibles des recherches locales longue traîne.
  const communeRoutes: MetadataRoute.Sitemap = SEO_COMMUNES.flatMap((c) => [
    { url: `${SITE_URL}/location/${c.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/vente/${c.slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
  ])

  // Fiches biens individuelles (essentiel pour SEO immobilier).
  // Cap à 1000 pour rester sous la limite Google de 50k URLs / sitemap
  // et ne pas faire exploser le build.
  let bienRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: biens } = await (supabase as any)
      .from('biens')
      .select('id, updated_at')
      .in('statut', [...STATUTS_PUBLICS])
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (biens) {
      bienRoutes = (biens as { id: string; updated_at: string | null }[]).map((b) => ({
        url: `${SITE_URL}/biens/${b.id}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch {
    // Si Supabase indisponible au build/run, on ship sans les fiches biens
    // plutôt que de planter le sitemap complet.
  }

  return [...staticRoutes, ...communeRoutes, ...bienRoutes]
}
