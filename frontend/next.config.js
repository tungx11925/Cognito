/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  // Tắt strict mode nếu thấy UI render 2 lần gây giật lag trong quá trình dev (chỉ nên làm ở dev)
  reactStrictMode: false, 
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy tới Backend
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*', // Proxy file tĩnh tới Backend
      }
    ]
  }
}
module.exports = nextConfig
