import app from './app';
import http from 'http';

const PORT = process.env.PORT || 5000;

// Bắt các lỗi unhandled để nodemon không bị crash loop
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception (non-fatal):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️  Unhandled Rejection (non-fatal):', reason);
});

const server = http.createServer(app);

// Keep-alive connections to reduce TCP handshake overhead per request
server.keepAliveTimeout = 65000; // slightly above load balancer's 60s
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
