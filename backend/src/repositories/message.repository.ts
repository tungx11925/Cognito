import { db, withTransaction } from '../db';

export interface ConversationSummary {
  id: number;
  last_message_text: string | null;
  last_message_at: string;
  last_sender_id: number | null;
  unread_count: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
  other_user: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    headline: string | null;
    is_suspended: boolean;
  };
  is_blocked: boolean;
}

export interface MessageWithSender {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

class MessageRepository {
  /**
   * Check if a 1-to-1 conversation already exists between two users
   */
  async findDirectConversationId(user1Id: number, user2Id: number): Promise<number | null> {
    const res = await db.query(
      `SELECT cm1.conversation_id
       FROM conversation_members cm1
       JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
       WHERE cm1.user_id = $1 AND cm2.user_id = $2
       LIMIT 1`,
      [user1Id, user2Id]
    );
    return res.rows[0]?.conversation_id || null;
  }

  /**
   * Create a new direct 1-to-1 conversation between user1 and user2 inside a transaction
   */
  async createDirectConversation(user1Id: number, user2Id: number): Promise<number> {
    return withTransaction(async (client) => {
      const convRes = await client.query(
        `INSERT INTO conversations (last_message_text, last_message_at, created_at, updated_at)
         VALUES (NULL, NOW(), NOW(), NOW())
         RETURNING id`
      );
      const conversationId = convRes.rows[0].id;

      // Add user1 and user2
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, unread_count, last_read_at, joined_at)
         VALUES ($1, $2, 0, NOW(), NOW()), ($1, $3, 0, NOW(), NOW())`,
        [conversationId, user1Id, user2Id]
      );

      return conversationId;
    });
  }

  /**
   * Check if a user is a member of a conversation
   */
  async isMember(conversationId: number, userId: number): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
      [conversationId, userId]
    );
    return res.rows.length > 0;
  }

  /**
   * Get list of conversations for a user
   */
  async getUserConversations(userId: number): Promise<ConversationSummary[]> {
    const res = await db.query(
      `SELECT 
        c.id,
        c.last_message_text,
        c.last_message_at,
        c.last_sender_id,
        c.created_at,
        c.updated_at,
        my_cm.unread_count,
        my_cm.last_read_at,
        other_u.id AS other_user_id,
        other_u.name AS other_user_name,
        other_u.email AS other_user_email,
        other_u.avatar_url AS other_user_avatar,
        other_u.bio AS other_user_bio,
        other_u.headline AS other_user_headline,
        COALESCE(other_u.is_suspended, false) AS other_user_suspended,
        CASE 
          WHEN ub.id IS NOT NULL THEN true 
          ELSE false 
        END AS is_blocked
      FROM conversation_members my_cm
      JOIN conversations c ON c.id = my_cm.conversation_id
      JOIN conversation_members other_cm ON other_cm.conversation_id = c.id AND other_cm.user_id != $1
      JOIN users other_u ON other_u.id = other_cm.user_id
      LEFT JOIN user_blocks ub ON 
        ((ub.blocker_id = $1 AND ub.blocked_id = other_u.id) OR (ub.blocker_id = other_u.id AND ub.blocked_id = $1))
      WHERE my_cm.user_id = $1
      ORDER BY c.last_message_at DESC`,
      [userId]
    );

    return res.rows.map((row) => ({
      id: row.id,
      last_message_text: row.last_message_text,
      last_message_at: row.last_message_at,
      last_sender_id: row.last_sender_id,
      unread_count: row.unread_count,
      last_read_at: row.last_read_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      other_user: {
        id: row.other_user_id,
        name: row.other_user_name,
        email: row.other_user_email,
        avatar_url: row.other_user_avatar,
        bio: row.other_user_bio,
        headline: row.other_user_headline,
        is_suspended: row.other_user_suspended,
      },
      is_blocked: row.is_blocked,
    }));
  }

  /**
   * Get a conversation summary by id for a user
   */
  async getConversationById(conversationId: number, userId: number): Promise<ConversationSummary | null> {
    const res = await db.query(
      `SELECT 
        c.id,
        c.last_message_text,
        c.last_message_at,
        c.last_sender_id,
        c.created_at,
        c.updated_at,
        my_cm.unread_count,
        my_cm.last_read_at,
        other_u.id AS other_user_id,
        other_u.name AS other_user_name,
        other_u.email AS other_user_email,
        other_u.avatar_url AS other_user_avatar,
        other_u.bio AS other_user_bio,
        other_u.headline AS other_user_headline,
        COALESCE(other_u.is_suspended, false) AS other_user_suspended,
        CASE 
          WHEN ub.id IS NOT NULL THEN true 
          ELSE false 
        END AS is_blocked
      FROM conversations c
      JOIN conversation_members my_cm ON my_cm.conversation_id = c.id AND my_cm.user_id = $1
      JOIN conversation_members other_cm ON other_cm.conversation_id = c.id AND other_cm.user_id != $1
      JOIN users other_u ON other_u.id = other_cm.user_id
      LEFT JOIN user_blocks ub ON 
        ((ub.blocker_id = $1 AND ub.blocked_id = other_u.id) OR (ub.blocker_id = other_u.id AND ub.blocked_id = $1))
      WHERE c.id = $2`,
      [userId, conversationId]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: row.id,
      last_message_text: row.last_message_text,
      last_message_at: row.last_message_at,
      last_sender_id: row.last_sender_id,
      unread_count: row.unread_count,
      last_read_at: row.last_read_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      other_user: {
        id: row.other_user_id,
        name: row.other_user_name,
        email: row.other_user_email,
        avatar_url: row.other_user_avatar,
        bio: row.other_user_bio,
        headline: row.other_user_headline,
        is_suspended: row.other_user_suspended,
      },
      is_blocked: row.is_blocked,
    };
  }

  /**
   * Get the other member of a conversation
   */
  async getOtherMember(conversationId: number, currentUserId: number): Promise<{ id: number; name: string } | null> {
    const res = await db.query(
      `SELECT u.id, u.name
       FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.conversation_id = $1 AND cm.user_id != $2
       LIMIT 1`,
      [conversationId, currentUserId]
    );
    return res.rows[0] || null;
  }

  /**
   * Get paginated messages for a conversation
   */
  async getMessages(
    conversationId: number,
    limit: number = 50,
    beforeId?: number
  ): Promise<MessageWithSender[]> {
    const params: any[] = [conversationId, limit];
    let query = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.is_read,
        m.created_at,
        u.name AS sender_name,
        u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
    `;

    if (beforeId) {
      params.push(beforeId);
      query += ` AND m.id < $${params.length}`;
    }

    query += ` ORDER BY m.id DESC LIMIT $2`;

    const res = await db.query(query, params);

    // Map and reverse so oldest is first
    const list = res.rows.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      message_type: row.message_type,
      is_read: row.is_read,
      created_at: row.created_at,
      sender: {
        id: row.sender_id,
        name: row.sender_name,
        avatar_url: row.sender_avatar,
      },
    }));

