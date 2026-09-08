/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@immo-ci/shared'],
  // RESA-03 FIX: Evite le crash "ba.Component is not a constructor" de react-pdf
  // dans les App Router route handlers. Sans ceci, next build reussit mais la route
  // crashe a la premiere requete.
  // Next 15 : `serverComponentsExternalPackages` (experimental) → `serverExternalPackages` (stable).
  serverExternalPackages: ['@react-pdf/renderer'],
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https:; form-action 'self' https:; upgrade-insecure-requests" },
        ],
      },
    ]
  },
}

export default nextConfig
