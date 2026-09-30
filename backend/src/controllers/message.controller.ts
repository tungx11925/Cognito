import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import { messageService } from '../services/message.service';
import { sseService } from '../utils/sse.service';

class MessageController {
  /**
   * GET /api/messages/conversations
   */
  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const conversations = await messageService.getUserConversations(userId);
      return res.status(200).json({ conversations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messages/conversations
   * Body: { recipient_id: number }
   */
  async startConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const { recipient_id } = req.body;
      const conversation = await messageService.getOrCreateConversation(
        currentUserId,
        Number(recipient_id)
      );
      return res.status(201).json({ conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messages/conversations/:id
   */
  async getConversationDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      const conversation = await messageService.getConversationDetails(
        conversationId,
        currentUserId
      );
      return res.status(200).json({ conversation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messages/conversations/:id/messages
   * Query: { limit?: number, before_id?: number }
   */
  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const beforeId = req.query.before_id
        ? parseInt(req.query.before_id as string, 10)
        : undefined;

      const messages = await messageService.getMessages(
        conversationId,
        currentUserId,
        limit,
        beforeId
      );
      return res.status(200).json({ messages });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messages/conversations/:id/messages
   * Body: { content: string, message_type?: 'text' }
   */
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);
      const { content, message_type } = req.body;

      const message = await messageService.sendMessage(
        conversationId,
        currentUserId,
        content,
        message_type
      );
      return res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messages/conversations/:id/read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const conversationId = parseInt(req.params.id, 10);

      const result = await messageService.markAsRead(conversationId, currentUserId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messages/unread-count
   */
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const totalUnread = await messageService.getTotalUnreadCount(currentUserId);
      return res.status(200).json({ total_unread: totalUnread });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messages/stream (SSE)
   */
  async streamMessages(req: Request, res: Response) {
    let token =
      req.headers.authorization?.split(' ')[1] || (req.query.token as string);

    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: missing token for SSE' });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here'
      ) as any;
      const userId = decoded.id;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      sseService.addClient(userId, res);

      req.on('close', () => {
        sseService.removeClient(res);
      });
    } catch {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  }
}

export const messageController = new MessageController();
