import axios from 'axios';
import { db } from '../src/db';
import { subscriptionService } from '../src/services/subscription.service';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase17Tests() {
  console.log('\n========================================================');
  console.log('       COGNITO PHASE 17: SUBSCRIPTION & PAYMENTS        ');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Test assertion failed: ${msg}`);
    }
    passedTests++;
    console.log(`  [PASS] ${msg}`);
  }

  // 1. Cleanup old test data
  await db.query(`DELETE FROM payment_orders WHERE order_code LIKE 'P17%' OR order_code LIKE '999%'`);
  await db.query(`DELETE FROM users WHERE name LIKE 'P17 %' OR email LIKE '%@p17.cognito.test'`);

  async function registerUser(email: string, name: string, role: string = 'user') {
    const phone = '097' + Math.floor(1000000 + Math.random() * 9000000);
    const uniqueName = `${name} ${Math.floor(Math.random() * 100000)}`;
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: uniqueName,
      email,
      password: 'Password123!',
      phone,
    });
    const userId = res.data.user.id;
    let token = res.data.token;
    if (role !== 'user') {
      await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password: 'Password123!',
      });
      token = loginRes.data.token;
    }
    return {
      id: userId,
      name: uniqueName,
      email,
      token,
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  const timestamp = Date.now();
  const userA = await registerUser(`p17_user_a_${timestamp}@p17.cognito.test`, 'P17 User A');
  const userB = await registerUser(`p17_user_b_${timestamp}@p17.cognito.test`, 'P17 User B');

  // ──────────────────────────────────────────────────────────
  // SUITE 1: SCHEMA INTEGRITY & SEED VERIFICATION
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 1: SCHEMA INTEGRITY & PHASE 1 TABLE RE-USE ---');

  const plansRes = await axios.get(`${API_BASE}/payment/plans`);
  assert(plansRes.status === 200, '1.1 GET /api/payment/plans returns HTTP 200');
  const plans = plansRes.data.data;
  assert(Array.isArray(plans) && plans.length >= 3, '1.2 At least 3 subscription plans exist');

  const freePlan = plans.find((p: any) => p.code === 'FREE');
  const monthlyPlan = plans.find((p: any) => p.code === 'PRO_MONTHLY');
  const yearlyPlan = plans.find((p: any) => p.code === 'PRO_YEARLY');

  assert(Boolean(freePlan) && Number(freePlan.price) === 0, '1.3 FREE plan seeded with price 0 VND');
  assert(Boolean(monthlyPlan) && Number(monthlyPlan.price) === 99000, '1.4 PRO_MONTHLY seeded with 99,000 VND');
  assert(Boolean(yearlyPlan) && Number(yearlyPlan.price) === 899000, '1.5 PRO_YEARLY seeded with 899,000 VND');

  // Check database columns on subscriptions & payment_orders
  const subCols = await db.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'subscriptions'
  `);
  const subColNames = subCols.rows.map((r: any) => r.column_name);
  assert(subColNames.includes('plan_id'), '1.6 subscriptions table has plan_id column');
  assert(subColNames.includes('cancelled_at'), '1.7 subscriptions table has cancelled_at column');
  assert(subColNames.includes('past_due_until'), '1.8 subscriptions table has past_due_until column');

  // ──────────────────────────────────────────────────────────
  // SUITE 2: CHECKOUT CREATION & PROVIDER SAFETY
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: CHECKOUT CREATION & PROVIDER SAFETY ---');

  // 2.1 Attempt to checkout FREE plan should fail
  try {
    await axios.post(`${API_BASE}/payment/checkout`, { planCode: 'FREE' }, { headers: userA.headers });
    assert(false, '2.1 Checkout FREE plan must throw error');
  } catch (err: any) {
    assert(err.response?.status === 400, '2.1 Cannot checkout FREE plan with payment (HTTP 400)');
  }

  // 2.2 Create checkout for PRO_MONTHLY
  const checkoutRes = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userA.headers }
  );
  assert(checkoutRes.status === 200, '2.2 Checkout for PRO_MONTHLY returns HTTP 200');
  const checkoutData = checkoutRes.data.data;
  assert(Boolean(checkoutData.orderCode), '2.3 Unique orderCode generated');
  assert(checkoutData.amount === 99000, '2.4 Checkout amount matches PRO_MONTHLY price');
  assert(checkoutData.gateway === 'SANDBOX', '2.5 Gateway set to SANDBOX when live credentials are placeholders');

  // Verify order in database
  const orderInDb = await db.query('SELECT * FROM payment_orders WHERE order_code = $1', [checkoutData.orderCode]);
  assert(orderInDb.rows.length === 1, '2.6 Order recorded in payment_orders table');
  assert(orderInDb.rows[0].status === 'PENDING', '2.7 Order initial status is strictly PENDING');
  assert(orderInDb.rows[0].user_id === userA.id, '2.8 Order belongs to User A');

  // User A should still NOT be premium yet
  const userCheck1 = await db.query('SELECT is_premium FROM users WHERE id = $1', [userA.id]);
  assert(userCheck1.rows[0].is_premium === false, '2.9 User A is NOT premium while order is PENDING');

  // ──────────────────────────────────────────────────────────
  // SUITE 3: WEBHOOK SIGNATURE VERIFICATION & SECURITY
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: WEBHOOK SECURITY & CRYPTOGRAPHIC VERIFICATION ---');

  const testOrderCode = checkoutData.orderCode;
  const webhookData = {
    orderCode: Number(testOrderCode),
    amount: 99000,
    description: 'Thanh toan PRO_MONTHLY',
    accountNumber: 'SANDBOX_ACCOUNT',
    reference: `REF_${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: `LINK_${testOrderCode}`,
    code: '00',
    desc: 'success',
  };

  // 3.1 Webhook without signature MUST be rejected
  try {
    await axios.post(`${API_BASE}/payment/webhook`, { data: webhookData });
    assert(false, '3.1 Webhook without signature must fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '3.1 Webhook without signature rejected with HTTP 401');
  }

  // 3.2 Webhook with forged / invalid signature MUST be rejected
  try {
    await axios.post(`${API_BASE}/payment/webhook`, {
      data: webhookData,
      signature: 'deadbeef_invalid_forged_signature_12345',
    });
    assert(false, '3.2 Webhook with forged signature must fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '3.2 Webhook with invalid signature rejected with HTTP 401');
  }

  // 3.3 Webhook with altered amount (tampered data) MUST be rejected
  const tamperedData = { ...webhookData, amount: 1000 };
  const genuineSigForRealAmount = subscriptionService.generateSignature(webhookData);
  try {
    await axios.post(`${API_BASE}/payment/webhook`, {
      data: tamperedData,
      signature: genuineSigForRealAmount,
    });
    assert(false, '3.3 Webhook with tampered amount must fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '3.3 Tampered amount rejected with HTTP 401');
  }

  // 3.3.1 Webhook with valid signature but failed code (code: '01') MUST mark order FAILED and NOT upgrade user
  const failedOrderRes = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userA.headers }
  );
  const failedOrderCode = Number(failedOrderRes.data.data.orderCode);
  const failedWebhookData = {
    orderCode: failedOrderCode,
    amount: 99000,
    description: 'Thanh toan PRO_MONTHLY that bai',
    accountNumber: 'SANDBOX_ACCOUNT',
    reference: `REF_FAIL_${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: `LINK_FAIL_${failedOrderCode}`,
    code: '01', // Failed code from gateway
    desc: 'Transaction declined by bank',
  };
  const failSignature = subscriptionService.generateSignature(failedWebhookData);
  const webhookFailRes = await axios.post(`${API_BASE}/payment/webhook`, {
    data: failedWebhookData,
    signature: failSignature,
  });
  assert(webhookFailRes.status === 200, '3.3.1 Webhook with failed code returns HTTP 200 to acknowledge gateway');
  assert(webhookFailRes.data.success === false, '3.3.2 Webhook response reports success: false for failed payment');

  const failedOrderInDb = await db.query('SELECT status FROM payment_orders WHERE order_code = $1', [String(failedOrderCode)]);
  assert(failedOrderInDb.rows[0].status === 'FAILED', '3.3.3 Order status transitioned to FAILED in database');

  const userAfterFail = await db.query('SELECT is_premium FROM users WHERE id = $1', [userA.id]);
  assert(userAfterFail.rows[0].is_premium === false, '3.3.4 User A remains FREE with is_premium = false after failed payment');

  // 3.4 Valid Webhook with authentic HMAC-SHA256 signature
  const validSignature = subscriptionService.generateSignature(webhookData);
  const webhookSuccessRes = await axios.post(`${API_BASE}/payment/webhook`, {
    data: webhookData,
    signature: validSignature,
  });
  assert(webhookSuccessRes.status === 200, '3.4 Valid webhook returns HTTP 200');
  assert(webhookSuccessRes.data.success === true, '3.5 Webhook reports success');

  // Verify DB state after webhook: Order COMPLETED, User ACTIVE, is_premium true
  const orderAfter = await db.query('SELECT * FROM payment_orders WHERE order_code = $1', [testOrderCode]);
  assert(orderAfter.rows[0].status === 'COMPLETED', '3.6 Order status transitioned to COMPLETED');
  assert(Boolean(orderAfter.rows[0].paid_at), '3.7 Order paid_at timestamp recorded');

  const userAfter = await db.query('SELECT is_premium, premium_until FROM users WHERE id = $1', [userA.id]);
  assert(userAfter.rows[0].is_premium === true, '3.8 SINGLE SOURCE OF TRUTH: users.is_premium = true');
  assert(Boolean(userAfter.rows[0].premium_until), '3.9 SINGLE SOURCE OF TRUTH: users.premium_until set');

  const subAfter = await db.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userA.id]);
  assert(subAfter.rows[0].status === 'ACTIVE', '3.10 Subscription status is ACTIVE');

  // 3.11 Idempotency test: Webhook retry should NOT duplicate subscriptions
  const subCountBefore = (await db.query('SELECT COUNT(*) FROM subscriptions WHERE user_id = $1', [userA.id])).rows[0].count;
  const webhookRetryRes = await axios.post(`${API_BASE}/payment/webhook`, {
    data: webhookData,
    signature: validSignature,
  });
  assert(webhookRetryRes.status === 200, '3.11 Webhook retry returns HTTP 200 (Idempotent)');
  const subCountAfter = (await db.query('SELECT COUNT(*) FROM subscriptions WHERE user_id = $1', [userA.id])).rows[0].count;
  assert(subCountBefore === subCountAfter, '3.12 Idempotency: Duplicate webhook did NOT duplicate subscriptions');

  // ──────────────────────────────────────────────────────────
  // SUITE 4: COMPLETE STATE MACHINE TRANSITIONS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: COMPLETE STATE MACHINE TRANSITIONS ---');

  // 4.1 ACTIVE -> CANCELLED (User cancels auto-renewal)
  const cancelRes = await axios.post(
    `${API_BASE}/payment/subscription/cancel`,
    {},
    { headers: userA.headers }
  );
  assert(cancelRes.status === 200, '4.1 Cancel auto-renew returns HTTP 200');

  const subCancelled = await db.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userA.id]);
  assert(subCancelled.rows[0].status === 'CANCELLED', '4.2 Subscription status is CANCELLED');
  assert(Boolean(subCancelled.rows[0].cancelled_at), '4.3 cancelled_at recorded');

  // CRITICAL RULE: User MUST KEEP premium rights until end_date!
  const userStillPremium = await db.query('SELECT is_premium, premium_until FROM users WHERE id = $1', [userA.id]);
  assert(userStillPremium.rows[0].is_premium === true, '4.4 CANCELLED user KEEPS is_premium = true until cycle end');
  assert(new Date(userStillPremium.rows[0].premium_until) > new Date(), '4.5 premium_until remains in the future');

  // 4.6 CANCELLED -> EXPIRED (Simulate cycle end date passing)
  await db.query(
    `UPDATE subscriptions 
     SET end_date = CURRENT_TIMESTAMP - INTERVAL '1 day' 
     WHERE id = $1`,
    [subCancelled.rows[0].id]
  );
  await db.query(
    `UPDATE users 
     SET premium_until = CURRENT_TIMESTAMP - INTERVAL '1 day' 
     WHERE id = $1`,
    [userA.id]
  );

  // Calling sync or getMySubscription triggers transition to EXPIRED
  const mySubRes = await axios.get(`${API_BASE}/payment/subscription/me`, { headers: userA.headers });
  assert(mySubRes.status === 200, '4.6 GET /subscription/me returns HTTP 200');
  assert(mySubRes.data.data.is_premium === false, '4.7 Cycle passed: is_premium transitioned to false');

  const subExpired = await db.query('SELECT status FROM subscriptions WHERE id = $1', [subCancelled.rows[0].id]);
  assert(subExpired.rows[0].status === 'EXPIRED', '4.8 Subscription transitioned to EXPIRED');

  // 4.9 ACTIVE -> PAST_DUE (Grace period) -> EXPIRED
  // Create subscription for User B
  const checkoutB = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userB.headers }
  );
  const dataB = {
    orderCode: Number(checkoutB.data.data.orderCode),
    amount: 99000,
    description: 'Thanh toan PRO_MONTHLY',
    accountNumber: 'SANDBOX_ACCOUNT',
    reference: `REF_B_${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: `LINK_B_${checkoutB.data.data.orderCode}`,
    code: '00',
    desc: 'success',
  };
  const sigB = subscriptionService.generateSignature(dataB);
  await axios.post(`${API_BASE}/payment/webhook`, { data: dataB, signature: sigB });

  const subB = await db.query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userB.id]);
  assert(subB.rows[0].status === 'ACTIVE', '4.9 User B subscription is ACTIVE');

  // Trigger PAST_DUE simulation with 3-day grace period
  const pastDueRes = await axios.post(
    `${API_BASE}/payment/subscription/simulate-past-due`,
    { subscriptionId: subB.rows[0].id, gracePeriodDays: 3 },
    { headers: userB.headers }
  );
  assert(pastDueRes.status === 200, '4.10 Simulate PAST_DUE returns HTTP 200');

  const subBPastDue = await db.query('SELECT * FROM subscriptions WHERE id = $1', [subB.rows[0].id]);
  assert(subBPastDue.rows[0].status === 'PAST_DUE', '4.11 Status transitioned to PAST_DUE');
  assert(Boolean(subBPastDue.rows[0].past_due_until), '4.12 Grace period past_due_until is set');

  const userBInGrace = await db.query('SELECT is_premium FROM users WHERE id = $1', [userB.id]);
  assert(userBInGrace.rows[0].is_premium === true, '4.13 User retains premium access during grace period');

  // Simulate grace period expiration
  await db.query(
    `UPDATE subscriptions 
     SET past_due_until = CURRENT_TIMESTAMP - INTERVAL '1 day', end_date = CURRENT_TIMESTAMP - INTERVAL '4 days' 
     WHERE id = $1`,
    [subB.rows[0].id]
  );

  await axios.post(`${API_BASE}/payment/subscription/sync-expiry`, { userId: userB.id }, { headers: userB.headers });

  const userBExpired = await db.query('SELECT is_premium FROM users WHERE id = $1', [userB.id]);
  assert(userBExpired.rows[0].is_premium === false, '4.14 Grace period ended: User B is_premium revoked to false');

  const subBExpired = await db.query('SELECT status FROM subscriptions WHERE id = $1', [subB.rows[0].id]);
  assert(subBExpired.rows[0].status === 'EXPIRED', '4.15 Status transitioned from PAST_DUE to EXPIRED');

  // ──────────────────────────────────────────────────────────
  // SUITE 5: IDOR & ANTI-TAMPERING SECURITY
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: IDOR & SECURITY PROTECTION ---');

  // 5.1 User B cannot check User A's order status
  try {
    await axios.get(`${API_BASE}/payment/orders/${testOrderCode}/status`, { headers: userB.headers });
    assert(false, '5.1 User B querying User A order must fail');
  } catch (err: any) {
    assert(err.response?.status === 403, '5.1 IDOR blocked: User B querying User A order gets HTTP 403');
  }

  // 5.2 User A can check their own order status
  const ownOrderRes = await axios.get(`${API_BASE}/payment/orders/${testOrderCode}/status`, { headers: userA.headers });
  assert(ownOrderRes.status === 200, '5.2 User A can view their own order status');
  assert(ownOrderRes.data.data.status === 'COMPLETED', '5.3 Order status verified as COMPLETED');

  // 5.4 Sandbox payment simulator: strictly executes HMAC webhook
  const checkoutNew = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userA.headers }
  );
  const newOrderCode = checkoutNew.data.data.orderCode;

  const simRes = await axios.post(
    `${API_BASE}/payment/sandbox/simulate-payment`,
    { orderCode: newOrderCode },
    { headers: userA.headers }
  );
  assert(simRes.status === 200, '5.4 Sandbox simulate-payment returns HTTP 200');
  assert(simRes.data.success === true, '5.5 Sandbox simulation executes webhook with signature verification');

  const recheckUserA = await db.query('SELECT is_premium FROM users WHERE id = $1', [userA.id]);
  assert(recheckUserA.rows[0].is_premium === true, '5.6 User A reactivated to premium via verified sandbox webhook');

  // ──────────────────────────────────────────────────────────
  // SUITE 6: SINGLE SOURCE OF TRUTH & REQUIRE_PREMIUM MIDDLEWARE
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: REQUIRE_PREMIUM MIDDLEWARE & SINGLE SOURCE OF TRUTH ---');

  // 6.1 User B is not premium -> requirePremium must return 403 Forbidden
  try {
    await axios.post(
      `${API_BASE}/ai/generate-mindmap`,
      { title: 'Test Mindmap', content: 'Sample text' },
      { headers: userB.headers }
    );
    assert(false, '6.1 Non-premium user accessing requirePremium route must fail');
  } catch (err: any) {
    assert(err.response?.status === 403, '6.1 Non-premium user gets HTTP 403 Forbidden from requirePremium');
    assert(err.response?.data?.error?.includes('Premium'), '6.2 Error message specifies Premium requirement');
  }

  // 6.3 User A is currently active premium -> requirePremium allows request through (NOT 403)
  try {
    const aiRes = await axios.post(
      `${API_BASE}/ai/generate-mindmap`,
      { title: 'Valid Title', content: 'Sufficient content for mindmap generating test' },
      { headers: userA.headers }
    );
    assert(aiRes.status !== 403, '6.3 Active premium user passes requirePremium check');
  } catch (err: any) {
    assert(err.response?.status !== 403, '6.3 Active premium user is NOT blocked by requirePremium');
  }

  // 6.4 When User A expires, requirePremium immediately blocks them again
  await db.query(`UPDATE users SET is_premium = false, premium_until = NULL WHERE id = $1`, [userA.id]);
  try {
    await axios.post(
      `${API_BASE}/ai/generate-mindmap`,
      { title: 'Test Mindmap', content: 'Sample text' },
      { headers: userA.headers }
    );
    assert(false, '6.4 Expired user must be blocked by requirePremium');
  } catch (err: any) {
    assert(err.response?.status === 403, '6.4 Expired user immediately blocked by requirePremium (HTTP 403)');
  }

  // ──────────────────────────────────────────────────────────
  // SUITE 7: CONCURRENT WEBHOOK RACE CONDITION (FOR UPDATE LOCK)
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: CONCURRENT WEBHOOK RACE CONDITION (FOR UPDATE LOCK) ---');

  // Register fresh User C with 0 subscriptions
  const userC = await registerUser(`p17_user_c_${timestamp}@p17.cognito.test`, 'P17 User C');

  // Create checkout order for User C
  const raceCheckout = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userC.headers }
  );
  const raceOrderCode = raceCheckout.data.data.orderCode;

  const raceWebhookData = {
    orderCode: Number(raceOrderCode),
    amount: 99000,
    description: 'Thanh toan PRO_MONTHLY',
    accountNumber: 'SANDBOX_ACCOUNT',
    reference: `REF_RACE_${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: `LINK_RACE_${raceOrderCode}`,
    code: '00',
    desc: 'success',
  };
  const raceSig = subscriptionService.generateSignature(raceWebhookData);

  // Measure initial subscription count (should be 0)
  const subCountStart = (await db.query('SELECT COUNT(*) FROM subscriptions WHERE user_id = $1', [userC.id])).rows[0].count;
  assert(Number(subCountStart) === 0, '7.0 Fresh User C starts with 0 subscriptions');

  // FIRE TWO WEBHOOKS SIMULTANEOUSLY FOR THE EXACT SAME ORDER
  const [res1, res2] = await Promise.all([
    axios.post(`${API_BASE}/payment/webhook`, { data: raceWebhookData, signature: raceSig }),
    axios.post(`${API_BASE}/payment/webhook`, { data: raceWebhookData, signature: raceSig }),
  ]);

  assert(res1.status === 200 && res2.status === 200, '7.1 Both concurrent webhook requests return HTTP 200');

  // Verify order is COMPLETED
  const raceOrderAfter = await db.query('SELECT status FROM payment_orders WHERE order_code = $1', [raceOrderCode]);
  assert(raceOrderAfter.rows[0].status === 'COMPLETED', '7.2 Order status is COMPLETED');

  // Verify exactly ONE subscription was added
  const subCountEnd = (await db.query('SELECT COUNT(*) FROM subscriptions WHERE user_id = $1', [userC.id])).rows[0].count;
  assert(Number(subCountEnd) === 1, '7.3 Concurrency check: Exactly ONE subscription row created, zero duplicate rows');

  // Verify end_date is exactly 30 days from now, NOT doubled to 60 days
  const latestSubResC = await db.query('SELECT id, start_date, end_date FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userC.id]);
  const latestSubC = latestSubResC.rows[0];
  const diffDays = Math.round((new Date(latestSubC.end_date).getTime() - new Date(latestSubC.start_date).getTime()) / 86400000);
  assert(diffDays === 30, `7.4 Concurrency check: Sub duration is exactly 30 days, not double-credited (actual: ${diffDays} days)`);

  // Verify User C is premium
  const userCCheck = await db.query('SELECT is_premium FROM users WHERE id = $1', [userC.id]);
  assert(userCCheck.rows[0].is_premium === true, '7.5 User C is activated to premium');

  // ──────────────────────────────────────────────────────────
  // SUITE 8: GLOBAL BACKGROUND CRON SWEEP & ABANDONED ORDERS
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 8: GLOBAL BACKGROUND CRON SWEEP & NOTIFICATIONS ---');

  // 8.1 Create simulated abandoned PENDING order (> 25 hours ago)
  const oldOrderCode = `P17_ABANDONED_${Date.now()}`;
  await db.query(
    `INSERT INTO payment_orders (user_id, plan_id, order_code, amount, status, payment_gateway, created_at)
     VALUES ($1, 2, $2, 99000, 'PENDING', 'SANDBOX', CURRENT_TIMESTAMP - INTERVAL '25 hours')`,
    [userC.id, oldOrderCode]
  );

  // 8.2 Create simulated expired ACTIVE subscription for User C (> 1 hour ago)
  await db.query(
    `UPDATE subscriptions 
     SET end_date = CURRENT_TIMESTAMP - INTERVAL '1 hour', auto_renew = true
     WHERE id = $1`,
    [latestSubC.id]
  );

  // Trigger global sweep endpoint
  const sweepRes = await axios.post(`${API_BASE}/payment/subscription/cron-sweep`, {}, { headers: userC.headers });
  assert(sweepRes.status === 200, '8.1 POST /api/payment/subscription/cron-sweep returns HTTP 200');

  // Verify abandoned order transitioned to FAILED
  const abandonedCheck = await db.query('SELECT status FROM payment_orders WHERE order_code = $1', [oldOrderCode]);
  assert(abandonedCheck.rows[0].status === 'FAILED', '8.2 Abandoned PENDING order (> 24h) auto-transitioned to FAILED');

  // Verify active subscription transitioned to PAST_DUE (Grace period)
  const subPastDueCheck = await db.query('SELECT status, past_due_until FROM subscriptions WHERE id = $1', [latestSubC.id]);
  assert(subPastDueCheck.rows[0].status === 'PAST_DUE', '8.3 Expired active subscription auto-transitioned to PAST_DUE');
  assert(Boolean(subPastDueCheck.rows[0].past_due_until), '8.4 3-day grace period past_due_until assigned');

  // Verify notification was generated for PAST_DUE
  const notifCheck = await db.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND type = 'payment' AND title LIKE '%ân hạn%'
     ORDER BY id DESC LIMIT 1`,
    [userC.id]
  );
  assert(notifCheck.rows.length === 1, '8.5 Notification sent to user notifying about grace period');

  // ──────────────────────────────────────────────────────────
  // CLEANUP & SUMMARY
  // ──────────────────────────────────────────────────────────
  await db.query(`DELETE FROM payment_orders WHERE order_code LIKE 'P17%' OR order_code LIKE '999%'`);
  await db.query(`DELETE FROM users WHERE name LIKE 'P17 %' OR email LIKE '%@p17.cognito.test'`);

  console.log('\n========================================================');
  console.log(`  PHASE 17 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('========================================================\n');
  return { passedTests, totalTests };
}

if (require.main === module) {
  runPhase17Tests()
    .then(() => {
      console.log('All Phase 17 tests completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Phase 17 tests failed with error:', err);
      process.exit(1);
    });
}
