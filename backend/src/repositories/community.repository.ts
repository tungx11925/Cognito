import { db } from '../db';
import { PoolClient } from 'pg';

export interface PublishResourceInput {
  userId: number;
  resourceType: 'document' | 'test_set' | 'flashcard_deck' | 'mindmap' | 'note';
  resourceId: number;
  title: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class CommunityRepository {
  async publishResource(input: PublishResourceInput, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO community_resources (user_id, resource_type, resource_id, title, description, tags, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.userId,
        input.resourceType,
        input.resourceId,
        input.title,
        input.description || null,
        input.tags || [],
        input.isPublic !== undefined ? input.isPublic : true,
      ]
    );
    return res.rows[0];
  }

  async listPublicResources(filter?: { type?: string; search?: string; limit?: number; offset?: number }, client?: PoolClient) {
    const q = client || db;
    const params: any[] = [];
    let where = 'WHERE cr.is_public = true';

    if (filter?.type && filter.type !== 'all') {
      params.push(filter.type);
      where += ` AND cr.resource_type = $${params.length}`;
    }

    if (filter?.search && filter.search.trim()) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      where += ` AND (LOWER(cr.title) LIKE $${params.length} OR LOWER(COALESCE(cr.description, '')) LIKE $${params.length})`;
    }

    const limit = filter?.limit || 20;
    const offset = filter?.offset || 0;
    params.push(limit, offset);

    const query = `
      SELECT cr.*, u.name as author_name, u.avatar_url as author_avatar
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      ${where}
      ORDER BY cr.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const res = await q.query(query, params);
    return res.rows;
  }

  async getResourceById(id: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT cr.*, u.name as author_name, u.avatar_url as author_avatar
       FROM community_resources cr
       JOIN users u ON u.id = cr.user_id
       WHERE cr.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async toggleLike(resourceId: number, userId: number, client?: PoolClient) {
    const q = client || db;
    const check = await q.query('SELECT id FROM community_likes WHERE resource_id = $1 AND user_id = $2', [resourceId, userId]);
    if (check.rows.length > 0) {
      await q.query('DELETE FROM community_likes WHERE resource_id = $1 AND user_id = $2', [resourceId, userId]);
      await q.query('UPDATE community_resources SET like_count = GREATEST(0, like_count - 1) WHERE id = $1', [resourceId]);
      return { liked: false };
    } else {
      await q.query('INSERT INTO community_likes (resource_id, user_id) VALUES ($1, $2)', [resourceId, userId]);
      await q.query('UPDATE community_resources SET like_count = like_count + 1 WHERE id = $1', [resourceId]);
      return { liked: true };
    }
  }

  async addComment(resourceId: number, userId: number, content: string, parentId?: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO community_comments (resource_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [resourceId, userId, content, parentId || null]
    );
    await q.query('UPDATE community_resources SET comment_count = comment_count + 1 WHERE id = $1', [resourceId]);
    return res.rows[0];
  }

  async listComments(resourceId: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT cc.*, u.name as author_name, u.avatar_url as author_avatar
       FROM community_comments cc
       JOIN users u ON u.id = cc.user_id
       WHERE cc.resource_id = $1
       ORDER BY cc.created_at ASC`,
      [resourceId]
    );
    return res.rows;
  }
}

export const communityRepository = new CommunityRepository();
