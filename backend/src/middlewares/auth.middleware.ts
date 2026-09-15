import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.query?.token) token = req.query.token as string;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (token && process.env.JWT_SECRET_KEY) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as { id: number; email: string };
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};

