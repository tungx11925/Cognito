/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: false,

  // Keep dev pages in memory longer to prevent constant re-compilation delays
  onDemandEntries: {
    maxInactiveAge: 3600 * 1000, // keep compiled pages in memory for 1 hour
    pagesBufferLength: 20,       // keep up to 20 pages hot in memory
  },

  // Fast image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  compress: true,

  experimental: {
    optimizeCss: false,
  },

  // Cache static asset headers
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      }
    ]
  }
}
module.exports = nextConfig
