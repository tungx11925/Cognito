import { db } from '../db';
import { PoolClient } from 'pg';

export class SubscriptionRepository {
  async getPlans(client?: PoolClient) {
    const q = client || db;
    const res = await q.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC');
    return res.rows;
  }

  async getPlanByCode(code: string, client?: PoolClient) {
    const q = client || db;
    const res = await q.query('SELECT * FROM subscription_plans WHERE code = $1 AND is_active = true', [code]);
    return res.rows[0] || null;
  }

  async getUserActiveSubscription(userId: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `SELECT s.*, sp.code as plan_code, sp.name as plan_name, sp.features
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'ACTIVE' AND s.end_date > CURRENT_TIMESTAMP
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async createSubscription(userId: number, planId: number, durationDays: number, client?: PoolClient) {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date)
       VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($3 || ' days')::INTERVAL)
       RETURNING *`,
      [userId, planId, durationDays]
    );
    return res.rows[0];
  }

  async getDailyUsage(userId: number, dateStr?: string, client?: PoolClient) {
    const q = client || db;
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const res = await q.query(
      `SELECT * FROM user_usages WHERE user_id = $1 AND usage_date = $2`,
      [userId, targetDate]
    );
    if (res.rows.length === 0) {
      const inserted = await q.query(
        `INSERT INTO user_usages (user_id, usage_date, ai_question_gens, ai_chat_messages, documents_uploaded)
         VALUES ($1, $2, 0, 0, 0)
         RETURNING *`,
        [userId, targetDate]
      );
      return inserted.rows[0];
    }
    return res.rows[0];
  }

  async incrementUsage(userId: number, field: 'ai_question_gens' | 'ai_chat_messages' | 'documents_uploaded', amount: number = 1, client?: PoolClient) {
    const q = client || db;
    const today = new Date().toISOString().split('T')[0];
    const res = await q.query(
      `INSERT INTO user_usages (user_id, usage_date, ${field})
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET ${field} = user_usages.${field} + $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, today, amount]
    );
    return res.rows[0];
  }
}

export const subscriptionRepository = new SubscriptionRepository();
