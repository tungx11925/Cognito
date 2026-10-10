import { db, withTransaction } from '../db';
import { getVietnamDateString } from '../utils/date.util';
import { SubscriptionPlan } from '../repositories/subscription.repository';

export interface UserPlanInfo {
  plan: 'ADMIN' | 'PRO' | 'FREE';
  isPremium: boolean;
  limits: {
    ai_chat_daily: number;
    ai_questions_daily: number;
    max_documents: number;
    document_max_pages: number;
  };
}

export interface EntitlementsResult {
  plan: 'ADMIN' | 'PRO' | 'FREE';
  is_premium: boolean;
  premium_until: string | null;
  usage_date: string;
  usage: {
    ai_chat: {
      used: number;
      limit: number;
      remaining: number;
      unlimited: boolean;
    };
    ai_questions: {
      used: number;
      limit: number;
      remaining: number;
      unlimited: boolean;
    };
    documents: {
      used: number;
      limit: number;
      remaining: number;
      unlimited: boolean;
    };
    document_max_pages: number;
  };
}

export class EntitlementService {
  /**
   * 1. Get User Plan & Entitlement Limits
   * Source of truth: users.role, users.is_premium, users.premium_until
   */
  async getUserPlan(userId: number): Promise<UserPlanInfo> {
    const userRes = await db.query(
      'SELECT id, role, is_premium, premium_until FROM users WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) {
      throw new Error('Người dùng không tồn tại');
    }
    const user = userRes.rows[0];

    // Role Admin has full access
    if (user.role === 'admin') {
      return {
        plan: 'ADMIN',
        isPremium: true,
        limits: {
          ai_chat_daily: -1,
          ai_questions_daily: -1,
          max_documents: -1,
          document_max_pages: 9999,
        },
      };
    }

    // Active Premium Subscription
    const isPremium = Boolean(
      user.is_premium && (!user.premium_until || new Date(user.premium_until) > new Date())
    );

    if (isPremium) {
      return {
        plan: 'PRO',
        isPremium: true,
        limits: {
          ai_chat_daily: -1,
          ai_questions_daily: -1,
          max_documents: -1,
          document_max_pages: 200,
        },
      };
    }

    // Free Plan default limits
    return {
      plan: 'FREE',
      isPremium: false,
      limits: {
        ai_chat_daily: 20,
        ai_questions_daily: 10,
        max_documents: 20,
        document_max_pages: 30,
      },
    };
  }

  /**
   * 2. Get Detailed Entitlements & Usage Status for Today (Vietnam UTC+7)
   */
  async getEntitlements(userId: number): Promise<EntitlementsResult> {
    const planInfo = await this.getUserPlan(userId);
    const today = getVietnamDateString(new Date());

    // Query today's usage from user_usages
    const usageRes = await db.query(
      'SELECT ai_chat_messages, ai_question_gens, documents_uploaded FROM user_usages WHERE user_id = $1 AND usage_date = $2',
      [userId, today]
    );
    const usageRow = usageRes.rows[0] || {
      ai_chat_messages: 0,
      ai_question_gens: 0,
      documents_uploaded: 0,
    };

    // Query total active documents owned by user
    const docCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM documents WHERE user_id = $1',
      [userId]
    );
    const totalDocs = docCountRes.rows[0]?.count || 0;

    const userRes = await db.query('SELECT premium_until FROM users WHERE id = $1', [userId]);
    const premiumUntil = userRes.rows[0]?.premium_until || null;

    const isUnlimited = (limit: number) => limit === -1;
    const calcRemaining = (used: number, limit: number) =>
      limit === -1 ? 999999 : Math.max(0, limit - used);