    return list.reverse();
  }

  /**
   * Insert a message and update conversation metadata inside a transaction
   */
  async createMessage(
    conversationId: number,
    senderId: number,
    content: string,
    messageType: string = 'text'
  ): Promise<MessageWithSender> {
    return withTransaction(async (client) => {
      // 1. Insert message
      const msgRes = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type, is_read, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())
         RETURNING id, conversation_id, sender_id, content, message_type, is_read, created_at`,
        [conversationId, senderId, content, messageType]
      );
      const msg = msgRes.rows[0];

      // 2. Update conversation last message info
      await client.query(
        `UPDATE conversations 
         SET last_message_text = $1, last_message_at = NOW(), last_sender_id = $2, updated_at = NOW()
         WHERE id = $3`,
        [content.substring(0, 200), senderId, conversationId]
      );

      // 3. Increment unread count for other members
      await client.query(
        `UPDATE conversation_members 
         SET unread_count = unread_count + 1 
         WHERE conversation_id = $1 AND user_id != $2`,
        [conversationId, senderId]
      );

      // 4. Fetch sender info
      const senderRes = await client.query(
        `SELECT id, name, avatar_url FROM users WHERE id = $1`,
        [senderId]
      );
      const sender = senderRes.rows[0];

      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type,
        is_read: msg.is_read,
        created_at: msg.created_at,
        sender: {
          id: sender.id,
          name: sender.name,
          avatar_url: sender.avatar_url,
        },
      };
    });
  }

  /**
   * Mark conversation messages as read and reset unread_count for user
   */
  async markAsRead(conversationId: number, userId: number): Promise<number[]> {
    return withTransaction(async (client) => {
      // Reset member unread_count and update last_read_at
      await client.query(
        `UPDATE conversation_members 
         SET unread_count = 0, last_read_at = NOW() 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      // Mark unread messages sent by others as read
      const updatedRes = await client.query(
        `UPDATE messages 
         SET is_read = TRUE 
         WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE
         RETURNING id`,
        [conversationId, userId]
      );
      const readMessageIds: number[] = updatedRes.rows.map((r: { id: number }) => r.id);

      // Record reads in message_reads
      for (const msgId of readMessageIds) {
        await client.query(
          `INSERT INTO message_reads (message_id, user_id, read_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [msgId, userId]
        );
      }

      return readMessageIds;
    });
  }

  /**
   * Get total unread count across all conversations for a user
   */
  async getTotalUnreadCount(userId: number): Promise<number> {
    const res = await db.query(
      `SELECT COALESCE(SUM(unread_count), 0)::int AS total_unread 
       FROM conversation_members 
       WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0]?.total_unread || 0;
  }
}

export const messageRepository = new MessageRepository();
