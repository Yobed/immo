/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@immo-ci/shared'],
  // RESA-03 FIX: Evite le crash "ba.Component is not a constructor" de react-pdf
  // dans les App Router route handlers. Sans ceci, next build reussit mais la route
  // crashe a la premiere requete.
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.wasenderapi.com' },
      { protocol: 'https', hostname: 'wasenderapi.com' },
      { protocol: 'https', hostname: 'storage.tally.so' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  async redirects() {
    return [
      // Unification IA — /biens (listing) et /recherche → /catalogue
      // /biens/[id] (page détail) reste accessible normalement.
      { source: '/biens', destination: '/catalogue', permanent: true },
      { source: '/recherche', destination: '/catalogue', permanent: true },
    ]
  },
}

export default nextConfig
