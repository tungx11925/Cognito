import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import app from '../src/app';

interface RequestMetric {
  method: string;
  url: string;
  normalizedPath: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

const metrics: RequestMetric[] = [];

// Helper to normalize route path (replace IDs with params)
function normalizePath(url: string): string {
  const pathname = url.split('?')[0];
  return pathname
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
    .replace(/\/([0-9]+)(?=\/|$)/g, '/:id');
}

const serverApp = express();

serverApp.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/__metrics' || req.path === '/__reset-metrics') {
    return next();
  }
  const start = performance.now();
  res.on('finish', () => {
    const durationMs = performance.now() - start;
    metrics.push({
      method: req.method,
      url: req.originalUrl,
      normalizedPath: normalizePath(req.originalUrl),
      statusCode: res.statusCode,
      durationMs,
      timestamp: Date.now(),
    });
  });
  next();
});

serverApp.get('/__metrics', (req: Request, res: Response) => {
  // Aggregate metrics by method + normalizedPath
  const statsMap: Record<string, { method: string; path: string; count: number; durations: number[]; errors: number }> = {};
  
  for (const m of metrics) {
    const key = `${m.method} ${m.normalizedPath}`;
    if (!statsMap[key]) {
      statsMap[key] = { method: m.method, path: m.normalizedPath, count: 0, durations: [], errors: 0 };
    }
    statsMap[key].count++;
    statsMap[key].durations.push(m.durationMs);
    if (m.statusCode >= 400) statsMap[key].errors++;
  }

  const endpointStats = Object.values(statsMap).map(item => {
    const sorted = [...item.durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
      endpoint: `${item.method} ${item.path}`,
      count: item.count,
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      minMs: Number(sorted[0].toFixed(2)),
      maxMs: Number(sorted[sorted.length - 1].toFixed(2)),
      errors: item.errors,
    };
  });

  const topSlowestP95 = [...endpointStats].sort((a, b) => b.p95Ms - a.p95Ms).slice(0, 15);
  const topCalled = [...endpointStats].sort((a, b) => b.count - a.count).slice(0, 15);

  res.json({
    totalRequests: metrics.length,
    topSlowestP95,
    topCalled,
    allEndpoints: endpointStats,
  });
});

serverApp.post('/__reset-metrics', (req: Request, res: Response) => {
  metrics.length = 0;
  res.json({ message: 'Metrics reset' });
});

serverApp.use(app);

const PORT = process.env.PORT || 5000;
const server = http.createServer(serverApp);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

server.listen(PORT, () => {
  console.log(`🚀 Backend with metrics logging running on port ${PORT}`);
});
