/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  // Tắt strict mode nếu thấy UI render 2 lần gây giật lag trong quá trình dev (chỉ nên làm ở dev)
  reactStrictMode: false, 
}
module.exports = nextConfig
