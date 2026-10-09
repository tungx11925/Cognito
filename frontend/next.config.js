/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: false,
  transpilePackages: ['mermaid', 'framer-motion'],



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

  // Cache static asset headers (chỉ cache immutable ở production, tránh phá hỏng dev HMR)
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
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
    const backendUrl = (process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      }
    ]
  }
}
module.exports = nextConfig
