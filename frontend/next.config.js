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

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Next.js 14 currently has conflicts with ESLint 9.
    ignoreDuringBuilds: true,
  },

  // Tăng tốc Fast Refresh/HMR khi dev: không theo dõi các thư mục nặng ngoài frontend
  // (tránh tình trạng "[Fast Refresh] rebuilding" kéo dài hàng chục giây)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/backend/**',
          '**/.agents/**',
          '**/.gemini/**',
          '**/_bmad/**',
          '**/_bmad-output/**',
        ],
      };
    }
    return config;
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
