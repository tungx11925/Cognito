import { db } from '../db';
import { AppError } from '../utils/AppError';
import { sseService } from '../utils/sse.service';

export interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  actorId?: number | null;
}

export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

class NotificationService {
  /**
   * 1. Create a Notification
   * Checks block relationship, suspension status, and self-action suppression.
   */
  async createNotification(input: CreateNotificationInput) {
    const { userId, type, title, content, link, actorId } = input;

    // A. Self-action suppression: never notify user for their own actions
    if (actorId && actorId === userId) {
      return null;
    }

    // B. Check recipient existence & status
    const recipientRes = await db.query(
      'SELECT id, is_suspended FROM users WHERE id = $1',
      [userId]
    );
    if (recipientRes.rows.length === 0) {
      return null;
    }

    const recipient = recipientRes.rows[0];

    // C. Suspension check:
    // If recipient is suspended, suppress non-essential social notifications (like, comment, reshare, message).
    // Only allow administrative and disciplinary notifications (account_warned, account_suspended, report_resolved, system).
    const adminTypes = ['account_warned', 'account_suspended', 'report_resolved', 'system'];
    if (recipient.is_suspended && !adminTypes.includes(type)) {
      return null;
    }

    // D. Block check:
    // If an actor is involved, verify neither party has blocked the other
    if (actorId) {
      const blockRes = await db.query(
        `SELECT 1 FROM user_blocks 
         WHERE (blocker_id = $1 AND blocked_id = $2)
            OR (blocker_id = $2 AND blocked_id = $1)`,
        [actorId, userId]
      );
      if (blockRes.rows.length > 0) {
        // Block relationship active: suppress notification completely
        return null;
      }
    }

    // E. Insert notification record
    const insertRes = await db.query(
      `INSERT INTO notifications (user_id, type, title, content, link, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [userId, type, title, content, link || null]
    );

    const notification = insertRes.rows[0];

    // F. Multiplex real-time delivery via unified SSE service
    sseService.sendToUser(userId, 'NEW_NOTIFICATION', notification);

    return notification;
  }

  /**
   * 2. Get User Notifications with Pagination & Filtering
   * Strict IDOR check: scoped entirely to caller's userId
   */
  async getUserNotifications(userId: number, options: NotificationQueryOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses = ['user_id = $1'];
    const params: any[] = [userId];

    if (options.unreadOnly) {
      whereClauses.push('is_read = false');
    }

    const whereSQL = whereClauses.join(' AND ');

    // Total count
    const countRes = await db.query(
      `SELECT COUNT(*)::int as total FROM notifications WHERE ${whereSQL}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // Total unread count for user (regardless of current tab)
    const unreadRes = await db.query(
      `SELECT COUNT(*)::int as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    const unreadCount = unreadRes.rows[0]?.unread_count || 0;

    // Notifications data
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await db.query(
      `SELECT * FROM notifications 
       WHERE ${whereSQL}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return {
      notifications: dataRes.rows,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 3. Get User Unread Count
   */
  async getUnreadCount(userId: number): Promise<number> {
    const res = await db.query(
      `SELECT COUNT(*)::int as unread_count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return res.rows[0]?.unread_count || 0;
  }

  /**
   * 4. Mark Single Notification as Read
   * Strict IDOR Check: Ensures caller is the true owner
   */
  async markAsRead(userId: number, notificationId: number) {
    // Check if notification exists
    const checkRes = await db.query('SELECT user_id FROM notifications WHERE id = $1', [notificationId]);
    if (checkRes.rows.length === 0) {
      throw new AppError('Không tìm thấy thông báo', 404);
    }

    // IDOR verification
    if (checkRes.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền đánh dấu thông báo của người dùng khác', 403);
    }

    const updateRes = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );

    return updateRes.rows[0];
  }

  /**
   * 5. Mark All Notifications as Read for User
   */
  async markAllAsRead(userId: number) {
    const updateRes = await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id`,
      [userId]
    );
    return {
      success: true,
      updatedCount: updateRes.rowCount || 0,
    };
  }

  /**
   * 6. Delete Notification
   * Strict IDOR Check
   */
  async deleteNotification(userId: number, notificationId: number) {
    const checkRes = await db.query('SELECT user_id FROM notifications WHERE id = $1', [notificationId]);
    if (checkRes.rows.length === 0) {
      throw new AppError('Không tìm thấy thông báo', 404);
    }

    // IDOR verification
    if (checkRes.rows[0].user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa thông báo của người dùng khác', 403);
    }

    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);

    return { success: true, message: 'Đã xóa thông báo thành công' };
  }
}

export const notificationService = new NotificationService();
