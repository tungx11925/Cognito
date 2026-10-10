import crypto from 'crypto';
import { db } from '../db';
import { subscriptionRepository, SubscriptionPlan, Subscription, PaymentOrder } from '../repositories/subscription.repository';
import { notificationService } from './notification.service';
import { AppError } from '../utils/AppError';

export interface CheckoutResult {
  orderCode: string;
  amount: number;
  currency: string;
  planCode: string;
  planName: string;
  checkoutUrl: string;
  gateway: 'PAYOS' | 'SANDBOX';
}

export class SubscriptionService {
  /**
   * Helper to verify if real PayOS credentials are configured
   */
  isPayOSConfigured(): boolean {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!clientId || !apiKey || !checksumKey) return false;
    if (clientId.includes('your_') || apiKey.includes('your_') || checksumKey.includes('your_')) {
      return false;
    }
    return true;
  }

  /**
   * Get active checksum key (real or sandbox test key)
   */
  getChecksumKey(): string {
    const key = process.env.PAYOS_CHECKSUM_KEY;
    if (key && !key.includes('your_')) {
      return key;
    }
    return 'cognito_sandbox_checksum_key_2026';
  }

  /**
   * Create PayOS-compliant cryptographic signature (HMAC-SHA256 on sorted key=value string)
   */
  generateSignature(data: Record<string, any>, key?: string): string {
    const checksumKey = key || this.getChecksumKey();
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== '')
      .map((k) => `${k}=${data[k]}`)
      .join('&');
    return crypto.createHmac('sha256', checksumKey).update(queryString).digest('hex');
  }

  /**
   * Cryptographically verify signature using constant-time comparison to prevent timing attacks
   */
  verifyWebhookSignature(data: Record<string, any>, signature: string): boolean {
    if (!signature || typeof signature !== 'string') return false;
    const expected = this.generateSignature(data);
    try {
      const bufA = Buffer.from(signature, 'utf-8');
      const bufB = Buffer.from(expected, 'utf-8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * 1. Get all active plans from database
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return await subscriptionRepository.getPlans();
  }

  /**
   * 2. Get user current subscription and sync state if expired
   */
  async getUserSubscription(userId: number): Promise<{
    subscription: Subscription | null;
    is_premium: boolean;
    premium_until: Date | null;
    usage: any;
  }> {
    // Automatically sync state against clock
    await this.syncUserSubscription(userId);

    const sub = await subscriptionRepository.getUserActiveSubscription(userId);
    const usage = await subscriptionRepository.getDailyUsage(userId);

    const userRes = await db.query('SELECT is_premium, premium_until FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    return {
      subscription: sub,
      is_premium: Boolean(user?.is_premium),
      premium_until: user?.premium_until || null,
      usage,
    };
  }

  /**
   * 3. Create Checkout Order (State: PENDING)
   * IDOR protected, valid plan check, generates unique integer orderCode
   */
  async createCheckout(userId: number, planCode: string): Promise<CheckoutResult> {
    const plan = await subscriptionRepository.getPlanByCode(planCode);
    if (!plan) {
      throw new AppError('Gói đăng ký không tồn tại', 400);
    }
    if (plan.code === 'FREE' || Number(plan.price) <= 0) {
      throw new AppError('Không thể tạo đơn thanh toán cho gói miễn phí', 400);
    }

    // PayOS requires integer orderCode, max 9007199254740991
    // Generate unique 10-digit number based on timestamp + random 3 digits
    const orderCode = String(Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000));

    const isLive = this.isPayOSConfigured();
    const gateway = isLive ? 'PAYOS' : 'SANDBOX';

    // Store in payment_orders with initial status 'PENDING'
    await subscriptionRepository.createPaymentOrder({
      userId,
      planId: plan.id,
      orderCode,
      amount: Number(plan.price),
      currency: plan.currency || 'VND',
      paymentGateway: gateway,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/premium/return?orderCode=${orderCode}`;
    const cancelUrl = `${frontendUrl}/premium?canceled=true`;

    let checkoutUrl = '';

    if (isLive) {
      try {
        const axios = require('axios');
        const signature = this.generateSignature({
          amount: Number(plan.price),
          cancelUrl,
          description: `Thanh toan ${plan.code}`.slice(0, 25),
          orderCode: Number(orderCode),
          returnUrl,
        });

        const resp = await axios.post(
          'https://api-merchant.payos.vn/v2/payment-requests',
          {
            orderCode: Number(orderCode),
            amount: Number(plan.price),
            description: `Thanh toan ${plan.code}`.slice(0, 25),
            returnUrl,
            cancelUrl,
            signature,
          },
          {
            headers: {
              'x-client-id': process.env.PAYOS_CLIENT_ID,
              'x-api-key': process.env.PAYOS_API_KEY,
            },
            timeout: 10000,
          }
        );

        if (resp.data?.data?.checkoutUrl) {
          checkoutUrl = resp.data.data.checkoutUrl;
        } else {
          checkoutUrl = returnUrl;
        }
      } catch (err: any) {
        console.error('PayOS API call error:', err?.response?.data || err.message);
        // Fallback to internal sandbox simulator
        checkoutUrl = `${frontendUrl}/premium/sandbox-checkout?orderCode=${orderCode}&amount=${plan.price}&plan=${plan.code}`;
      }
    } else {
      // Safe internal Sandbox checkout link
      checkoutUrl = `${frontendUrl}/premium/sandbox-checkout?orderCode=${orderCode}&amount=${plan.price}&plan=${plan.code}`;
    }

    return {
      orderCode,
      amount: Number(plan.price),
      currency: plan.currency || 'VND',
      planCode: plan.code,
      planName: plan.name,
      checkoutUrl,
      gateway,
    };
  }

  /**
   * 4. Handle Webhook (Strict Signature Verification + SELECT ... FOR UPDATE Lock)
   * Prevents race condition double-credits when concurrent webhooks arrive simultaneously.
   */
  async handleWebhook(payload: any, receivedSignature?: string): Promise<{ success: boolean; message: string }> {
    if (!payload) {
      throw new AppError('Payload webhook không hợp lệ', 400);
    }

    const data = payload.data || payload;
    const sig = receivedSignature || payload.signature;

    if (!sig) {
      throw new AppError('Thiếu chữ ký xác thực Webhook (Signature is required)', 401);
    }

    const isValid = this.verifyWebhookSignature(data, sig);
    if (!isValid) {
      throw new AppError('Chữ ký Webhook không hợp lệ (Invalid HMAC signature)', 401);
    }

    const orderCode = String(data.orderCode);
    if (!orderCode) {
      throw new AppError('Không tìm thấy orderCode trong dữ liệu Webhook', 400);
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // CRITICAL ROW-LEVEL LOCK: Lock the payment_orders row to block concurrent requests
      const orderRes = await client.query(
        'SELECT * FROM payment_orders WHERE order_code = $1 FOR UPDATE',
        [orderCode]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError(`Đơn hàng #${orderCode} không tồn tại`, 404);
      }

      const order = orderRes.rows[0];

      // IDEMPOTENCY UNDER ROW LOCK:
      // If already marked COMPLETED by earlier/concurrent transaction, commit cleanly with no double-credit!
      if (order.status === 'COMPLETED') {
        await client.query('COMMIT');
        return { success: true, message: 'Đơn hàng đã được xử lý trước đó (Idempotent OK)' };
      }

      // Check payment code from webhook payload / data
      const paymentCode = String(data.code ?? payload.code ?? '00');
      if (paymentCode !== '00') {
        await client.query(
          `UPDATE payment_orders 
           SET status = 'FAILED' 
           WHERE order_code = $1`,
          [orderCode]
        );
        await client.query('COMMIT');
        return { success: false, message: `Thanh toán thất bại (Mã lỗi: ${paymentCode})` };
      }

      const paidAt = new Date();
      const gatewayTxId = data.reference || data.paymentLinkId || `TX_${Date.now()}`;

      // 1. Update payment order
      await client.query(
        `UPDATE payment_orders 
         SET status = 'COMPLETED', paid_at = $1, gateway_transaction_id = $2 
         WHERE order_code = $3`,
        [paidAt, gatewayTxId, orderCode]
      );

      // 2. Fetch plan to determine duration
      const planRes = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [order.plan_id]);
      const plan = planRes.rows[0];
      const durationDays = plan.interval === 'year' ? 365 : 30;

      // 3. Check existing active subscription for user
      const existingSubRes = await client.query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND (status = 'ACTIVE' OR status = 'PAST_DUE') AND end_date > CURRENT_TIMESTAMP
         ORDER BY end_date DESC LIMIT 1`,
        [order.user_id]
      );

      let newEndDate: Date;

      if (existingSubRes.rows.length > 0) {
        // Extend existing subscription
        const currentSub = existingSubRes.rows[0];
        const extendedEndDate = new Date(new Date(currentSub.end_date).getTime() + durationDays * 86400000);
        newEndDate = extendedEndDate;

        await client.query(
          `UPDATE subscriptions 
           SET end_date = $1, status = 'ACTIVE', cancelled_at = NULL, past_due_until = NULL, auto_renew = true 
           WHERE id = $2`,
          [extendedEndDate, currentSub.id]
        );
      } else {
        // Create new active subscription
        const startDate = new Date();
        newEndDate = new Date(startDate.getTime() + durationDays * 86400000);

        await client.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
           VALUES ($1, $2, 'ACTIVE', $3, $4, true)`,
          [order.user_id, plan.id, startDate, newEndDate]
        );
      }

      // 4. ATOMIC SINGLE SOURCE OF TRUTH: Update users.is_premium and users.premium_until
      await client.query(
        `UPDATE users 
         SET is_premium = true, premium_until = $1 
         WHERE id = $2`,
        [newEndDate, order.user_id]
      );

      await client.query('COMMIT');

      // 5. Notify user
      try {
        await notificationService.createNotification({
          userId: order.user_id,
          type: 'payment',
          title: 'Kích hoạt gói Premium thành công! 🎉',
          content: `Đơn hàng #${orderCode} đã thanh toán thành công. Gói ${plan.name} của bạn có hiệu lực đến ngày ${newEndDate.toLocaleDateString('vi-VN')}.`,
          link: '/premium',
        });
      } catch (notifErr) {
        console.error('Failed to send payment notification:', notifErr);
      }

      return { success: true, message: 'Xác thực thanh toán và kích hoạt gói thành công' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 5. Cancel Subscription (State: ACTIVE -> CANCELLED)
   * User retains access until end of paid period (end_date).
   * users.is_premium remains true until end_date!
   */
  async cancelSubscription(userId: number): Promise<{ success: boolean; message: string; end_date: Date }> {
    const sub = await subscriptionRepository.getUserActiveSubscription(userId);
    if (!sub) {
      throw new AppError('Bạn không có gói đăng ký nào đang hoạt động', 400);
    }

    if (sub.status === 'CANCELLED') {
      return {
        success: true,
        message: `Gói cước đã được hủy tự động gia hạn trước đó. Bạn vẫn có thể sử dụng quyền lợi Premium đến ngày ${new Date(sub.end_date).toLocaleDateString('vi-VN')}.`,
        end_date: sub.end_date,
      };
    }

    const cancelledAt = new Date();
    await subscriptionRepository.updateSubscriptionStatus(sub.id, 'CANCELLED', {
      cancelled_at: cancelledAt,
      auto_renew: false,
    });

    return {
      success: true,
      message: `Đã hủy tự động gia hạn thành công. Bạn vẫn có toàn quyền sử dụng Premium đến hết chu kỳ ngày ${new Date(sub.end_date).toLocaleDateString('vi-VN')}.`,
      end_date: sub.end_date,
    };
  }

  /**
   * 6. State: ACTIVE -> PAST_DUE (Grace period on expired term)
   */
  async markPastDue(subscriptionId: number, gracePeriodDays = 3): Promise<Subscription> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const subRes = await client.query('SELECT * FROM subscriptions WHERE id = $1', [subscriptionId]);
      if (subRes.rows.length === 0) {
        throw new AppError('Subscription không tồn tại', 404);
      }
      const sub = subRes.rows[0];

      // Grace period ends at end_date + gracePeriodDays
      const baseDate = new Date(sub.end_date) > new Date() ? new Date(sub.end_date) : new Date();
      const pastDueUntil = new Date(baseDate.getTime() + gracePeriodDays * 86400000);

      const updatedSubRes = await client.query(
        `UPDATE subscriptions 
         SET status = 'PAST_DUE', past_due_until = $1 
         WHERE id = $2 
         RETURNING *`,
        [pastDueUntil, subscriptionId]
      );

      // In grace period, user is allowed access, update users.premium_until to pastDueUntil
      await client.query(
        `UPDATE users 
         SET is_premium = true, premium_until = $1 
         WHERE id = $2`,
        [pastDueUntil, sub.user_id]
      );

      await client.query('COMMIT');

      // Send grace period reminder notification
      try {
        await notificationService.createNotification({
          userId: sub.user_id,
          type: 'payment',
          title: 'Gói cước đã hết chu kỳ — Đang trong thời gian ân hạn',
          content: `Gói Cognito Pro của bạn đã hết chu kỳ. Bạn có ${gracePeriodDays} ngày ân hạn (đến ${pastDueUntil.toLocaleDateString('vi-VN')}) để gia hạn mà không bị gián đoạn tính năng AI.`,
          link: '/premium',
        });
      } catch (e) {
        console.error('Failed to send past due notification:', e);
      }

      return updatedSubRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 7. State: CANCELLED / PAST_DUE -> EXPIRED
   * Grace period or cycle ended. Updates single source of truth on users.
   */
  async expireSubscription(subscriptionId: number): Promise<void> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const subRes = await client.query('SELECT * FROM subscriptions WHERE id = $1', [subscriptionId]);
      if (subRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }
      const sub = subRes.rows[0];

      await client.query(`UPDATE subscriptions SET status = 'EXPIRED' WHERE id = $1`, [subscriptionId]);

      // Check if user has any other active subscription before revoking
      const otherActive = await client.query(
        `SELECT id FROM subscriptions 
         WHERE user_id = $1 AND id != $2 AND status = 'ACTIVE' AND end_date > CURRENT_TIMESTAMP`,
        [sub.user_id, subscriptionId]
      );

      if (otherActive.rows.length === 0) {
        await client.query(
          `UPDATE users 
           SET is_premium = false, premium_until = NULL 
           WHERE id = $1`,
          [sub.user_id]
        );

        // Send expiration notification
        try {
          await notificationService.createNotification({
            userId: sub.user_id,
            type: 'payment',
            title: 'Gói cước Cognito Pro đã hết hạn',
            content: 'Tài khoản của bạn đã chuyển về gói Miễn Phí. Bạn có thể gia hạn bất kỳ lúc nào để tiếp tục sử dụng các đặc quyền Pro.',
            link: '/premium',
          });
        } catch (e) {
          console.error('Failed to send expiration notification:', e);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * 8. Synchronize Single User Subscription Status (Lazy check on query/login)
   */
  async syncUserSubscription(userId: number): Promise<void> {
    const subs = await db.query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE')
       ORDER BY end_date DESC`,
      [userId]
    );

    const now = new Date();

    for (const sub of subs.rows) {
      const endDate = new Date(sub.end_date);
      const pastDueUntil = sub.past_due_until ? new Date(sub.past_due_until) : null;

      if (sub.status === 'CANCELLED' && endDate <= now) {
        await this.expireSubscription(sub.id);
      } else if (sub.status === 'PAST_DUE' && pastDueUntil && pastDueUntil <= now) {
        await this.expireSubscription(sub.id);
      } else if (sub.status === 'ACTIVE' && endDate <= now) {
        if (sub.auto_renew) {
          await this.markPastDue(sub.id, 3);
        } else {
          await this.expireSubscription(sub.id);
        }
      }
    }
  }

  /**
   * 9. Background Cron Sweep (Global Periodic Job)
   * Sweeps all expired subscriptions, updates PAST_DUE/EXPIRED, syncs users.is_premium,
   * cancels abandoned PENDING orders, and guarantees Admin Dashboard data fidelity.
   */
  async syncAllSubscriptionsBatch(): Promise<{
    pastDueCount: number;
    expiredCount: number;
    cancelledExpiredCount: number;
    abandonedOrdersCancelled: number;
  }> {
    const now = new Date();
    let pastDueCount = 0;
    let expiredCount = 0;
    let cancelledExpiredCount = 0;
    let abandonedOrdersCancelled = 0;

    // A. ACTIVE subscriptions where end_date <= NOW()
    const activeExpired = await db.query(
      `SELECT s.* FROM subscriptions s 
       WHERE s.status = 'ACTIVE' AND s.end_date <= CURRENT_TIMESTAMP`
    );

    for (const sub of activeExpired.rows) {
      const endDate = new Date(sub.end_date);
      const graceEnd = new Date(endDate.getTime() + 3 * 86400000);

      if (sub.auto_renew && graceEnd > now) {
        // Transition to PAST_DUE (Grace period 3 days)
        await this.markPastDue(sub.id, 3);
        pastDueCount++;
      } else {
        // Grace period already passed or auto_renew disabled -> EXPIRED
        await this.expireSubscription(sub.id);
        expiredCount++;
      }
    }

    // B. CANCELLED subscriptions where end_date <= NOW()
    const cancelledExpired = await db.query(
      `SELECT s.* FROM subscriptions s 
       WHERE s.status = 'CANCELLED' AND s.end_date <= CURRENT_TIMESTAMP`
    );

    for (const sub of cancelledExpired.rows) {
      await this.expireSubscription(sub.id);
      cancelledExpiredCount++;
    }

    // C. PAST_DUE subscriptions where past_due_until <= NOW()
    const pastDueExpired = await db.query(
      `SELECT s.* FROM subscriptions s 
       WHERE s.status = 'PAST_DUE' AND (s.past_due_until IS NOT NULL AND s.past_due_until <= CURRENT_TIMESTAMP)`
    );

    for (const sub of pastDueExpired.rows) {
      await this.expireSubscription(sub.id);
      expiredCount++;
    }

    // D. Timeout abandoned PENDING payment orders (> 24 hours)
    const timeoutOrders = await db.query(
      `UPDATE payment_orders 
       SET status = 'FAILED' 
       WHERE status = 'PENDING' AND created_at <= CURRENT_TIMESTAMP - INTERVAL '24 hours'
       RETURNING id`
    );
    abandonedOrdersCancelled = timeoutOrders.rows.length;

    // E. Global cleanup for users whose premium_until has passed and have no active/past_due subscription
    await db.query(
      `UPDATE users 
       SET is_premium = false, premium_until = NULL 
       WHERE is_premium = true 
         AND premium_until IS NOT NULL 
         AND premium_until <= CURRENT_TIMESTAMP 
         AND id NOT IN (
           SELECT user_id FROM subscriptions 
           WHERE status IN ('ACTIVE', 'PAST_DUE') AND (end_date > CURRENT_TIMESTAMP OR past_due_until > CURRENT_TIMESTAMP)
         )`
    );

    return {
      pastDueCount,
      expiredCount,
      cancelledExpiredCount,
      abandonedOrdersCancelled,
    };
  }

  /**
   * 10. Get Payment Order Status (IDOR protected)
   */
  async getOrderStatus(orderCode: string, userId: number): Promise<PaymentOrder> {
    const order = await subscriptionRepository.getPaymentOrderByCode(orderCode);
    if (!order) {
      throw new AppError('Đơn hàng không tồn tại', 404);
    }
    if (order.user_id !== userId) {
      throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
    }
    return order;
  }
}

export const subscriptionService = new SubscriptionService();

/**
 * Background Scheduler Initialization
 */
let sweepIntervalTimer: NodeJS.Timeout | null = null;

export function initSubscriptionScheduler(intervalMs = 30 * 60 * 1000) {
  // Run first sweep on boot after small delay (5s)
  setTimeout(() => {
    subscriptionService.syncAllSubscriptionsBatch().catch((err) => {
      console.error('Subscription background sweep error on boot:', err);
    });
  }, 5000);

  if (sweepIntervalTimer) clearInterval(sweepIntervalTimer);
  sweepIntervalTimer = setInterval(() => {
    subscriptionService.syncAllSubscriptionsBatch().catch((err) => {
      console.error('Subscription background periodic sweep error:', err);
    });
  }, intervalMs);

  // Allow node process to exit naturally during test runs
  if (sweepIntervalTimer && typeof sweepIntervalTimer.unref === 'function') {
    sweepIntervalTimer.unref();
  }
}
