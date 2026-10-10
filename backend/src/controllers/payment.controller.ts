import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';
import { subscriptionService } from '../services/subscription.service';
import { entitlementService } from '../services/entitlement.service';
import { AppError } from '../utils/AppError';

/**
 * 1. Get Subscription Plans (Public)
 */
export const getPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getPlans();
    return res.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('getPlans error:', error);
    return res.status(500).json({ error: 'Lỗi tải danh sách gói cước' });
  }
};

/**
 * 2. Get Current User's Subscription & Usage (Authenticated)
 */
export const getMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const data = await subscriptionService.getUserSubscription(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('getMySubscription error:', error);
    return res.status(500).json({ error: 'Lỗi tải thông tin gói cước của người dùng' });
  }
};

/**
 * 2b. Get Current User's Entitlements & Daily Quotas (Phase 20)
 */
export const getMyEntitlements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const data = await entitlementService.getEntitlements(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('getMyEntitlements error:', error);
    return res.status(500).json({ error: 'Lỗi tải thông tin quyền lợi và hạn ngạch của người dùng' });
  }
};

/**
 * 3. Create Checkout Session / Order (Authenticated)
 */
export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { planCode } = req.body;
    if (!planCode) {
      return res.status(400).json({ error: 'Vui lòng chọn gói đăng ký' });
    }

    const checkoutData = await subscriptionService.createCheckout(userId, planCode);
    return res.json({ success: true, data: checkoutData });
  } catch (error: any) {
    console.error('createCheckout error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Lỗi tạo đơn thanh toán' });
  }
};

/**
 * 4. Payment Gateway Webhook (Public, Cryptographically Signed)
 * Webhook MUST verify cryptographic HMAC signature. NEVER trust client paymentSuccess=true.
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-signature'] as string) || req.body?.signature;
    const result = await subscriptionService.handleWebhook(req.body, signature);
    return res.json(result);
  } catch (error: any) {
    console.error('Webhook verification error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message || 'Lỗi xử lý webhook' });
  }
};

/**
 * 5. Cancel Subscription (Authenticated)
 * Sets status to CANCELLED, preserves access and is_premium until end_date.
 */
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const result = await subscriptionService.cancelSubscription(userId);
    return res.json(result);
  } catch (error: any) {
    console.error('cancelSubscription error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Lỗi hủy gói đăng ký' });
  }
};

/**
 * 6. Get Payment Order Status (Authenticated, IDOR Protected)
 */
export const getOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { orderCode } = req.params;
    if (!orderCode) {
      return res.status(400).json({ error: 'Thiếu mã đơn hàng' });
    }

    const order = await subscriptionService.getOrderStatus(orderCode, userId);
    return res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('getOrderStatus error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Lỗi tra cứu đơn hàng' });
  }
};

/**
 * 7. Simulate Past Due / Grace Period Transition (Authenticated / Admin / Testing)
 */
export const simulatePastDue = async (req: AuthRequest, res: Response) => {
  try {
    const { subscriptionId, gracePeriodDays } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Thiếu subscriptionId' });
    }

    const result = await subscriptionService.markPastDue(Number(subscriptionId), gracePeriodDays || 3);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('simulatePastDue error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 8. Sync Expired Subscriptions (Authenticated / Testing)
 */
export const syncExpiry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body?.userId || req.user?.id;
    if (userId) {
      await subscriptionService.syncUserSubscription(Number(userId));
    }
    return res.json({ success: true, message: 'Đồng bộ trạng thái hết hạn thành công' });
  } catch (error: any) {
    console.error('syncExpiry error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 9. Download document (Preserve existing functionality)
 */
export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const buyerId = req.user?.id;

    if (!buyerId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [documentId]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại' });
    }

    const document = docResult.rows[0];

    // If public document or if user is owner
    if (document.visibility === 'public' || document.user_id === buyerId) {
      return res.json({ downloadUrl: document.doc_url });
    }

    return res.status(403).json({ error: 'Bạn không có quyền tải xuống tài liệu riêng tư này.' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tải xuống' });
  }
};

/**
 * 10. Simulate Sandbox Payment (Authenticated, only for Sandbox gateway orders)
 * Strictly verifies the order belongs to the requester, computes real HMAC signature,
 * and passes it through handleWebhook to guarantee 100% verification fidelity.
 */
export const simulateSandboxPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { orderCode } = req.body;
    if (!orderCode) {
      return res.status(400).json({ error: 'Thiếu orderCode' });
    }

    const order = await subscriptionService.getOrderStatus(String(orderCode), userId);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    if (order.status === 'COMPLETED') {
      return res.json({ success: true, message: 'Đơn hàng đã thanh toán thành công' });
    }

    if (order.payment_gateway !== 'SANDBOX') {
      return res.status(400).json({ error: 'Đơn hàng này được xử lý bởi cổng thanh toán trực tiếp, không hỗ trợ Sandbox simulator' });
    }

    // Construct valid webhook payload
    const payloadData = {
      orderCode: Number(order.order_code),
      amount: Number(order.amount),
      description: `Thanh toan ${order.plan_code || 'PRO'}`,
      accountNumber: 'SANDBOX_ACCOUNT',
      reference: `SANDBOX_REF_${Date.now()}`,
      transactionDateTime: new Date().toISOString(),
      currency: order.currency || 'VND',
      paymentLinkId: `SANDBOX_LINK_${order.order_code}`,
      code: '00',
      desc: 'success',
    };

    const signature = subscriptionService.generateSignature(payloadData);
    const result = await subscriptionService.handleWebhook({ data: payloadData, signature }, signature);

    return res.json({
      success: true,
      message: 'Mô phỏng thanh toán sandbox thành công qua webhook có chữ ký HMAC',
      result,
    });
  } catch (error: any) {
    console.error('simulateSandboxPayment error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Lỗi mô phỏng thanh toán sandbox' });
  }
};

/**
 * 11. Trigger Global Subscription Cron Sweep (Admin / Scheduled Job / Dashboard)
 */
export const triggerCronSweep = async (req: AuthRequest, res: Response) => {
  try {
    const result = await subscriptionService.syncAllSubscriptionsBatch();
    return res.json({
      success: true,
      message: 'Đã hoàn tất quét nền đồng bộ trạng thái gói cước toàn hệ thống',
      data: result,
    });
  } catch (error: any) {
    console.error('triggerCronSweep error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi quét nền đồng bộ gói cước' });
  }
};


