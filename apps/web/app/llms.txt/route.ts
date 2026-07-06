import { SEO_COMMUNES } from '@/lib/seo/communes'
import { BLOG_POSTS } from '@/lib/blog/posts'
import { SITE_URL } from '@/lib/env'

/**
 * /llms.txt — carte du site à destination des IA (ChatGPT, Perplexity, Claude,
 * Gemini…). Standard émergent (llmstxt.org) : un markdown concis qui décrit le
 * site et pointe vers les pages citables. Généré depuis les mêmes sources que
 * le sitemap → toujours synchronisé.
 */
export function GET() {
  const communesLocation = SEO_COMMUNES.map((c) => `${SITE_URL}/location/${c.slug}`).join('\n- ')
  const communesVente = SEO_COMMUNES.map((c) => `${SITE_URL}/vente/${c.slug}`).join('\n- ')
  const guides = BLOG_POSTS.map((p) => `- [${p.titre}](${SITE_URL}/blog/${p.slug}) : ${p.description}`).join('\n')

  const body = `# BOGBE'S GROUPE — Immobilier en Côte d'Ivoire

> Plateforme immobilière de confiance en Côte d'Ivoire : location, vente, terrains et résidences meublées à Abidjan et dans tout le pays. Chaque annonce est vérifiée par notre équipe avant publication pour protéger les clients des arnaques. Réservation de visite en ligne et paiement sécurisé par mobile money.

Site : ${SITE_URL}
Contact WhatsApp : +225 05 44 87 20 51
Bureau : Cocody, Rond-point Ado, Palmeraie, Abidjan, Côte d'Ivoire

## Pages principales

- [Catalogue des biens](${SITE_URL}/catalogue) : tous les biens disponibles (location, vente, meublés), filtrables par commune, type et budget.
- [Offres flash](${SITE_URL}/offre-flash) : annonces immobilières captées en temps réel sur les canaux WhatsApp d'Abidjan.
- [Comment ça marche](${SITE_URL}/comment-ca-marche) : le parcours de recherche, visite et réservation.
- [Espace propriétaires](${SITE_URL}/proprietaires) : publication d'annonces et gestion locative pour les propriétaires.

## Guides immobiliers (blog)

${guides}

## Immobilier en location par commune

- ${communesLocation}

## Immobilier à vendre par commune

- ${communesVente}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
