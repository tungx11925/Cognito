import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tokenBlacklistService } from '../services/token-blacklist.service';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role?: string | null };
}

const isAuthDebug = process.env.AUTH_DEBUG === '1' || process.env.AUTH_DEBUG === 'true';
const authLog = (msg: string) => {
  if (isAuthDebug) console.log(`[AUTH_BE_DEBUG] ${msg}`);
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let source = 'none';
  try {
    let token = req.cookies?.token;
    if (token) {
      source = 'cookie';
    }

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        source = 'header';
      }
    }

    if (!token) {
      authLog(`[NO_TOKEN -> 401] ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục', code: 'UNAUTHENTICATED' });
    }

    // GAP-04: Kiểm tra token có nằm trong blacklist do đã đăng xuất trước đó không
    if (tokenBlacklistService.isBlacklisted(token)) {
      authLog(`[BLACKLISTED -> 401] ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: 'Token đã bị vô hiệu hóa do đăng xuất', code: 'TOKEN_REVOKED' });
    }

    const decoded = verifyToken(token) as { id: number; email: string; role?: string };
    req.user = decoded;

    // Check suspension status and current role
    const userCheck = await db.query('SELECT role, is_suspended, suspension_reason FROM users WHERE id = $1', [decoded.id]);
    if (userCheck.rows[0]?.is_suspended) {
      authLog(`[SUSPENDED -> 403] ${req.method} ${req.originalUrl} user=${decoded.id}`);
      return res.status(403).json({
        error: `Tài khoản của bạn đã bị đình chỉ. Lý do: ${userCheck.rows[0].suspension_reason || 'Vi phạm chính sách cộng đồng'}`,
        code: 'ACCOUNT_SUSPENDED'
      });
    }
    if (userCheck.rows[0]?.role) {
      req.user.role = userCheck.rows[0].role;
    }

    authLog(`[OK] ${req.method} ${req.originalUrl} user=${decoded.id} via ${source}`);
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
      if (req.cookies?.token) {
        res.clearCookie('token', { path: '/' });
      }
      authLog(`[ERROR -> 401] ${req.method} ${req.originalUrl} err=${error?.name}`);
      return res.status(401).json({
        error: 'Token không hợp lệ hoặc đã hết hạn',
        code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      });
    }
    // Database error or internal system exception: MUST return 500, never logout user!
    console.error(`[AUTH_BE_INTERNAL_ERROR] ${req.method} ${req.originalUrl}:`, error);
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ trong quá trình xác thực', code: 'INTERNAL_ERROR' });
  }
};

export const optionalAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;
    if (!token && typeof req.query?.token === 'string') {
      token = req.query.token;
    }
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (token && !tokenBlacklistService.isBlacklisted(token)) {
      const decoded = verifyToken(token) as { id: number; email: string; role?: string };
      req.user = decoded;
    }
  } catch (error) {
    // If token invalid, proceed gracefully as guest
  }
  next();
};

/**
 * Role check — LUÔN lấy role từ JWT đã decode (không bao giờ nhận từ body/query).
 * Token cũ (chưa có role) → tra DB 1 lần rồi cache vào req.user để các middleware sau dùng.
 * Cognito chỉ có 2 role duy nhất: 'admin' và 'user'.
 * Dùng: router.post('/...', authenticate, requireRole('admin'), handler)
 */
export const requireRole = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục', code: 'UNAUTHENTICATED' });
      }
      let role = req.user.role || null;
      if (!role) {
        // Token phát hành trước khi có role trong payload → tra DB (fallback an toàn)
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        role = result.rows[0]?.role || 'user';
        req.user.role = role;
      }
      if (role && roles.includes(role)) {
        return next();
      }
      return res.status(403).json({
        error: `Chức năng này chỉ dành cho ${roles.join(' / ')}. Tài khoản hiện tại: ${role || 'user'}`,
        code: 'FORBIDDEN',
      });
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Lỗi kiểm tra quyền', code: 'INTERNAL_ERROR' });
    }
  };
};

/**
 * Premium check — Kiểm tra trạng thái gói Premium của người dùng hoặc tài khoản Admin.
 */
export const requirePremium = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục', code: 'UNAUTHENTICATED' });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    const result = await db.query('SELECT is_premium, premium_until FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const isPremium = user?.is_premium && (!user.premium_until || new Date(user.premium_until) > new Date());
    if (isPremium) {
      return next();
    }
    return res.status(403).json({ error: 'Chức năng này yêu cầu tài khoản Premium', code: 'FORBIDDEN' });
  } catch (error) {
    console.error('Premium check error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra quyền Premium', code: 'INTERNAL_ERROR' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (token && !tokenBlacklistService.isBlacklisted(token)) {
      const decoded = verifyToken(token) as { id: number; email: string };
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};
