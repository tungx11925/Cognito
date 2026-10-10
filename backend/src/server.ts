// Bắt các lỗi unhandled ngay từ đầu để nodemon không bị crash loop
process.on('uncaughtException', (err: any) => {
  console.warn('⚠️  Uncaught Exception (non-fatal):', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('⚠️  Unhandled Rejection (non-fatal):', reason?.message || reason);
});

import app from './app';
import http from 'http';

import { initSubscriptionScheduler } from './services/subscription.service';
import { documentProcessingService } from './services/document-processing.service';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Keep-alive connections to reduce TCP handshake overhead per request
server.keepAliveTimeout = 65000; // slightly above load balancer's 60s
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  // Initialize periodic background sweep for subscriptions and abandoned orders
  initSubscriptionScheduler();
  // GAP-08: Tự động phục hồi các tài liệu PENDING / PROCESSING khi khởi động
  documentProcessingService.recoverPendingJobs().catch(err => {
    console.warn('[DocProcessing] Auto-recovery on start warning:', err?.message);
  });
});

