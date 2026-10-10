import { db } from '../db';
import { PoolClient } from 'pg';
import { excludeTestDocsSQL, excludeTestCommunitySQL, excludeTestSetsSQL, excludeTestUsersSQL } from '../utils/test-filter.util';

export interface SearchDocumentsOptions {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'latest';
  page?: number;
  limit?: number;
  onlyMine?: boolean;
}

export interface SearchCommunityOptions {
  q?: string;
  type?: string;
  sort?: 'relevance' | 'latest' | 'popular';
  page?: number;
  limit?: number;
}

export interface SearchQuestionSetsOptions {
  q?: string;
  sort?: 'relevance' | 'latest';
  page?: number;
  limit?: number;
}

export interface SearchProfilesOptions {
  q?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SearchRepository {
  /**
   * Search Documents (strictly enforces privacy boundaries)
   * Never leaks private documents belonging to other users.
   * Strips out raw_text / solution_text / doc_url to protect sensitive content.
   */
  async searchDocuments(
    userId?: number,
    options?: SearchDocumentsOptions,
    client?: PoolClient
  ): Promise<PaginatedResult<any>> {
    const q = client || db;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const conditions: string[] = [];

    // Privacy & visibility rules
    if (options?.onlyMine && userId) {
      params.push(userId);
      conditions.push(`d.user_id = $${params.length}`);
    } else if (userId) {
      params.push(userId);
      conditions.push(`(d.user_id = $${params.length} OR (d.visibility = 'public' AND d.status = 'READY'))`);
    } else {
      conditions.push(`d.visibility = 'public' AND d.status = 'READY'`);
    }
    // Always exclude test documents from public searches
    conditions.push(excludeTestDocsSQL('d', false));

    // Category filter
    if (options?.category && options.category !== 'all') {
      params.push(options.category);
      conditions.push(`d.category = $${params.length}`);
    }

    // Vietnamese unaccent & trigram search
    let rawParamIndex = 0;
    if (options?.q && options.q.trim()) {
      const cleanQ = options.q.trim();
      params.push(`%${cleanQ}%`);
      const likeParamIndex = params.length;
      params.push(cleanQ);
      rawParamIndex = params.length;

      conditions.push(`(
        LOWER(immutable_unaccent(d.title)) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR LOWER(immutable_unaccent(COALESCE(d.description, ''))) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR similarity(LOWER(immutable_unaccent(d.title)), LOWER(immutable_unaccent($${rawParamIndex}))) > 0.15
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countSql = `SELECT COUNT(*)::int AS total FROM documents d ${whereClause}`;
    const countRes = await q.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    // Sort order
    let orderBy = 'ORDER BY d.created_at DESC';
    if (options?.sort === 'relevance' && rawParamIndex > 0) {
      orderBy = `ORDER BY similarity(LOWER(immutable_unaccent(d.title)), LOWER(immutable_unaccent($${rawParamIndex}))) DESC, d.created_at DESC`;
    }

    // Items query (omits raw_text, solution_text, doc_url for zero-leakage)
    params.push(limit, offset);
    const itemsSql = `
      SELECT d.id, d.user_id, d.title, d.description, d.category, d.file_type, 
             d.file_size, d.visibility, d.created_at, d.updated_at,
             u.name AS author_name, u.avatar_url AS author_avatar
      FROM documents d
      JOIN users u ON u.id = d.user_id
      ${whereClause}
      ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await q.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Search Community Resources (strictly public and active)
   * Excludes DRAFT, HIDDEN, or REMOVED content.
   */
  async searchCommunity(
    options?: SearchCommunityOptions,
    client?: PoolClient
  ): Promise<PaginatedResult<any>> {
    const q = client || db;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const conditions: string[] = [
      'cr.is_public = true', 
      'cr.is_hidden = false',
      excludeTestCommunitySQL('cr', false)
    ];

    if (options?.type && options.type !== 'all') {
      params.push(options.type);
      conditions.push(`cr.resource_type = $${params.length}`);
    }

    let rawParamIndex = 0;
    if (options?.q && options.q.trim()) {
      const cleanQ = options.q.trim();
      params.push(`%${cleanQ}%`);
      const likeParamIndex = params.length;
      params.push(cleanQ);
      rawParamIndex = params.length;

      conditions.push(`(
        LOWER(immutable_unaccent(cr.title)) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR LOWER(immutable_unaccent(COALESCE(cr.description, ''))) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR similarity(LOWER(immutable_unaccent(cr.title)), LOWER(immutable_unaccent($${rawParamIndex}))) > 0.15
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*)::int AS total FROM community_resources cr ${whereClause}`;
    const countRes = await q.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    let orderBy = 'ORDER BY cr.created_at DESC';
    if (options?.sort === 'popular') {
      orderBy = 'ORDER BY (cr.like_count * 2 + cr.save_count * 3 + cr.comment_count * 4) DESC, cr.created_at DESC';
    } else if (options?.sort === 'relevance' && rawParamIndex > 0) {
      orderBy = `ORDER BY similarity(LOWER(immutable_unaccent(cr.title)), LOWER(immutable_unaccent($${rawParamIndex}))) DESC, cr.created_at DESC`;
    }

    params.push(limit, offset);
    const itemsSql = `
      SELECT cr.id, cr.user_id, cr.resource_type, cr.resource_id, cr.title, cr.description,
             cr.tags, cr.like_count, cr.save_count, cr.comment_count, cr.created_at,
             u.name AS author_name, u.avatar_url AS author_avatar
      FROM community_resources cr
      JOIN users u ON u.id = cr.user_id
      ${whereClause}
      ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await q.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Search Question Sets (test_sets)
   * Only returns test sets belonging to current user or published in community resources.
   */
  async searchQuestionSets(
    userId?: number,
    options?: SearchQuestionSetsOptions,
    client?: PoolClient
  ): Promise<PaginatedResult<any>> {
    const q = client || db;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const conditions: string[] = ['ts.is_active = true', excludeTestSetsSQL('ts', false)];

    if (userId) {
      params.push(userId);
      conditions.push(`(
        ts.created_by = $${params.length}
        OR (
          ts.status = 'APPROVED'
          AND EXISTS (
            SELECT 1 FROM community_resources cr
            WHERE cr.resource_type = 'test_set' 
              AND cr.resource_id = ts.id 
              AND cr.is_public = true 
              AND cr.is_hidden = false
          )
        )
      )`);
    } else {
      conditions.push(`(
        ts.status = 'APPROVED'
        AND EXISTS (
          SELECT 1 FROM community_resources cr
          WHERE cr.resource_type = 'test_set' 
            AND cr.resource_id = ts.id 
            AND cr.is_public = true 
            AND cr.is_hidden = false
        )
      )`);
    }

    let rawParamIndex = 0;
    if (options?.q && options.q.trim()) {
      const cleanQ = options.q.trim();
      params.push(`%${cleanQ}%`);
      const likeParamIndex = params.length;
      params.push(cleanQ);
      rawParamIndex = params.length;

      conditions.push(`(
        LOWER(immutable_unaccent(ts.name)) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR similarity(LOWER(immutable_unaccent(ts.name)), LOWER(immutable_unaccent($${rawParamIndex}))) > 0.15
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*)::int AS total FROM test_sets ts ${whereClause}`;
    const countRes = await q.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    let orderBy = 'ORDER BY ts.created_at DESC';
    if (options?.sort === 'relevance' && rawParamIndex > 0) {
      orderBy = `ORDER BY similarity(LOWER(immutable_unaccent(ts.name)), LOWER(immutable_unaccent($${rawParamIndex}))) DESC, ts.created_at DESC`;
    }

    params.push(limit, offset);
    const itemsSql = `
      SELECT ts.id, ts.name, ts.total_questions, ts.total_score, ts.created_by, ts.created_at,
             u.name AS author_name, u.avatar_url AS author_avatar
      FROM test_sets ts
      LEFT JOIN users u ON u.id = ts.created_by
      ${whereClause}
      ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await q.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Search Public User Profiles
   * Strictly respects bi-directional block lists and suspended accounts.
   * Strips all private metadata (email, phone, password_hash, wallet_balance).
   */
  async searchProfiles(
    currentUserId?: number,
    options?: SearchProfilesOptions,
    client?: PoolClient
  ): Promise<PaginatedResult<any>> {
    const q = client || db;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const conditions: string[] = [
      'u.is_suspended = false',
      excludeTestUsersSQL('u', false)
    ];

    if (currentUserId) {
      params.push(currentUserId);
      const userIdParam = `$${params.length}`;
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE (ub.blocker_id = ${userIdParam} AND ub.blocked_id = u.id)
           OR (ub.blocker_id = u.id AND ub.blocked_id = ${userIdParam})
      )`);
    }

    let rawParamIndex = 0;
    if (options?.q && options.q.trim()) {
      const cleanQ = options.q.trim();
      params.push(`%${cleanQ}%`);
      const likeParamIndex = params.length;
      params.push(cleanQ);
      rawParamIndex = params.length;

      conditions.push(`(
        LOWER(immutable_unaccent(u.name)) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR LOWER(immutable_unaccent(COALESCE(u.bio, ''))) LIKE LOWER(immutable_unaccent($${likeParamIndex}))
        OR similarity(LOWER(immutable_unaccent(u.name)), LOWER(immutable_unaccent($${rawParamIndex}))) > 0.15
      )`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`;
    const countRes = await q.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    let orderBy = 'ORDER BY u.created_at DESC';
    if (rawParamIndex > 0) {
      orderBy = `ORDER BY similarity(LOWER(immutable_unaccent(u.name)), LOWER(immutable_unaccent($${rawParamIndex}))) DESC, u.created_at DESC`;
    }

    params.push(limit, offset);
    const itemsSql = `
      SELECT u.id, u.name, u.avatar_url, u.bio, u.role, u.created_at,
             (SELECT COUNT(*)::int FROM community_resources cr WHERE cr.user_id = u.id AND cr.is_public = true) AS public_resources_count
      FROM users u
      ${whereClause}
      ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const itemsRes = await q.query(itemsSql, params);

    return {
      items: itemsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Search suggestions for fast autocomplete dropdown
   */
  async getSuggestions(qStr: string, limit = 8, client?: PoolClient): Promise<Array<{ text: string; type: string }>> {
    const q = client || db;
    const clean = (qStr || '').trim();
    if (!clean) return [];

    const likeParam = `%${clean}%`;
    const sql = `
      (
        SELECT title AS text, 'document' AS type, 
               similarity(LOWER(immutable_unaccent(title)), LOWER(immutable_unaccent($1))) AS score
        FROM documents 
        WHERE visibility = 'public' AND status = 'READY'
          AND (LOWER(immutable_unaccent(title)) LIKE LOWER(immutable_unaccent($2)) 
               OR similarity(LOWER(immutable_unaccent(title)), LOWER(immutable_unaccent($1))) > 0.2)
        LIMIT 4
      )
      UNION ALL
      (
        SELECT title AS text, 'community' AS type,
               similarity(LOWER(immutable_unaccent(title)), LOWER(immutable_unaccent($1))) AS score
        FROM community_resources 
        WHERE is_public = true
          AND (LOWER(immutable_unaccent(title)) LIKE LOWER(immutable_unaccent($2))
               OR similarity(LOWER(immutable_unaccent(title)), LOWER(immutable_unaccent($1))) > 0.2)
        LIMIT 4
      )
      UNION ALL
      (
        SELECT name AS text, 'question_set' AS type,
               similarity(LOWER(immutable_unaccent(name)), LOWER(immutable_unaccent($1))) AS score
        FROM test_sets 
        WHERE is_active = true
          AND (LOWER(immutable_unaccent(name)) LIKE LOWER(immutable_unaccent($2))
               OR similarity(LOWER(immutable_unaccent(name)), LOWER(immutable_unaccent($1))) > 0.2)
        LIMIT 4
      )
      ORDER BY score DESC
      LIMIT $3
    `;

    const res = await q.query(sql, [clean, likeParam, limit]);
    return res.rows.map(r => ({ text: r.text, type: r.type }));
  }
}

export const searchRepository = new SearchRepository();
