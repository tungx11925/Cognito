import { db } from '../db';
import { AppError } from '../utils/AppError';
import {
  ConversationSummary,
  MessageWithSender,
  messageRepository,
} from '../repositories/message.repository';
import { safetyService } from './safety.service';
import { sseService } from '../utils/sse.service';

class MessageService {
  /**
   * Anti-spam / rate limit check for sending direct messages
   */
  async checkMessageRateLimit(senderId: number, conversationId: number, content: string): Promise<void> {
    // 1. Check message volume: max 30 messages in the last 60 seconds
    const countRes = await db.query(
      `SELECT COUNT(*)::int AS count 
       FROM messages 
       WHERE sender_id = $1 AND created_at >= NOW() - INTERVAL '60 seconds'`,
      [senderId]
    );
    if ((countRes.rows[0]?.count || 0) >= 30) {
      throw new AppError('Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi một lát.', 429);
    }

    // 2. Prevent rapid identical duplicate spam within 3 seconds
    const duplicateRes = await db.query(
      `SELECT id FROM messages 
       WHERE sender_id = $1 AND conversation_id = $2 AND content = $3 AND created_at >= NOW() - INTERVAL '3 seconds'
       LIMIT 1`,
      [senderId, conversationId, content.trim()]
    );
    if (duplicateRes.rows.length > 0) {
      throw new AppError('Tin nhắn trùng lặp. Vui lòng không spam cùng một nội dung liên tục.', 400);
    }
  }

  /**
   * Get all conversations for current user
   */
  async getUserConversations(userId: number): Promise<ConversationSummary[]> {
    return messageRepository.getUserConversations(userId);
  }

  /**
   * Find or create a direct 1-to-1 conversation with another user
   */
  async getOrCreateConversation(
    currentUserId: number,
    recipientId: number
  ): Promise<ConversationSummary> {
    if (currentUserId === recipientId) {
      throw new AppError('Bạn không thể tự nhắn tin cho chính mình', 400);
    }

    // 1. Verify recipient user status
    const recipientRes = await db.query(
      `SELECT id, name, is_suspended FROM users WHERE id = $1`,
      [recipientId]
    );
    if (recipientRes.rows.length === 0) {
      throw new AppError('Không tìm thấy người dùng cần nhắn tin', 404);
    }
    if (recipientRes.rows[0].is_suspended) {
      throw new AppError('Tài khoản người dùng này hiện đang bị khóa tạm thời', 403);
    }

    // 2. Strict Bi-directional Block Check
    const isBlocked = await safetyService.hasBlockRelationship(currentUserId, recipientId);
    if (isBlocked) {
      throw new AppError('Không thể bắt đầu cuộc trò chuyện do giới hạn chặn người dùng', 403);
    }

    // 3. Find existing conversation or create new one
    let conversationId = await messageRepository.findDirectConversationId(currentUserId, recipientId);

    if (!conversationId) {
      conversationId = await messageRepository.createDirectConversation(currentUserId, recipientId);
    }

    // 4. Fetch full summary for current user
    const summary = await messageRepository.getConversationById(conversationId, currentUserId);
    if (!summary) {
      throw new AppError('Không thể tải thông tin cuộc trò chuyện', 500);
    }

    return summary;
  }

  /**
   * Get conversation summary by ID (verifying membership)
   */
  async getConversationDetails(
    conversationId: number,
    currentUserId: number
  ): Promise<ConversationSummary> {
    const isMember = await messageRepository.isMember(conversationId, currentUserId);
    if (!isMember) {
      throw new AppError('Bạn không có quyền truy cập cuộc trò chuyện này', 403);
    }

    const summary = await messageRepository.getConversationById(conversationId, currentUserId);
    if (!summary) {
      throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
    }

    return summary;
  }

  /**
   * Get paginated messages for a conversation
   */
  async getMessages(
    conversationId: number,
    currentUserId: number,
    limit: number = 50,
    beforeId?: number
  ): Promise<MessageWithSender[]> {
    const isMember = await messageRepository.isMember(conversationId, currentUserId);
    if (!isMember) {
      throw new AppError('Bạn không có quyền xem tin nhắn trong cuộc trò chuyện này', 403);
    }

    return messageRepository.getMessages(conversationId, limit, beforeId);
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    messageType: string = 'text'
  ): Promise<MessageWithSender> {
    // 1. Verify membership
    const isMember = await messageRepository.isMember(conversationId, senderId);
    if (!isMember) {
      throw new AppError('Bạn không phải là thành viên của cuộc trò chuyện này', 403);
    }

    // 2. Find recipient
    const otherMember = await messageRepository.getOtherMember(conversationId, senderId);
    if (!otherMember) {
      throw new AppError('Không tìm thấy thành viên nhận tin nhắn trong cuộc trò chuyện', 404);
    }

    // 3. Strict Bi-directional Block Check
    const isBlocked = await safetyService.hasBlockRelationship(senderId, otherMember.id);
    if (isBlocked) {
      throw new AppError('Không thể gửi tin nhắn do giới hạn chặn giữa hai người dùng', 403);
    }

    // 4. Rate limit / duplicate anti-spam check
    await this.checkMessageRateLimit(senderId, conversationId, content);

    // 5. Create message
    const message = await messageRepository.createMessage(
      conversationId,
      senderId,
      content,
      messageType
    );

    // 6. Broadcast real-time SSE event to recipient and sender
    const payload = {
      conversation_id: conversationId,
      message,
      last_message_text: content.substring(0, 200),
      last_message_at: message.created_at,
    };

    sseService.sendToUser(otherMember.id, 'NEW_MESSAGE', payload);
    sseService.sendToUser(senderId, 'NEW_MESSAGE', payload);

    return message;
  }

  /**
   * Mark messages in a conversation as read
   */
  async markAsRead(
    conversationId: number,
    currentUserId: number
  ): Promise<{ success: boolean; readCount: number }> {
    const isMember = await messageRepository.isMember(conversationId, currentUserId);
    if (!isMember) {
      throw new AppError('Bạn không phải là thành viên của cuộc trò chuyện này', 403);
    }

    const readMessageIds = await messageRepository.markAsRead(conversationId, currentUserId);

    // Notify other member about read status
    const otherMember = await messageRepository.getOtherMember(conversationId, currentUserId);
    if (otherMember && readMessageIds.length > 0) {
      sseService.sendToUser(otherMember.id, 'MESSAGES_READ', {
        conversation_id: conversationId,
        read_by: currentUserId,
        read_message_ids: readMessageIds,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      readCount: readMessageIds.length,
    };
  }

  /**
   * Get total unread count for badge
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    return messageRepository.getTotalUnreadCount(userId);
  }
}

export const messageService = new MessageService();
