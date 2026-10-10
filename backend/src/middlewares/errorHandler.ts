import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code || (err.statusCode === 429 ? 'QUOTA_EXCEEDED' : err.statusCode === 504 ? 'AI_TIMEOUT' : 'APP_ERROR')
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: err.issues[0]?.message || 'Lỗi xác thực dữ liệu',
      details: err.issues.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  console.error('Unhandled Error:', err);

  // Don't leak details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Lỗi máy chủ nội bộ' 
    : err.message || 'Lỗi máy chủ nội bộ';

  res.status(500).json({
    error: message
  });
};
