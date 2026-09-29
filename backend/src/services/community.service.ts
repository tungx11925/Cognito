import { db } from '../db';
import { AppError } from '../utils/AppError';
import { PublishResourceInput, CommunityFeedQuery } from '../schemas/community.schema';
import { safetyService } from './safety.service';

export class CommunityService {
  /**
   * Helper: Check if underlying resource exists and user is owner
   */
  private async verifyUnderlyingOwnership(userId: number, resourceType: string, resourceId: number) {
    if (resourceType === 'document') {
      const res = await db.query('SELECT id, user_id, title, description, category FROM documents WHERE id = $1', [resourceId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy tài liệu gốc', 404);
      if (res.rows[0].user_id !== userId) throw new AppError('Bạn không có quyền đăng tài liệu của người khác', 403);
      return res.rows[0];
    } else if (resourceType === 'test_set') {
      const res = await db.query('SELECT id, created_by as user_id, name as title, status FROM test_sets WHERE id = $1', [resourceId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy bộ đề thi gốc', 404);
      if (res.rows[0].user_id !== userId) throw new AppError('Bạn không có quyền đăng đề thi của người khác', 403);
      if (res.rows[0].status !== 'APPROVED') {
        throw new AppError('Chỉ bộ đề thi đã được duyệt (APPROVED) mới được phép xuất bản lên Cộng đồng', 400);
      }
      return res.rows[0];
    } else if (resourceType === 'mindmap') {
      const res = await db.query('SELECT id, user_id, title FROM mindmaps WHERE id = $1', [resourceId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy sơ đồ tư duy gốc', 404);
      if (res.rows[0].user_id !== userId) throw new AppError('Bạn không có quyền đăng sơ đồ tư duy của người khác', 403);
      return res.rows[0];
    } else if (resourceType === 'flashcard_deck') {
      const res = await db.query('SELECT id, user_id, name as title, description FROM flashcard_decks WHERE id = $1', [resourceId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy bộ thẻ ghi nhớ gốc', 404);
      if (res.rows[0].user_id !== userId) throw new AppError('Bạn không có quyền đăng bộ thẻ của người khác', 403);
      return res.rows[0];
    }
    throw new AppError('Loại tài nguyên không được hỗ trợ', 400);
  }

  /**
   * Check whether the underlying entity of a community resource still exists
   */
  async checkUnderlyingAvailability(resourceType: string, resourceId: number): Promise<boolean> {
    if (resourceType === 'document') {
      const res = await db.query('SELECT 1 FROM documents WHERE id = $1', [resourceId]);
      return res.rows.length > 0;
    } else if (resourceType === 'test_set') {
      const res = await db.query('SELECT 1 FROM test_sets WHERE id = $1', [resourceId]);
      return res.rows.length > 0;
    } else if (resourceType === 'mindmap') {
      const res = await db.query('SELECT 1 FROM mindmaps WHERE id = $1', [resourceId]);
      return res.rows.length > 0;
    } else if (resourceType === 'flashcard_deck') {
      const res = await db.query('SELECT 1 FROM flashcard_decks WHERE id = $1', [resourceId]);
      return res.rows.length > 0;
    }
    return false;
  }

  /**
   * 1. Publish Personal Resource to Community
   */
  async publishResource(userId: number, input: PublishResourceInput) {
    await safetyService.checkPublishRateLimit(userId);
    const underlying = await this.verifyUnderlyingOwnership(userId, input.resourceType, input.resourceId);

    // If publishing document, mark document as public & community_published
    if (input.resourceType === 'document') {
      await db.query(
        `UPDATE documents SET is_community_published = true, visibility = 'public' WHERE id = $1`,
        [input.resourceId]
      );
    } else if (input.resourceType === 'flashcard_deck') {
      await db.query(
        `UPDATE flashcard_decks SET visibility = 'public' WHERE id = $1`,
        [input.resourceId]
      );
    }

    const title = input.title?.trim() || underlying.title || 'Tài nguyên học tập';
    const description = input.description !== undefined ? input.description : (underlying.description || '');
    const category = input.category || underlying.category || 'Chung';
    const tags = Array.isArray(input.tags) ? input.tags : [];
    const isPublic = input.isPublic !== undefined ? input.isPublic : true;

    // Check if already published by this user
    const existing = await db.query(
      `SELECT id FROM community_resources 
       WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3 AND is_reshare = false`,
      [userId, input.resourceType, input.resourceId]
    );

    let published;
    if (existing.rows.length > 0) {
      const updateRes = await db.query(
        `UPDATE community_resources 
         SET title = $1, description = $2, category = $3, tags = $4, is_public = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [title, description, category, tags, isPublic, existing.rows[0].id]
      );
      published = updateRes.rows[0];
    } else {
      const insertRes = await db.query(
        `INSERT INTO community_resources (
          user_id, resource_type, resource_id, title, description, category, tags, is_public
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [userId, input.resourceType, input.resourceId, title, description, category, tags, isPublic]
      );
      published = insertRes.rows[0];
    }

    return published;
  }

  /**
   * 2. Unpublish / Remove Resource from Community
   */
  async unpublishResource(userId: number, resourceId: number, userRole?: string) {
    const res = await db.query('SELECT * FROM community_resources WHERE id = $1', [resourceId]);
    if (res.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên cộng đồng', 404);
    }

    const resource = res.rows[0];
    const isOwner = resource.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('Bạn không có quyền gỡ tài nguyên này', 403);
    }

    await db.query('DELETE FROM community_resources WHERE id = $1', [resourceId]);

    // If it was a primary document publication, update documents table
    if (!resource.is_reshare && resource.resource_type === 'document') {
      await db.query(
        `UPDATE documents SET is_community_published = false WHERE id = $1`,
        [resource.resource_id]
      );
    }

    return { success: true, message: 'Đã gỡ tài nguyên khỏi cộng đồng' };
  }

  /**
   * 3. Community Feed (Recent, Popular, Saved, Search, Category, Type)
   */
  async getCommunityFeed(userId: number | null, query: CommunityFeedQuery) {
    const { tab = 'recent', type = 'all', category, search, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let whereClauses = ['cr.is_public = true', 'cr.is_hidden = false'];

    // Block relationship filter: hide resources from blocked users and users who blocked the viewer
    if (userId) {
      params.push(userId);
      const bIdx = params.length;
      whereClauses.push(`NOT EXISTS (
        SELECT 1 FROM user_blocks ub 
        WHERE (ub.blocker_id = $${bIdx} AND ub.blocked_id = cr.user_id)
           OR (ub.blocker_id = cr.user_id AND ub.blocked_id = $${bIdx})
      )`);
    }

    // Tab filter
    if (tab === 'saved') {
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập để xem danh sách tài nguyên đã lưu', 401);
      }
      params.push(userId);
      whereClauses.push(`EXISTS (SELECT 1 FROM community_saves cs WHERE cs.resource_id = cr.id AND cs.user_id = $${params.length})`);
    }

    // Type filter
    if (type && type !== 'all') {
      params.push(type);
      whereClauses.push(`cr.resource_type = $${params.length}`);
    }

    // Category filter
    if (category && category !== 'all' && category !== 'Tất cả') {
      params.push(category);
      whereClauses.push(`cr.category ILIKE $${params.length}`);
    }

    // Search filter
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const sIdx = params.length;
      whereClauses.push(`(
        LOWER(cr.title) LIKE $${sIdx} OR 
        LOWER(COALESCE(cr.description, '')) LIKE $${sIdx} OR
        LOWER(COALESCE(cr.reshare_note, '')) LIKE $${sIdx} OR
        array_to_string(cr.tags, ' ') ILIKE $${sIdx}
      )`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Ordering logic
    let orderSQL = 'ORDER BY cr.created_at DESC';
    if (tab === 'popular') {
      // Engagement formula: Likes (x3) + Saves (x5) + Views (x1)
      orderSQL = 'ORDER BY (cr.like_count * 3 + cr.save_count * 5 + cr.view_count) DESC, cr.created_at DESC';
    } else if (tab === 'saved') {
      orderSQL = 'ORDER BY cr.created_at DESC';
    }

    // Total count query
    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM community_resources cr
      ${whereSQL}
    `;
    const countResult = await db.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    // Data query with author info and reshare attribution
    const userParam = userId ? userId : null;
    params.push(userParam);
    const userIdx = params.length;

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataQuery = `
      SELECT 
        cr.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        orig_u.name as original_author_name,
        orig_u.avatar_url as original_author_avatar,
        orig_cr.title as original_resource_title,
        CASE WHEN $${userIdx}::int IS NOT NULL THEN
          EXISTS(SELECT 1 FROM community_likes cl WHERE cl.resource_id = cr.id AND cl.user_id = $${userIdx})
        ELSE false END as has_liked,
        CASE WHEN $${userIdx}::int IS NOT NULL THEN
          EXISTS(SELECT 1 FROM community_saves cs WHERE cs.resource_id = cr.id AND cs.user_id = $${userIdx})
        ELSE false END as has_saved
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      LEFT JOIN users orig_u ON orig_u.id = cr.original_author_id
      LEFT JOIN community_resources orig_cr ON orig_cr.id = cr.original_resource_id
      ${whereSQL}
      ${orderSQL}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await db.query(dataQuery, params);

    // Verify availability for each item (detect deleted original resources gracefully)
    const items = await Promise.all(
      result.rows.map(async (row) => {
        const isAvailable = await this.checkUnderlyingAvailability(row.resource_type, row.resource_id);
        const saveCount = Number(row.save_count ?? 0);
        return {
          ...row,
          has_liked: !!row.has_liked,
          has_saved: !!row.has_saved,
          is_available: isAvailable,
          status: isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
          likes: Number(row.like_count ?? 0),
          saves: saveCount,
          save_count: saveCount,
          forks: saveCount,
          views: Number(row.view_count ?? 0),
        };
      })
    );

    return {
      resources: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 4. Get Community Resource Detail & Study Target
   */
  async getResourceDetail(resourceId: number, userId: number | null) {
    const params = [resourceId, userId || null];
    const query = `
      SELECT 
        cr.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        orig_u.name as original_author_name,
        orig_u.avatar_url as original_author_avatar,
        orig_cr.title as original_resource_title,
        CASE WHEN $2::int IS NOT NULL THEN
          EXISTS(SELECT 1 FROM community_likes cl WHERE cl.resource_id = cr.id AND cl.user_id = $2)
        ELSE false END as has_liked,
        CASE WHEN $2::int IS NOT NULL THEN
          EXISTS(SELECT 1 FROM community_saves cs WHERE cs.resource_id = cr.id AND cs.user_id = $2)
        ELSE false END as has_saved
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      LEFT JOIN users orig_u ON orig_u.id = cr.original_author_id
      LEFT JOIN community_resources orig_cr ON orig_cr.id = cr.original_resource_id
      WHERE cr.id = $1
    `;

    const res = await db.query(query, params);
    if (res.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên cộng đồng', 404);
    }

    const resource = res.rows[0];

    // Check if hidden by moderation
    if (resource.is_hidden && (!userId || userId !== resource.user_id)) {
      throw new AppError('Tài nguyên này hiện đang bị ẩn do kiểm duyệt hoặc vi phạm chính sách', 404);
    }

    // Check block relationship
    if (userId && (await safetyService.hasBlockRelationship(userId, resource.user_id))) {
      throw new AppError('Bạn không thể xem tài nguyên này do có tương tác chặn giữa hai người dùng', 403);
    }

    // Increment view count
    await db.query('UPDATE community_resources SET view_count = view_count + 1 WHERE id = $1', [resourceId]);
    resource.view_count = Number(resource.view_count) + 1;

    // Check underlying entity availability and construct direct study URL
    const isAvailable = await this.checkUnderlyingAvailability(resource.resource_type, resource.resource_id);
    resource.is_available = isAvailable;
    resource.status = isAvailable ? 'AVAILABLE' : 'UNAVAILABLE';

    if (isAvailable) {
      if (resource.resource_type === 'document') {
        resource.study_url = `/viewer/${resource.resource_id}`;
      } else if (resource.resource_type === 'test_set') {
        resource.study_url = `/quiz/${resource.resource_id}`;
      } else if (resource.resource_type === 'mindmap') {
        resource.study_url = `/mindmap?id=${resource.resource_id}`;
      } else if (resource.resource_type === 'flashcard_deck') {
        resource.study_url = `/flashcards/${resource.resource_id}`;
      }
    } else {
      resource.study_url = null;
      resource.unavailable_reason = 'Tài liệu gốc đã bị xóa hoặc ngừng chia sẻ bởi tác giả';
    }

    const saveCount = Number(resource.save_count ?? 0);
    resource.likes = Number(resource.like_count ?? 0);
    resource.saves = saveCount;
    resource.save_count = saveCount;
    resource.forks = saveCount;
    resource.views = Number(resource.view_count ?? 0);

    return resource;
  }

  /**
   * 5. Toggle Like
   */
  async toggleLike(userId: number, resourceId: number) {
    const resCheck = await db.query('SELECT id, user_id, is_hidden FROM community_resources WHERE id = $1', [resourceId]);
    if (resCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên', 404);
    }

    const resource = resCheck.rows[0];
    if (resource.is_hidden) {
      throw new AppError('Tài nguyên này hiện đang bị ẩn', 400);
    }

    if (await safetyService.hasBlockRelationship(userId, resource.user_id)) {
      throw new AppError('Bạn không thể tương tác với tài nguyên của người dùng này', 403);
    }

    const likeCheck = await db.query(
      'SELECT id FROM community_likes WHERE resource_id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    let liked = false;
    if (likeCheck.rows.length > 0) {
      await db.query('DELETE FROM community_likes WHERE resource_id = $1 AND user_id = $2', [resourceId, userId]);
      await db.query('UPDATE community_resources SET like_count = GREATEST(0, like_count - 1) WHERE id = $1', [resourceId]);
      liked = false;
    } else {
      await db.query('INSERT INTO community_likes (resource_id, user_id) VALUES ($1, $2)', [resourceId, userId]);
      await db.query('UPDATE community_resources SET like_count = like_count + 1 WHERE id = $1', [resourceId]);
      liked = true;
    }

    const updated = await db.query('SELECT like_count FROM community_resources WHERE id = $1', [resourceId]);
    return { liked, like_count: updated.rows[0].like_count };
  }

  /**
   * 6. Toggle Save (Reference Only — Zero Data Duplication)
   */
  async toggleSave(userId: number, resourceId: number) {
    const resCheck = await db.query('SELECT id, user_id, is_hidden FROM community_resources WHERE id = $1', [resourceId]);
    if (resCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên', 404);
    }

    const resource = resCheck.rows[0];
    if (resource.is_hidden) {
      throw new AppError('Tài nguyên này hiện đang bị ẩn', 400);
    }

    if (await safetyService.hasBlockRelationship(userId, resource.user_id)) {
      throw new AppError('Bạn không thể tương tác với tài nguyên của người dùng này', 403);
    }

    const saveCheck = await db.query(
      'SELECT id FROM community_saves WHERE resource_id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    let saved = false;
    if (saveCheck.rows.length > 0) {
      await db.query('DELETE FROM community_saves WHERE resource_id = $1 AND user_id = $2', [resourceId, userId]);
      await db.query('UPDATE community_resources SET save_count = GREATEST(0, save_count - 1) WHERE id = $1', [resourceId]);
      saved = false;
    } else {
      await db.query('INSERT INTO community_saves (resource_id, user_id) VALUES ($1, $2)', [resourceId, userId]);
      await db.query('UPDATE community_resources SET save_count = save_count + 1 WHERE id = $1', [resourceId]);
      saved = true;
    }

    const updated = await db.query('SELECT save_count FROM community_resources WHERE id = $1', [resourceId]);
    const count = Number(updated.rows[0]?.save_count || 0);
    return { saved, save_count: count, forks: count, saves: count };
  }

  /**
   * 7. Reshare with Strict Attribution
   * Preserves: Original Author, Original Resource, Reshared By
   */
  async reshareResource(userId: number, resourceId: number, reshareNote?: string) {
    const targetCheck = await db.query(
      `SELECT cr.*, u.name as author_name 
       FROM community_resources cr
       JOIN users u ON u.id = cr.user_id
       WHERE cr.id = $1 AND cr.is_public = true AND cr.is_hidden = false`,
      [resourceId]
    );

    if (targetCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên để chia sẻ lại hoặc tài nguyên đã bị ẩn', 404);
    }

    const target = targetCheck.rows[0];

    // Determine original attribution
    const originalResourceId = target.is_reshare ? target.original_resource_id : target.id;
    const originalAuthorId = target.is_reshare ? target.original_author_id : target.user_id;

    // Check block relationship with target author or original author
    if (await safetyService.hasBlockRelationship(userId, target.user_id)) {
      throw new AppError('Bạn không thể chia sẻ lại tài nguyên của người dùng này', 403);
    }
    if (originalAuthorId && (await safetyService.hasBlockRelationship(userId, originalAuthorId))) {
      throw new AppError('Bạn không thể chia sẻ lại tài nguyên của tác giả gốc do quan hệ chặn', 403);
    }

    // Check if user already reshared this resource
    const existingReshare = await db.query(
      `SELECT id FROM community_resources 
       WHERE user_id = $1 AND is_reshare = true AND original_resource_id = $2`,
      [userId, originalResourceId]
    );

    if (existingReshare.rows.length > 0) {
      throw new AppError('Bạn đã chia sẻ lại tài nguyên này trên trang cộng đồng rồi', 400);
    }

    const insertRes = await db.query(
      `INSERT INTO community_resources (
        user_id, resource_type, resource_id, title, description, category, tags,
        is_reshare, original_resource_id, original_author_id, reshare_note, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, true)
      RETURNING *`,
      [
        userId,
        target.resource_type,
        target.resource_id,
        target.title,
        target.description,
        target.category,
        target.tags,
        originalResourceId,
        originalAuthorId,
        reshareNote?.trim() || null,
      ]
    );

    return insertRes.rows[0];
  }

  /**
   * 8. Comments CRUD
   */
  async addComment(userId: number, resourceId: number, content: string, parentId?: number | null) {
    // 1. Anti-spam & rate limit check
    await safetyService.checkCommentSpamAndRateLimit(userId, resourceId, content);

    // 2. Resource check & hidden check
    const resCheck = await db.query('SELECT id, user_id, is_hidden FROM community_resources WHERE id = $1', [resourceId]);
    if (resCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy tài nguyên', 404);
    }
    const resource = resCheck.rows[0];
    if (resource.is_hidden) {
      throw new AppError('Tài nguyên này hiện đang bị ẩn, không thể bình luận', 400);
    }

    // 3. Block check against post author
    if (await safetyService.hasBlockRelationship(userId, resource.user_id)) {
      throw new AppError('Bạn không thể bình luận trên bài viết của người dùng này', 403);
    }

    // 4. Parent comment check & block check
    if (parentId) {
      const parentCheck = await db.query(
        'SELECT id, user_id, is_hidden FROM community_comments WHERE id = $1 AND resource_id = $2',
        [parentId, resourceId]
      );
      if (parentCheck.rows.length === 0) {
        throw new AppError('Bình luận cha không tồn tại', 404);
      }
      const parent = parentCheck.rows[0];
      if (parent.is_hidden) {
        throw new AppError('Bình luận cha đã bị ẩn, không thể trả lời', 400);
      }
      if (await safetyService.hasBlockRelationship(userId, parent.user_id)) {
        throw new AppError('Bạn không thể trả lời bình luận của người dùng này', 403);
      }
    }

    const insertRes = await db.query(
      `INSERT INTO community_comments (resource_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [resourceId, userId, content.trim(), parentId || null]
    );

    await db.query('UPDATE community_resources SET comment_count = comment_count + 1 WHERE id = $1', [resourceId]);

    const userRes = await db.query('SELECT name as author_name, avatar_url as author_avatar FROM users WHERE id = $1', [userId]);

    return {
      ...insertRes.rows[0],
      author_name: userRes.rows[0]?.author_name,
      author_avatar: userRes.rows[0]?.author_avatar,
    };
  }

  async listComments(resourceId: number, viewerId?: number | null) {
    const params: any[] = [resourceId];
    let blockFilter = '';

    if (viewerId) {
      params.push(viewerId);
      blockFilter = `AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub 
        WHERE (ub.blocker_id = $2 AND ub.blocked_id = cc.user_id)
           OR (ub.blocker_id = cc.user_id AND ub.blocked_id = $2)
      )`;
    }

    const res = await db.query(
      `SELECT 
        cc.*,
        u.name as author_name,
        u.avatar_url as author_avatar
       FROM community_comments cc
       JOIN users u ON u.id = cc.user_id
       WHERE cc.resource_id = $1 AND cc.is_hidden = false
       ${blockFilter}
       ORDER BY cc.created_at ASC`,
      params
    );
    return res.rows;
  }

  async deleteComment(userId: number, commentId: number, userRole?: string) {
    const check = await db.query('SELECT * FROM community_comments WHERE id = $1', [commentId]);
    if (check.rows.length === 0) {
      throw new AppError('Không tìm thấy bình luận', 404);
    }

    const comment = check.rows[0];
    const isOwner = comment.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('Bạn không có quyền xóa bình luận này', 403);
    }

    await db.query('DELETE FROM community_comments WHERE id = $1', [commentId]);
    await db.query('UPDATE community_resources SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1', [comment.resource_id]);

    return { success: true, message: 'Đã xóa bình luận' };
  }

  /**
   * 9. Helper: List User's Personal Resources available for publishing
   */
  async getUserPersonalResources(userId: number) {
    const [docs, quizzes, mindmaps, decks] = await Promise.all([
      db.query(`SELECT id, title, description, category, created_at, 'document' as resource_type FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]),
      db.query(`SELECT id, name as title, created_at, 'test_set' as resource_type FROM test_sets WHERE created_by = $1 AND status = 'APPROVED' ORDER BY created_at DESC LIMIT 50`, [userId]),
      db.query(`SELECT id, title, created_at, 'mindmap' as resource_type FROM mindmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]),
      db.query(`SELECT id, name as title, description, created_at, 'flashcard_deck' as resource_type FROM flashcard_decks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]),
    ]);

    return {
      documents: docs.rows,
      quizzes: quizzes.rows,
      mindmaps: mindmaps.rows,
      flashcard_decks: decks.rows,
    };
  }
}

export const communityService = new CommunityService();
