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
    ],
  },
}

export default nextConfig
