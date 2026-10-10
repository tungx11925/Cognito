import { db, withTransaction } from '../db';
import { PoolClient } from 'pg';

export class AdminRepository {
  /**
   * 1. Get dashboard platform analytics raw data
   */
  async getDashboardMetricsRaw() {
    // GAP-09: Thực thi song song toàn bộ 9 câu truy vấn phân tích bằng Promise.all thay vì tuần tự
    const [
      userMetricsRes,
      subMetricsRes,
      plansBreakdownRes,
      ordersRevRes,
      monthlyRevRes,
      contentStatsRes,
      aiUsageRes,
      moderationRes,
      recentOrdersRes,
    ] = await Promise.all([
      // 1. User population metrics
      db.query(
        `SELECT 
           COUNT(*)::int as total_users,
           COUNT(CASE WHEN (is_suspended IS NULL OR is_suspended = false) THEN 1 END)::int as active_users,
           COUNT(CASE WHEN is_suspended = true THEN 1 END)::int as suspended_users,
           COUNT(CASE WHEN is_premium = true AND (premium_until IS NULL OR premium_until > CURRENT_TIMESTAMP) THEN 1 END)::int as premium_users,
           COUNT(CASE WHEN (is_premium = false OR is_premium IS NULL OR (premium_until IS NOT NULL AND premium_until <= CURRENT_TIMESTAMP)) THEN 1 END)::int as free_users,
           COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END)::int as new_users_7d,
           COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END)::int as new_users_30d
         FROM users 
         WHERE email != 'admin'`
      ),

      // 2. Subscriptions metrics
      db.query(
        `SELECT 
           COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active_subs,
           COUNT(CASE WHEN status = 'PAST_DUE' THEN 1 END)::int as past_due_subs,
           COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int as cancelled_subs,
           COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END)::int as expired_subs,
           COUNT(*)::int as total_sub_records
         FROM subscriptions`
      ),

      // 3. Active subscriptions breakdown by plan
      db.query(
        `SELECT 
           p.id as plan_id,
           p.code as plan_code,
           p.name as plan_name,
           p.price,
           p.interval,
           COUNT(s.id)::int as active_count
         FROM subscription_plans p
         LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'ACTIVE'
         GROUP BY p.id, p.code, p.name, p.price, p.interval
         ORDER BY p.price ASC`
      ),

      // 4. Total revenue from completed payment orders
      db.query(
        `SELECT 
           COALESCE(SUM(amount), 0)::numeric as orders_total,
           COUNT(*)::int as completed_orders_count
         FROM payment_orders 
         WHERE status = 'COMPLETED'`
      ),

      // 5. 6-month monthly revenue trend
      db.query(`
        SELECT 
          TO_CHAR(COALESCE(paid_at, created_at), 'MM/YYYY') as month,
          SUM(amount)::numeric as revenue
        FROM payment_orders
        WHERE status = 'COMPLETED'
          AND COALESCE(paid_at, created_at) >= CURRENT_TIMESTAMP - INTERVAL '6 months'
        GROUP BY TO_CHAR(COALESCE(paid_at, created_at), 'MM/YYYY'), DATE_TRUNC('month', COALESCE(paid_at, created_at))
        ORDER BY DATE_TRUNC('month', COALESCE(paid_at, created_at)) ASC
      `),

      // 6. Content stats
      db.query(
        `SELECT 
           (SELECT COUNT(*)::int FROM documents) as total_docs,
           (SELECT COUNT(*)::int FROM documents WHERE visibility = 'public' OR is_community_published = true) as public_docs,
           (SELECT COUNT(*)::int FROM documents WHERE (visibility != 'public' OR visibility IS NULL) AND (is_community_published = false OR is_community_published IS NULL)) as private_docs,
           (SELECT COALESCE(SUM(file_size), 0)::bigint FROM documents) as total_storage_bytes,
           (SELECT COUNT(*)::int FROM flashcard_decks) as total_decks,
           (SELECT COUNT(*)::int FROM test_sets) as total_test_sets,
           (SELECT COUNT(*)::int FROM study_sessions) as total_study_sessions,
           (SELECT COUNT(*)::int FROM mindmaps) as total_mindmaps`
      ),

      // 7. AI usage stats
      db.query(
        `SELECT 
           COALESCE(SUM(ai_question_gens), 0)::bigint as total_question_gens,
           COALESCE(SUM(ai_chat_messages), 0)::bigint as total_chat_messages,
           COALESCE(SUM(documents_uploaded), 0)::bigint as total_docs_uploaded,
           COALESCE(SUM(storage_bytes_used), 0)::bigint as total_storage_bytes_used
         FROM user_usages`
      ),

      // 8. Moderation stats
      db.query(
        `SELECT 
           COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as pending_reports,
           COUNT(CASE WHEN status = 'RESOLVED' THEN 1 END)::int as resolved_reports,
           COUNT(CASE WHEN status = 'DISMISSED' THEN 1 END)::int as dismissed_reports,
           (SELECT COUNT(*)::int FROM moderation_logs) as total_moderation_logs
         FROM content_reports`
      ),

      // 9. Recent 8 orders
      db.query(
        `SELECT 
           o.id,
           o.order_code,
           o.amount,
           o.currency,
           o.status,
           o.payment_gateway,
           o.created_at,
           o.paid_at,
           u.email as user_email,
           u.name as user_name,
           p.name as plan_name
         FROM payment_orders o
         JOIN users u ON o.user_id = u.id
         LEFT JOIN subscription_plans p ON o.plan_id = p.id
         ORDER BY o.created_at DESC
         LIMIT 8`
      ),
    ]);

    return {
      userMetrics: userMetricsRes.rows[0],
      subMetrics: subMetricsRes.rows[0],
      plansBreakdown: plansBreakdownRes.rows,
      ordersRevenue: ordersRevRes.rows[0],
      monthlyRevenue: monthlyRevRes.rows,
      contentStats: contentStatsRes.rows[0],
      aiUsage: aiUsageRes.rows[0],
      modStats: moderationRes.rows[0],
      recentOrders: recentOrdersRes.rows,
    };
  }

