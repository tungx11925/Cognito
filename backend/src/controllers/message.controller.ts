import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { messageService } from '../services/message.service';

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
      const limit = req.query.limit 
        ? Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10))) 
        : 50;
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
}

export const messageController = new MessageController();

