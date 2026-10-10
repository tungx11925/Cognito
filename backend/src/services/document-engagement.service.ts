import { db, withTransaction } from '../db';
import { AppError } from '../utils/AppError';
import { notificationService } from './notification.service';

export class DocumentEngagementService {
  /**
   * Toggle Like for a Document
   */
  async toggleLike(userId: number, documentId: number) {
    const docRes = await db.query(
      `SELECT d.id, d.user_id, d.title, d.like_count, u.name as author_name 
       FROM documents d
       JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }

    const doc = docRes.rows[0];

    return await withTransaction(async (client) => {
      const checkLike = await client.query(
        'SELECT id FROM document_likes WHERE user_id = $1 AND document_id = $2',
        [userId, documentId]
      );

      let isLiked: boolean;
      let newCount: number;

      if (checkLike.rows.length > 0) {
        // Unlike
        await client.query(
          'DELETE FROM document_likes WHERE user_id = $1 AND document_id = $2',
          [userId, documentId]
        );
        const updateDoc = await client.query(
          `UPDATE documents SET like_count = GREATEST(0, like_count - 1) WHERE id = $1 RETURNING like_count`,
          [documentId]
        );
        newCount = updateDoc.rows[0].like_count;
        isLiked = false;

        // Also sync community_resources like_count if published
        await client.query(
          `UPDATE community_resources 
           SET like_count = GREATEST(0, like_count - 1) 
           WHERE resource_type = 'document' AND resource_id = $1`,
          [documentId]
        );
      } else {
        // Like
        await client.query(
          'INSERT INTO document_likes (user_id, document_id) VALUES ($1, $2)',
          [userId, documentId]
        );
        const updateDoc = await client.query(
          `UPDATE documents SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count`,
          [documentId]
        );
        newCount = updateDoc.rows[0].like_count;
        isLiked = true;

        // Sync community_resources like_count
        await client.query(
          `UPDATE community_resources 
           SET like_count = like_count + 1 
           WHERE resource_type = 'document' AND resource_id = $1`,
          [documentId]
        );

        // Notify author if liker is not author
        if (userId !== doc.user_id) {
          const userRes = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
          const likerName = userRes.rows[0]?.name || 'Một người dùng';

          await notificationService.createNotification({
            userId: doc.user_id,
            actorId: userId,
            type: 'like',
            title: 'Tài liệu của bạn nhận được lượt thích',
            content: `${likerName} đã thích tài liệu "${doc.title}" của bạn.`,
            link: `/documents/${documentId}`
          }).catch(err => console.warn('Failed to dispatch like notification:', err));
        }
      }

      return {
        isLiked,
        likeCount: newCount,
        documentId
      };
    });
  }

  /**
   * Toggle Save (Bookmark) for a Document
   */
  async toggleSave(userId: number, documentId: number) {
    const docRes = await db.query(
      `SELECT d.id, d.user_id, d.title, d.save_count 
       FROM documents d
       WHERE d.id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }

    const doc = docRes.rows[0];

    return await withTransaction(async (client) => {
      const checkSave = await client.query(
        'SELECT id FROM document_saves WHERE user_id = $1 AND document_id = $2',
        [userId, documentId]
      );

      let isSaved: boolean;
      let newCount: number;

      if (checkSave.rows.length > 0) {
        // Unsave
        await client.query(
          'DELETE FROM document_saves WHERE user_id = $1 AND document_id = $2',
          [userId, documentId]
        );
        const updateDoc = await client.query(
          `UPDATE documents SET save_count = GREATEST(0, save_count - 1) WHERE id = $1 RETURNING save_count`,
          [documentId]
        );
        newCount = updateDoc.rows[0].save_count;
        isSaved = false;

        // Sync community_resources save_count
        await client.query(
          `UPDATE community_resources 
           SET save_count = GREATEST(0, save_count - 1) 
           WHERE resource_type = 'document' AND resource_id = $1`,
          [documentId]
        );
      } else {
        // Save
        await client.query(
          'INSERT INTO document_saves (user_id, document_id) VALUES ($1, $2)',
          [userId, documentId]
        );
        const updateDoc = await client.query(
          `UPDATE documents SET save_count = save_count + 1 WHERE id = $1 RETURNING save_count`,
          [documentId]
        );
        newCount = updateDoc.rows[0].save_count;
        isSaved = true;

        // Sync community_resources save_count
        await client.query(
          `UPDATE community_resources 
           SET save_count = save_count + 1 
           WHERE resource_type = 'document' AND resource_id = $1`,
          [documentId]
        );

        // Notify author
        if (userId !== doc.user_id) {
          const userRes = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
          const saverName = userRes.rows[0]?.name || 'Một người dùng';

          await notificationService.createNotification({
            userId: doc.user_id,
            actorId: userId,
            type: 'bookmark',
            title: 'Tài liệu của bạn đã được lưu',
            content: `${saverName} đã lưu tài liệu "${doc.title}" vào danh sách học tập.`,
            link: `/documents/${documentId}`
          }).catch(err => console.warn('Failed to dispatch save notification:', err));
        }
      }

      return {
        isSaved,
        saveCount: newCount,
        documentId
      };
    });
  }

