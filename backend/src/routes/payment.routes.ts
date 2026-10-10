import { Router } from 'express';
import {
  getPlans,
  getMySubscription,
  getMyEntitlements,
  createCheckout,
  handleWebhook,
  cancelSubscription,
  getOrderStatus,
  simulatePastDue,
  syncExpiry,
  triggerCronSweep,
  simulateSandboxPayment,
  downloadDocument,
} from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public: Get all active plans
router.get('/plans', getPlans);

// Authenticated: Get current user's subscription & daily usage
router.get('/subscription/me', authenticate, getMySubscription);

// Authenticated: Get current user's detailed entitlements & quota status (Phase 20)
router.get('/entitlements', authenticate, getMyEntitlements);

// Authenticated: Create checkout order (PENDING)
router.post('/checkout', authenticate, createCheckout);

// Public / Signed: Gateway Webhook (HMAC-SHA256 signature verification)
// NEVER trusts client-supplied paymentSuccess=true
router.post('/webhook', handleWebhook);

// Authenticated: Cancel auto-renewal (Active -> Cancelled, retains access until end_date)
router.post('/subscription/cancel', authenticate, cancelSubscription);

// Authenticated: Get order status (IDOR protected)
router.get('/orders/:orderCode/status', authenticate, getOrderStatus);

// Admin / Testing: Simulate past due grace period transition
router.post('/subscription/simulate-past-due', authenticate, simulatePastDue);

// Admin / Testing: Trigger sync of expired subscriptions
router.post('/subscription/sync-expiry', authenticate, syncExpiry);

// Admin / Testing / Cron: Trigger global sweep of all expired subscriptions & abandoned orders
router.post('/subscription/cron-sweep', authenticate, triggerCronSweep);

// Sandbox Simulator: Securely simulate payment by generating authentic HMAC signature for sandbox orders
router.post('/sandbox/simulate-payment', authenticate, simulateSandboxPayment);

// Document download payment (Wallet / Purchased)
router.post('/download/:documentId', authenticate, downloadDocument);

export default router;
