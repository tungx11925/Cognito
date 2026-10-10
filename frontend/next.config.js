/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: false,
  transpilePackages: ['mermaid'],

  // Fast image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  compress: true,

  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'katex'],
    proxyTimeout: 180000,
  },

  eslint: {
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

  async redirects() {
    return [
      { source: '/auth/login', destination: '/', permanent: false },
      { source: '/dashboard', destination: '/library', permanent: false },
      { source: '/pricing', destination: '/premium', permanent: false },
      { source: '/study-hub', destination: '/study-sessions', permanent: false },
    ];
  },

  async rewrites() {
    const backendUrl = (process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return [
      // Instantly serve empty JSON for missing sourcemaps from external libs (framer-motion) to avoid 404 delays
      {
        source: '/_next/static/chunks/:path*.map',
        destination: '/empty.json',
      },
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
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

module.exports = withBundleAnalyzer(nextConfig);