    return {
      plan: planInfo.plan,
      is_premium: planInfo.isPremium,
      premium_until: premiumUntil,
      usage_date: today,
      usage: {
        ai_chat: {
          used: Number(usageRow.ai_chat_messages || 0),
          limit: planInfo.limits.ai_chat_daily,
          remaining: calcRemaining(
            Number(usageRow.ai_chat_messages || 0),
            planInfo.limits.ai_chat_daily
          ),
          unlimited: isUnlimited(planInfo.limits.ai_chat_daily),
        },
        ai_questions: {
          used: Number(usageRow.ai_question_gens || 0),
          limit: planInfo.limits.ai_questions_daily,
          remaining: calcRemaining(
            Number(usageRow.ai_question_gens || 0),
            planInfo.limits.ai_questions_daily
          ),
          unlimited: isUnlimited(planInfo.limits.ai_questions_daily),
        },
        documents: {
          used: totalDocs,
          limit: planInfo.limits.max_documents,
          remaining: calcRemaining(totalDocs, planInfo.limits.max_documents),
          unlimited: isUnlimited(planInfo.limits.max_documents),
        },
        document_max_pages: planInfo.limits.document_max_pages,
      },
    };
  }

  /**
   * 3. Atomic Check & Reserve Usage with SELECT ... FOR UPDATE (Race-Condition Free)
   * Ensures that concurrent requests cannot exceed the quota.
   * If the main operation fails, call refundDailyUsage to restore the slot.
   */
  async checkAndReserveDailyUsage(
    userId: number,
    feature: 'ai_chat_daily' | 'ai_questions_daily'
  ): Promise<{
    allowed: boolean;
    plan: string;
    reserved: boolean;
    limit: number;
    current: number;
    reason?: string;
  }> {
    const planInfo = await this.getUserPlan(userId);

    // Admin and Pro have unlimited quota -> Bypass reservation
    if (planInfo.plan === 'ADMIN' || planInfo.plan === 'PRO') {
      return {
        allowed: true,
        plan: planInfo.plan,
        reserved: false,
        limit: -1,
        current: 0,
      };
    }

    const limit = planInfo.limits[feature];
    const column = feature === 'ai_chat_daily' ? 'ai_chat_messages' : 'ai_question_gens';
    const today = getVietnamDateString(new Date());

    return await withTransaction(async (client) => {
      // A. Ensure today's row exists (Vietnam UTC+7)
      await client.query(
        `INSERT INTO user_usages (user_id, usage_date, ai_question_gens, ai_chat_messages, documents_uploaded)
         VALUES ($1, $2, 0, 0, 0)
         ON CONFLICT (user_id, usage_date) DO NOTHING`,
        [userId, today]
      );

      // B. Acquire pessimistic row lock with SELECT ... FOR UPDATE
      const lockRes = await client.query(
        `SELECT ${column} as current_count
         FROM user_usages 
         WHERE user_id = $1 AND usage_date = $2 
         FOR UPDATE`,
        [userId, today]
      );

      const current = Number(lockRes.rows[0]?.current_count || 0);

      // C. Quota check against limit
      if (current >= limit) {
        return {
          allowed: false,
          plan: 'FREE',
          reserved: false,
          limit,
          current,
          reason: 'QUOTA_EXCEEDED',
        };
      }

      // D. Atomically reserve 1 slot
      await client.query(
        `UPDATE user_usages 
         SET ${column} = ${column} + 1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND usage_date = $2`,
        [userId, today]
      );

      return {
        allowed: true,
        plan: 'FREE',
        reserved: true,
        limit,
        current: current + 1,
      };
    });
  }

  /**
   * 4. Refund Reserved Usage if the Main Operation Fails
   * Guarantees user is not penalized for backend/AI network errors.
   */
  async refundDailyUsage(
    userId: number,
    feature: 'ai_chat_daily' | 'ai_questions_daily'
  ): Promise<void> {
    const column = feature === 'ai_chat_daily' ? 'ai_chat_messages' : 'ai_question_gens';
    const today = getVietnamDateString(new Date());

    await db.query(
      `UPDATE user_usages 
       SET ${column} = GREATEST(0, ${column} - 1), updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND usage_date = $2`,
      [userId, today]
    );
  }

  /**
   * 5. Check Document Upload Entitlement
   * - Free users: max 20 total active documents, max 30 pages/doc
   * - Pro users: unlimited documents, max 200 pages/doc
   */
  async checkDocumentUpload(
    userId: number,
    pageCount?: number
  ): Promise<{
    allowed: boolean;
    code?: string;
    message?: string;
    plan: string;
  }> {
    const planInfo = await this.getUserPlan(userId);

    if (planInfo.plan === 'ADMIN') {
      return { allowed: true, plan: 'ADMIN' };
    }

    if (planInfo.plan === 'PRO') {
      if (pageCount && pageCount > planInfo.limits.document_max_pages) {
        return {
          allowed: false,
          code: 'PAGE_LIMIT_EXCEEDED',
          message: `Tài liệu (${pageCount} trang) vượt quá giới hạn ${planInfo.limits.document_max_pages} trang của gói Pro.`,
          plan: 'PRO',
        };
      }
      return { allowed: true, plan: 'PRO' };
    }

    // Free plan checks
    // 1. Total active documents
    const docCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM documents WHERE user_id = $1',
      [userId]
    );
    const totalDocs = docCountRes.rows[0]?.count || 0;
    if (totalDocs >= planInfo.limits.max_documents) {
      return {
        allowed: false,
        code: 'DOC_LIMIT_REACHED',
        message: `Bạn đã đạt giới hạn tối đa ${planInfo.limits.max_documents} tài liệu của gói Miễn phí. Vui lòng nâng cấp lên gói Pro để tải lên không giới hạn.`,
        plan: 'FREE',
      };
    }

    // 2. Page count check
    if (pageCount && pageCount > planInfo.limits.document_max_pages) {
      return {
        allowed: false,
        code: 'PAGE_LIMIT_EXCEEDED',
        message: `Tài liệu (${pageCount} trang) vượt quá giới hạn ${planInfo.limits.document_max_pages} trang của gói Miễn phí. Vui lòng nâng cấp lên gói Pro (hỗ trợ tới 200 trang).`,
        plan: 'FREE',
      };
    }

    return { allowed: true, plan: 'FREE' };
  }

  /**
   * 6. Increment Document Upload Count in user_usages
   */
  async incrementDocumentUploaded(userId: number): Promise<void> {
    const today = getVietnamDateString(new Date());
    await db.query(
      `INSERT INTO user_usages (user_id, usage_date, documents_uploaded)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET documents_uploaded = user_usages.documents_uploaded + 1, updated_at = CURRENT_TIMESTAMP`,
      [userId, today]
    );
  }
}

export const entitlementService = new EntitlementService();
