import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role?: string | null };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
    }

    if (!process.env.JWT_SECRET_KEY) {
      throw new Error('Missing JWT_SECRET_KEY in environment variables');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as { id: number; email: string; role?: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

/**
 * Role check — LUÔN lấy role từ JWT đã decode (không bao giờ nhận từ body/query).
 * Token cũ (chưa có role) → tra DB 1 lần rồi cache vào req.user để các middleware sau dùng.
 * Dùng: router.post('/...', authenticate, requireRole('teacher', 'admin'), handler)
 */
export const requireRole = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
      }
      let role = req.user.role || null;
      if (!role) {
        // Token phát hành trước khi có role trong payload → tra DB (fallback an toàn)
        const result = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        role = result.rows[0]?.role || 'student';
        req.user.role = role;
      }
      if (role && roles.includes(role)) {
        return next();
      }
      return res.status(403).json({
        error: `Chức năng này chỉ dành cho ${roles.join(' / ')}. Tài khoản hiện tại: ${role || 'student'}`,
      });
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Lỗi kiểm tra quyền' });
    }
  };
};