  /**
   * Get Engagement Status for a specific Document
   */
  async getEngagement(userId: number | null, documentId: number) {
    const docRes = await db.query(
      `SELECT id, like_count, save_count FROM documents WHERE id = $1`,
      [documentId]
    );

    if (docRes.rows.length === 0) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }

    const doc = docRes.rows[0];
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      const [likeRes, saveRes] = await Promise.all([
        db.query('SELECT 1 FROM document_likes WHERE user_id = $1 AND document_id = $2', [userId, documentId]),
        db.query('SELECT 1 FROM document_saves WHERE user_id = $1 AND document_id = $2', [userId, documentId])
      ]);
      isLiked = likeRes.rows.length > 0;
      isSaved = saveRes.rows.length > 0;
    }

    return {
      documentId,
      likeCount: doc.like_count || 0,
      saveCount: doc.save_count || 0,
      isLiked,
      isSaved
    };
  }

  /**
   * Get User Saved Documents (with search, category filter, and graceful unavailable state)
   */
  async getUserSavedDocuments(userId: number, options: { search?: string; category?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [userId];
    let whereConditions = [`ds.user_id = $1`];

    if (options.category && options.category !== 'all' && options.category !== 'Tất cả') {
      params.push(options.category);
      whereConditions.push(`d.category = $${params.length}`);
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      whereConditions.push(`(
        LOWER(d.title) LIKE $${params.length} OR 
        LOWER(COALESCE(d.description, '')) LIKE $${params.length}
      )`);
    }

    const whereSQL = `WHERE ${whereConditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM document_saves ds
      LEFT JOIN documents d ON d.id = ds.document_id
      ${whereSQL}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    params.push(limit, offset);
    const itemsSql = `
      SELECT 
        ds.id as save_id,
        ds.created_at as saved_at,
        d.id as document_id,
        d.title,
        d.description,
        d.category,
        d.file_type,
        d.file_size,
        d.visibility,
        d.like_count,
        d.save_count,
        d.created_at,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar,
        -- Availability check: document must exist and be accessible to this viewer
        CASE 
          WHEN d.id IS NULL THEN false
          WHEN d.user_id = $1 THEN true
          WHEN d.visibility = 'public' THEN true
          ELSE false
        END as is_available
      FROM document_saves ds
      LEFT JOIN documents d ON d.id = ds.document_id
      LEFT JOIN users u ON u.id = d.user_id
      ${whereSQL}
      ORDER BY ds.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await db.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Get User Liked Documents
   */
  async getUserLikedDocuments(userId: number, options: { search?: string; category?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [userId];
    let whereConditions = [`dl.user_id = $1`];

    if (options.category && options.category !== 'all' && options.category !== 'Tất cả') {
      params.push(options.category);
      whereConditions.push(`d.category = $${params.length}`);
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      whereConditions.push(`(
        LOWER(d.title) LIKE $${params.length} OR 
        LOWER(COALESCE(d.description, '')) LIKE $${params.length}
      )`);
    }

    const whereSQL = `WHERE ${whereConditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM document_likes dl
      LEFT JOIN documents d ON d.id = dl.document_id
      ${whereSQL}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    params.push(limit, offset);
    const itemsSql = `
      SELECT 
        dl.id as like_id,
        dl.created_at as liked_at,
        d.id as document_id,
        d.title,
        d.description,
        d.category,
        d.file_type,
        d.file_size,
        d.visibility,
        d.like_count,
        d.save_count,
        d.created_at,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar,
        CASE 
          WHEN d.id IS NULL THEN false
          WHEN d.user_id = $1 THEN true
          WHEN d.visibility = 'public' THEN true
          ELSE false
        END as is_available
      FROM document_likes dl
      LEFT JOIN documents d ON d.id = dl.document_id
      LEFT JOIN users u ON u.id = d.user_id
      ${whereSQL}
      ORDER BY dl.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await db.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
}

export const documentEngagementService = new DocumentEngagementService();
