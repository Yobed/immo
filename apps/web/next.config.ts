import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@immo-ci/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