  /**
   * 2. Get Users with filtering and pagination
   */
  async getUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    tier?: string;
    page: number;
    limit: number;
  }) {
    const { search, role, status, tier, page, limit } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = ["email != 'admin'"];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (role && role !== 'all') {
      queryParams.push(role);
      whereClauses.push(`role = $${paramIndex}`);
      paramIndex++;
    }

    if (status === 'suspended') {
      whereClauses.push(`is_suspended = true`);
    } else if (status === 'active') {
      whereClauses.push(`(is_suspended IS NULL OR is_suspended = false)`);
    }

    if (tier === 'premium') {
      whereClauses.push(`is_premium = true AND (premium_until IS NULL OR premium_until > CURRENT_TIMESTAMP)`);
    } else if (tier === 'free') {
      whereClauses.push(`(is_premium = false OR is_premium IS NULL OR (premium_until IS NOT NULL AND premium_until <= CURRENT_TIMESTAMP))`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*)::int as count FROM users ${whereSQL}`, queryParams);
    const total = countResult.rows[0].count;

    const dataQuery = `
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        role, 
        is_premium,
        premium_until,
        is_suspended,
        suspension_reason,
        warning_count,
        created_at 
      FROM users 
      ${whereSQL}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await db.query(dataQuery, queryParams);
    return {
      users: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 3. Find user by ID
   */
  async findUserById(id: string | number) {
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  /**
   * 4. Find user by email
   */
  async findUserByEmail(email: string) {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  /**
   * 5. Check if email exists for another user
   */
  async checkEmailInUseByOther(email: string, excludeId: string | number) {
    const res = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, excludeId]);
    return res.rows.length > 0;
  }

  /**
   * 6. Create user
   */
  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
    role?: string;
  }) {
    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, email, phone, role, created_at`,
      [data.name, data.email, data.passwordHash, data.phone || null, data.role || 'user']
    );
    return result.rows[0];
  }

  /**
   * 7. Update user
   */
  async updateUser(
    id: string | number,
    data: {
      name: string;
      email: string;
      passwordHash?: string;
      phone?: string | null;
      role?: string;
    }
  ) {
    if (data.passwordHash && data.passwordHash.trim() !== '') {
      await db.query(
        `UPDATE users 
         SET name = $1, email = $2, password = $3, phone = $4, role = $5 
         WHERE id = $6`,
        [data.name, data.email, data.passwordHash, data.phone || null, data.role || 'user', id]
      );
    } else {
      await db.query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, role = $4 
         WHERE id = $5`,
        [data.name, data.email, data.phone || null, data.role || 'user', id]
      );
    }

    const updatedResult = await db.query(
      'SELECT id, name, email, phone, role, is_premium, premium_until, is_suspended, created_at FROM users WHERE id = $1',
      [id]
    );
    return updatedResult.rows[0];
  }

  /**
   * 8. Delete user
   */
  async deleteUser(id: string | number) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * 9. Increment user warning count
   */
  async incrementWarningCount(id: string | number) {
    await db.query('UPDATE users SET warning_count = COALESCE(warning_count, 0) + 1 WHERE id = $1', [id]);
  }

  /**
   * 10. Get full safe user details
   */
  async getUserDetails(id: string | number) {
    // 1. User profile
    const userRes = await db.query(
      `SELECT 
         id, name, email, phone, role, education, address, 
         created_at, is_premium, premium_until, is_suspended, suspension_reason, 
         warning_count, bio, headline 
       FROM users WHERE id = $1`,
      [id]
    );
    if (userRes.rows.length === 0) {
      return null;
    }
    const user = userRes.rows[0];

    // 2. Subscriptions history
    const subsRes = await db.query(
      `SELECT 
         s.id, s.plan, s.status, s.start_date, s.end_date, s.amount, 
         s.order_code, s.auto_renew, s.created_at, 
         p.name as plan_name, p.code as plan_code
       FROM subscriptions s
       LEFT JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [id]
    );

    // 3. Payment orders history
    const ordersRes = await db.query(
      `SELECT 
         o.id, o.order_code, o.amount, o.currency, o.status, 
         o.payment_gateway, o.created_at, o.paid_at, 
         p.name as plan_name
       FROM payment_orders o
       LEFT JOIN subscription_plans p ON o.plan_id = p.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    );

    // 4. Safe Aggregate Counts
    const countsRes = await db.query(
      `SELECT 
         (SELECT COUNT(*)::int FROM documents WHERE user_id = $1) as docs_count,
         (SELECT COUNT(*)::int FROM documents WHERE user_id = $1 AND (visibility = 'public' OR is_community_published = true)) as public_docs_count,
         (SELECT COUNT(*)::int FROM flashcard_decks WHERE user_id = $1) as decks_count,
         (SELECT COUNT(*)::int FROM test_sets WHERE created_by = $1) as test_sets_count,
         (SELECT COUNT(*)::int FROM mindmaps WHERE user_id = $1) as mindmaps_count,
         (SELECT COUNT(*)::int FROM study_sessions WHERE user_id = $1) as study_sessions_count,
         (SELECT COALESCE(SUM(duration_seconds), 0)::int FROM study_sessions WHERE user_id = $1) as total_study_seconds`,
      [id]
    );

    // 5. User's Public Documents only
    const publicDocsRes = await db.query(
      `SELECT id, title, category, price, visibility, is_community_published, created_at 
       FROM documents 
       WHERE user_id = $1 AND (visibility = 'public' OR is_community_published = true)
       ORDER BY created_at DESC 
       LIMIT 10`,
      [id]
    );

    // 6. Moderation reports filed against this user
    const reportsRes = await db.query(
      `SELECT id, reason, details, status, action_taken, created_at
       FROM content_reports
       WHERE target_type = 'user' AND target_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return {
      user,
      subscriptions: subsRes.rows,
      paymentOrders: ordersRes.rows,
      learningMetrics: countsRes.rows[0],
      publicDocuments: publicDocsRes.rows,
      reports: reportsRes.rows,
    };
  }

  /**
   * 11. Get documents list with filtering and pagination
   */
  async getDocuments(params: {
    search?: string;
    visibility?: string;
    page: number;
    limit: number;
  }) {
    const { search, visibility, page, limit } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(`(d.title ILIKE $${paramIndex} OR d.category ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (visibility === 'public') {
      whereClauses.push(`(d.visibility = 'public' OR d.is_community_published = true)`);
    } else if (visibility === 'private') {
      whereClauses.push(`(d.visibility != 'public' OR d.visibility IS NULL) AND (d.is_community_published = false OR d.is_community_published IS NULL)`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM documents d 
       JOIN users u ON d.user_id = u.id 
       ${whereSQL}`,
      queryParams
    );
    const total = countResult.rows[0].count;

    const query = `
      SELECT 
        d.id, 
        d.title, 
        d.category, 
        d.price, 
        d.visibility, 
        d.is_community_published,
        d.file_type,
        d.file_size,
        d.status,
        d.created_at, 
        u.name as author_name,
        u.email as author_email
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ${whereSQL}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    return {
      documents: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 12. Find document for admin delete
   */
  async findDocumentForDelete(id: string | number) {
    const res = await db.query(
      'SELECT id, title, user_id, cloudinary_public_id, file_type FROM documents WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * 13. Safely delete document within a transaction
   */
  async deleteDocumentTransaction(
    id: string | number,
    adminId: number,
    docTitle: string,
    docUserId: number
  ) {
    return withTransaction(async (client: PoolClient) => {
      // 1. Delete associated community resources
      await client.query(
        "DELETE FROM community_resources WHERE resource_type = 'document' AND resource_id = $1",
        [id]
      );

      // 2. Delete the document
      await client.query('DELETE FROM documents WHERE id = $1', [id]);

      // 3. Audit log in moderation_logs
      await client.query(
        `INSERT INTO moderation_logs (admin_id, action, target_type, target_id, reason, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [adminId, 'DELETE_DOCUMENT', 'resource', id, 'Admin deleted document', `Tài liệu: ${docTitle} (Author: ${docUserId})`]
      );
    });
  }

  /**
   * 14. Get subscriptions for admin management
   */
  async getSubscriptions(params: {
    search?: string;
    status?: string;
    plan?: string;
    page: number;
    limit: number;
  }) {
    const { search, status, plan, page, limit } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR s.order_code::text ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (status && status !== 'ALL') {
      queryParams.push(status);
      whereClauses.push(`s.status = $${paramIndex}`);
      paramIndex++;
    }

    if (plan && plan !== 'ALL') {
      queryParams.push(plan);
      whereClauses.push(`(s.plan = $${paramIndex} OR p.code = $${paramIndex})`);
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM subscriptions s 
       JOIN users u ON s.user_id = u.id 
       LEFT JOIN subscription_plans p ON s.plan_id = p.id 
       ${whereSQL}`,
      queryParams
    );
    const total = countRes.rows[0].count;

    const dataQuery = `
      SELECT 
        s.id,
        s.user_id,
        s.plan,
        s.status,
        s.start_date,
        s.end_date,
        s.amount,
        s.order_code,
        s.auto_renew,
        s.past_due_until,
        s.cancelled_at,
        s.created_at,
        u.name as user_name,
        u.email as user_email,
        p.name as plan_name,
        p.code as plan_code
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      ${whereSQL}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await db.query(dataQuery, queryParams);
    return {
      subscriptions: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 15. Get payment orders for admin management
   */
  async getPaymentOrders(params: {
    search?: string;
    status?: string;
    gateway?: string;
    page: number;
    limit: number;
  }) {
    const { search, status, gateway, page, limit } = params;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      whereClauses.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR o.order_code ILIKE $${paramIndex})`);
      paramIndex++;
    }

    if (status && status !== 'ALL') {
      queryParams.push(status);
      whereClauses.push(`o.status = $${paramIndex}`);
      paramIndex++;
    }

    if (gateway && gateway !== 'ALL') {
      queryParams.push(gateway);
      whereClauses.push(`o.payment_gateway = $${paramIndex}`);
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM payment_orders o 
       JOIN users u ON o.user_id = u.id 
       ${whereSQL}`,
      queryParams
    );
    const total = countRes.rows[0].count;

    const dataQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.order_code,
        o.amount,
        o.currency,
        o.status,
        o.payment_gateway,
        o.gateway_transaction_id,
        o.created_at,
        o.paid_at,
        u.name as user_name,
        u.email as user_email,
        p.name as plan_name,
        p.code as plan_code
      FROM payment_orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN subscription_plans p ON o.plan_id = p.id
      ${whereSQL}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await db.query(dataQuery, queryParams);
    return {
      orders: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 16. Find subscription by ID
   */
  async findSubscriptionById(id: string | number) {
    const res = await db.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    return res.rows[0] || null;
  }


  /**
   * 18. AI Cost & Budget Metrics
   */
  async getAICostMetrics() {
    const todayRes = await db.query(`
      SELECT 
        COALESCE(SUM(estimated_cost), 0)::float as today_cost,
        COALESCE(SUM(input_tokens), 0)::bigint as today_input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as today_output_tokens,
        COUNT(*)::int as today_requests,
        COUNT(*) FILTER (WHERE status = 'success')::int as today_success,
        COUNT(*) FILTER (WHERE status = 'failed')::int as today_failed,
        COUNT(*) FILTER (WHERE status = 'timeout')::int as today_timeout
      FROM ai_request_logs
      WHERE created_at >= CURRENT_DATE
    `);

    const monthRes = await db.query(`
      SELECT 
        COALESCE(SUM(estimated_cost), 0)::float as month_cost,
        COALESCE(SUM(input_tokens), 0)::bigint as month_input_tokens,
        COALESCE(SUM(output_tokens), 0)::bigint as month_output_tokens,
        COUNT(*)::int as month_requests
      FROM ai_request_logs
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    `);

    const providerRes = await db.query(`
      SELECT 
        COALESCE(ap.name, 'unknown') as provider,
        COUNT(*)::int as requests,
        COALESCE(SUM(l.estimated_cost), 0)::float as cost,
        COALESCE(SUM(COALESCE(l.input_tokens, 0) + COALESCE(l.output_tokens, 0)), 0)::bigint as tokens
      FROM ai_request_logs l
      LEFT JOIN ai_models am ON l.model_id = am.id
      LEFT JOIN ai_providers ap ON am.provider_id = ap.id
      WHERE l.created_at >= CURRENT_DATE
      GROUP BY ap.name
    `);

    const taskRes = await db.query(`
      SELECT 
        task_type,
        COUNT(*)::int as requests,
        COALESCE(SUM(estimated_cost), 0)::float as cost
      FROM ai_request_logs
      WHERE created_at >= CURRENT_DATE
      GROUP BY task_type
      ORDER BY cost DESC
    `);

    return {
      today: todayRes.rows[0],
      month: monthRes.rows[0],
      byProvider: providerRes.rows,
      byTaskType: taskRes.rows,
    };
  }
}

export const adminRepository = new AdminRepository();
