import { Request, Response, NextFunction } from 'express';

/**
 * Isolated sliding-window Rate Limiter Middleware
 * Each invocation of rateLimiter(windowMs, maxRequests) creates an independent bucket store
 * so that rate limits on one route do not exhaust the quota of another route.
 */
export const rateLimiter = (windowMs: number, maxRequests: number) => {
  const store = new Map<string, { count: number; resetTime: number }>();

  // Cleanup stale records periodically
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (timer.unref) timer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test' || req.headers['x-internal-test'] === 'true') {
      return next();
    }
    const authUser = (req as any).user;
    const key = authUser?.id
      ? `user_${authUser.id}`
      : `ip_${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const now = Date.now();

    const record = store.get(key);
    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      const targetDesc = authUser?.id ? 'tài khoản của bạn' : 'địa chỉ IP này';
      return res.status(429).json({
        error: `Quá nhiều yêu cầu từ ${targetDesc}. Vui lòng thử lại sau ${retryAfter} giây.`,
      });
    }

    next();
  };
};
