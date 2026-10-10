import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import { notificationService } from '../services/notification.service';
import { sseService } from '../utils/sse.service';

// Capability tickets stored in-memory with expiration
interface TicketRecord {
  userId: number;
  expiresAt: number;
}
const notifTickets = new Map<string, TicketRecord>();

// Cleanup expired tickets every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ticket, record] of notifTickets.entries()) {
    if (now > record.expiresAt) {
      notifTickets.delete(ticket);
    }
  }
}, 30000);

class NotificationController {
  /**
   * POST /api/notifications/stream-ticket
   * Generates a short-lived (60s), single-use capability ticket for SSE stream
   */
  async createStreamTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ticket = 'sse_notif_' + crypto.randomBytes(32).toString('hex');
      notifTickets.set(ticket, {
        userId,
        expiresAt: Date.now() + 60000,
      });
      return res.status(200).json({ ticket });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/stream
   * Unified real-time SSE stream for notifications, messages, and study tasks
   */
  async streamNotifications(req: Request, res: Response) {
    // 1. Strictly BAN passing JWT directly in query parameters to prevent log leakage
    if (req.query.token) {
      res.status(400).json({
        error: 'Truyền JWT qua query string bị cấm vì lý do bảo mật. Vui lòng lấy capability ticket qua POST /api/notifications/stream-ticket hoặc sử dụng cookie.'
      });
      return;
    }

    let userId: number | null = null;
    const ticketParam = req.query.ticket;

    // 2. Validate capability ticket
    if (ticketParam && typeof ticketParam === 'string') {
      const ticketData = notifTickets.get(ticketParam);
      if (ticketData && ticketData.expiresAt > Date.now()) {
        userId = ticketData.userId;
        // Single-use: delete immediately upon connection
        notifTickets.delete(ticketParam);
      }
    }

    // 3. Fallback to same-origin httpOnly cookie
    if (!userId && req.headers.cookie) {
      const match = req.headers.cookie.match(/token=([^;]+)/);
      if (match) {
        try {
          const decoded = jwt.verify(
            match[1],
            process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here'
          ) as any;
          userId = decoded.id;
        } catch {}
      }
    }

    // 4. Fallback to Authorization Header (if client/test sends standard header)
    if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here'
        ) as any;
        userId = decoded.id;
      } catch {}
    }

    if (!userId) {
      res.status(401).json({ error: 'Không thể xác thực kết nối stream thời gian thực' });
      return;
    }

    // Establish SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseService.addClient(userId, res);

    req.on('close', () => {
      sseService.removeClient(res);
    });
  }

  /**
   * GET /api/notifications
   */
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page, limit, unreadOnly } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const unreadCount = await notificationService.getUnreadCount(userId);
      return res.status(200).json({ unreadCount, unread_count: unreadCount });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notificationId = Number(req.params.id);
      const notification = await notificationService.markAsRead(userId, notificationId);
      return res.status(200).json({ success: true, notification });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const notificationId = Number(req.params.id);
      const result = await notificationService.deleteNotification(userId, notificationId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
