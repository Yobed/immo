import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/pro/', '/client/', '/api/'],
    },
    sitemap: 'https://immo-ci.vercel.app/sitemap.xml',
  }
}
