import { Request, Response, NextFunction } from 'express';

const ipRequests = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale rate-limit records periodically (every 5 minutes) to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const rateLimiter = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      ipRequests.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: `Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau ${retryAfter} giây.`
      });
    }

    next();
  };
};
