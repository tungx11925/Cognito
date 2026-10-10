import { db } from '../db';
import { PoolClient } from 'pg';
import { getVietnamDateString } from '../utils/date.util';

export interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: any;
  is_active: boolean;
  created_at: Date;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED';
  start_date: Date;
  end_date: Date;
  cancelled_at: Date | null;
  past_due_until: Date | null;
  auto_renew: boolean;
  created_at: Date;
  plan_code?: string;
  plan_name?: string;
  features?: any;
}

export interface PaymentOrder {
  id: number;
  user_id: number;
  plan_id: number;
  order_code: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payment_gateway: string;
  gateway_transaction_id: string | null;
  created_at: Date;
  paid_at: Date | null;
  plan_code?: string;
  plan_name?: string;
}

export class SubscriptionRepository {
  async getPlans(client?: PoolClient): Promise<SubscriptionPlan[]> {
    const q = client || db;
    const res = await q.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC');
    return res.rows;
  }

  async getPlanByCode(code: string, client?: PoolClient): Promise<SubscriptionPlan | null> {
    const q = client || db;
    const res = await q.query('SELECT * FROM subscription_plans WHERE code = $1 AND is_active = true', [code]);
    return res.rows[0] || null;
  }

  async getPlanById(id: number, client?: PoolClient): Promise<SubscriptionPlan | null> {
    const q = client || db;
    const res = await q.query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [id]);
    return res.rows[0] || null;
  }

  async getUserActiveSubscription(userId: number, client?: PoolClient): Promise<Subscription | null> {
    const q = client || db;
    const res = await q.query(
      `SELECT s.*, sp.code as plan_code, sp.name as plan_name, sp.features
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.user_id = $1 
         AND (
           (s.status = 'ACTIVE' AND s.end_date > CURRENT_TIMESTAMP)
           OR (s.status = 'CANCELLED' AND s.end_date > CURRENT_TIMESTAMP)
           OR (s.status = 'PAST_DUE' AND (s.past_due_until IS NULL OR s.past_due_until > CURRENT_TIMESTAMP))
         )
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async getUserLatestSubscription(userId: number, client?: PoolClient): Promise<Subscription | null> {
    const q = client || db;
    const res = await q.query(
      `SELECT s.*, sp.code as plan_code, sp.name as plan_name, sp.features
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async createSubscription(
    userId: number, 
    planId: number, 
    durationDays: number, 
    client?: PoolClient
  ): Promise<Subscription> {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
       VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($3 || ' days')::INTERVAL, true)
       RETURNING *`,
      [userId, planId, durationDays]
    );
    return res.rows[0];
  }

  async extendSubscription(
    subscriptionId: number, 
    durationDays: number, 
    client?: PoolClient
  ): Promise<Subscription> {
    const q = client || db;
    const res = await q.query(
      `UPDATE subscriptions 
       SET end_date = end_date + ($1 || ' days')::INTERVAL, 
           status = 'ACTIVE',
           cancelled_at = NULL,
           past_due_until = NULL,
           auto_renew = true
       WHERE id = $2
       RETURNING *`,
      [durationDays, subscriptionId]
    );
    return res.rows[0];
  }

  async updateSubscriptionStatus(
    subscriptionId: number, 
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED', 
    fields?: { cancelled_at?: Date | null; past_due_until?: Date | null; auto_renew?: boolean },
    client?: PoolClient
  ): Promise<Subscription> {
    const q = client || db;
    const updates: string[] = ['status = $2'];
    const values: any[] = [subscriptionId, status];

    if (fields?.cancelled_at !== undefined) {
      values.push(fields.cancelled_at);
      updates.push(`cancelled_at = $${values.length}`);
    }
    if (fields?.past_due_until !== undefined) {
      values.push(fields.past_due_until);
      updates.push(`past_due_until = $${values.length}`);
    }
    if (fields?.auto_renew !== undefined) {
      values.push(fields.auto_renew);
      updates.push(`auto_renew = $${values.length}`);
    }

    const res = await q.query(
      `UPDATE subscriptions 
       SET ${updates.join(', ')} 
       WHERE id = $1 
       RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async updateUserPremiumFlags(
    userId: number, 
    isPremium: boolean, 
    premiumUntil: Date | null, 
    client?: PoolClient
  ): Promise<void> {
    const q = client || db;
    await q.query(
      `UPDATE users 
       SET is_premium = $1, premium_until = $2 
       WHERE id = $3`,
      [isPremium, premiumUntil, userId]
    );
  }

  // --- Payment Orders ---
  async createPaymentOrder(
    data: {
      userId: number;
      planId: number;
      orderCode: string;
      amount: number;
      currency?: string;
      paymentGateway?: string;
    },
    client?: PoolClient
  ): Promise<PaymentOrder> {
    const q = client || db;
    const res = await q.query(
      `INSERT INTO payment_orders (user_id, plan_id, order_code, amount, currency, status, payment_gateway)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
       RETURNING *`,
      [
        data.userId,
        data.planId,
        data.orderCode,
        data.amount,
        data.currency || 'VND',
        data.paymentGateway || 'SANDBOX'
      ]
    );
    return res.rows[0];
  }

  async getPaymentOrderByCode(orderCode: string, client?: PoolClient): Promise<PaymentOrder | null> {
    const q = client || db;
    const res = await q.query(
      `SELECT po.*, sp.code as plan_code, sp.name as plan_name
       FROM payment_orders po
       LEFT JOIN subscription_plans sp ON sp.id = po.plan_id
       WHERE po.order_code = $1`,
      [orderCode]
    );
    return res.rows[0] || null;
  }

  async getPaymentOrdersByUserId(userId: number, limit = 10, client?: PoolClient): Promise<PaymentOrder[]> {
    const q = client || db;
    const res = await q.query(
      `SELECT po.*, sp.code as plan_code, sp.name as plan_name
       FROM payment_orders po
       LEFT JOIN subscription_plans sp ON sp.id = po.plan_id
       WHERE po.user_id = $1
       ORDER BY po.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  }

  async updatePaymentOrderStatus(
    orderCode: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
    gatewayTxId?: string | null,
    paidAt?: Date | null,
    client?: PoolClient
  ): Promise<PaymentOrder | null> {
    const q = client || db;
    const res = await q.query(
      `UPDATE payment_orders
       SET status = $1,
           gateway_transaction_id = COALESCE($2, gateway_transaction_id),
           paid_at = COALESCE($3, paid_at)
       WHERE order_code = $4
       RETURNING *`,
      [status, gatewayTxId || null, paidAt || null, orderCode]
    );
    return res.rows[0] || null;
  }

  async findSubscriptionsNeedingSync(client?: PoolClient): Promise<Subscription[]> {
    const q = client || db;
    const res = await q.query(
      `SELECT s.*
       FROM subscriptions s
       WHERE (s.status = 'CANCELLED' AND s.end_date <= CURRENT_TIMESTAMP)
          OR (s.status = 'PAST_DUE' AND s.past_due_until IS NOT NULL AND s.past_due_until <= CURRENT_TIMESTAMP)
          OR (s.status = 'ACTIVE' AND s.end_date <= CURRENT_TIMESTAMP)`
    );
    return res.rows;
  }

  // --- Daily Usages ---
  async getDailyUsage(userId: number, dateStr?: string, client?: PoolClient) {
    const q = client || db;
    const targetDate = dateStr || getVietnamDateString(new Date());
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
    const allowed = ['ai_question_gens', 'ai_chat_messages', 'documents_uploaded'];
    if (!allowed.includes(field)) {
      throw new Error(`Invalid usage field: ${field}`);
    }
    const q = client || db;
    const today = getVietnamDateString(new Date());
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
