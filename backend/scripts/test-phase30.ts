import axios from 'axios';
import { db } from '../src/db';
import { subscriptionService } from '../src/services/subscription.service';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase30Tests() {
  console.log('========================================================================');
  console.log('       COGNITO PHASE 30: FULL BUSINESS FLOW END-TO-END TESTS            ');
  console.log('========================================================================\n');

  const timestamp = Date.now();

  // Helper to register fresh test users
  async function createTestUser(role: 'user' | 'admin' = 'user', label: string = 'User') {
    const randSuffix = Math.floor(Math.random() * 100000);
    const email = `p30_${label.toLowerCase().replace(/\s+/g, '_')}_${timestamp}_${randSuffix}@p30.test`;
    const name = `P30 ${label} ${timestamp.toString().slice(-4)}_${randSuffix}`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name,
      email,
      password: 'StrongPassword123!',
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`
    });
    const token = regRes.data.token || regRes.data.accessToken;
    const userId = regRes.data.user.id;
    if (role === 'admin') {
      await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
    }
    return {
      id: userId,
      email,
      name,
      token,
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  const userA = await createTestUser('user', 'Student A');
  const userB = await createTestUser('user', 'Student B');
  const userBad = await createTestUser('user', 'Spammer Bad');
  const admin = await createTestUser('admin', 'Admin Mod');

  console.log(`[Setup] User A: ${userA.id} (${userA.email})`);
  console.log(`[Setup] User B: ${userB.id} (${userB.email})`);
  console.log(`[Setup] User Bad: ${userBad.id} (${userBad.email})`);
  console.log(`[Setup] Admin: ${admin.id} (${admin.email})\n`);

  // ========================================================================
  // FLOW A — USER LEARNING (Cross-module: Auth -> Doc -> AI -> Quiz -> Progress)
  // ========================================================================
  console.log('========================================================================');
  console.log('--- FLOW A: USER LEARNING END-TO-END ---');
  console.log('========================================================================');

  // A.1 Verify Auth Login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: userA.email,
    password: 'StrongPassword123!'
  });
  assert(loginRes.status === 200 && Boolean(loginRes.data.token), 'A.1 Login User A succeeds with valid JWT');

  // A.2 Create & Upload Document
  const docCreation = await axios.post(
    `${API_BASE}/documents`,
    {
      title: 'Giáo trình Cơ sở Dữ liệu Quan hệ & Chuẩn hóa SQL',
      description: 'Tổng hợp kiến thức chuẩn hóa 1NF, 2NF, 3NF, BCNF và chỉ mục.',
      category: 'Công nghệ thông tin',
      docUrl: 'https://storage.cognito.test/docs/rdbms_fundamentals.txt',
      solutionText: 'Mô hình quan hệ dữ liệu sử dụng bảng, khóa chính và khóa ngoại để đảm bảo tính toàn vẹn.',
      visibility: 'private',
    },
    { headers: userA.headers }
  );
  const docAId = docCreation.data.id;
  assert(docCreation.status === 201 && docAId > 0, 'A.2 Upload & Register Document succeeds (HTTP 201)');

  // A.3 Document Processing Pipeline (Generate Chunks)
  await db.query(
    `INSERT INTO document_chunks (document_id, chunk_index, content, token_count)
     VALUES 
       ($1, 1, 'Chuẩn hóa cơ sở dữ liệu là quá trình tổ chức lại dữ liệu trong CSDL nhằm giảm thiểu dư thừa và tránh các dị thường khi thêm, xóa, sửa. Dạng chuẩn 1NF yêu cầu mọi thuộc tính đều là đơn trị.', 120),
       ($1, 2, 'Dạng chuẩn 2NF thỏa mãn 1NF và mọi thuộc tính không khóa đều phụ thuộc hàm đầy đủ vào khóa chính. Dạng chuẩn 3NF thỏa mãn 2NF và không có phụ thuộc hàm bắc cầu.', 130)
    `,
    [docAId]
  );
  await db.query("UPDATE documents SET processing_status = 'READY', status = 'READY', page_count = 2 WHERE id = $1", [docAId]);
  
  // A.4 Open Viewer (Get Details & Chunks)
  const viewerRes = await axios.get(`${API_BASE}/documents/${docAId}`, { headers: userA.headers });
  assert(viewerRes.status === 200 && viewerRes.data.id === docAId, 'A.4 Open Document in Viewer returns metadata (HTTP 200)');
  const chunksRes = await axios.get(`${API_BASE}/documents/${docAId}/chunks`, { headers: userA.headers });
  assert(chunksRes.status === 200 && chunksRes.data.chunks.length === 2, 'A.4 Document Chunks loaded into Viewer workspace');

  // A.5 AI Chat with Document
  const chatRes = await axios.post(
    `${API_BASE}/ai/chat`,
    {
      message: 'Giải thích ngắn gọn dạng chuẩn 3NF là gì?',
      context: 'Tài liệu Giáo trình Cơ sở Dữ liệu Quan hệ',
      documentId: docAId
    },
    { headers: userA.headers }
  );
  assert(chatRes.status === 200 && typeof chatRes.data.reply === 'string', 'A.5 AI Chat successfully answers questions based on document context');

  // A.6 Generate Questions (DRAFT)
  const tsRes = await db.query(
    `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active, status, visibility)
     VALUES ($1, 'Bài tập CSDL - Chuẩn hóa dữ liệu', 2, 20.0, true, 'DRAFT', 'private')
     RETURNING id`,
    [userA.id]
  );
  const testSetAId = tsRes.rows[0].id;

  const q1Res = await db.query(
    `INSERT INTO questions (test_set_id, type, content, score, options, correct_answer, explanation, difficulty, status)
     VALUES 
       ($1, 'MULTIPLE_CHOICE', 'Dạng chuẩn 1NF yêu cầu điều kiện gì?', 10.0, 
        '{"A":"Mọi thuộc tính đều là đơn trị","B":"Không có phụ thuộc hàm bắc cầu","C":"Không có khóa chính","D":"Tất cả đáp án đều đúng"}',
        '"A"', '1NF đòi hỏi các giá trị của mỗi thuộc tính trong bảng phải là giá trị nguyên tố đơn trị.', 'easy', 'DRAFT'),
       ($1, 'MULTIPLE_CHOICE', 'Dạng chuẩn 3NF loại trừ điều gì?', 10.0,
        '{"A":"Dư thừa khóa","B":"Phụ thuộc hàm bắc cầu","C":"Khóa ngoại","D":"Bảng tạm"}',
        '"B"', '3NF thỏa mãn 2NF và loại bỏ các phụ thuộc hàm bắc cầu vào khóa chính.', 'medium', 'DRAFT')
     RETURNING id`,
    [testSetAId]
  );
  const questionIds = q1Res.rows.map(r => r.id);
  assert(questionIds.length === 2, 'A.6 Generate Questions creates DRAFT question items');

  // A.7 Preview & Approve Question Set
  const previewSet = await axios.get(`${API_BASE}/test-sets/${testSetAId}`, { headers: userA.headers });
  assert(previewSet.status === 200 && previewSet.data.status === 'DRAFT', 'A.7 User previews question set in DRAFT state');

  const approveRes = await axios.post(`${API_BASE}/test-sets/${testSetAId}/approve`, {}, { headers: userA.headers });
  assert(approveRes.status === 200 && approveRes.data.testSet?.status === 'APPROVED', 'A.7 Approve Question Set transitions status to APPROVED');

  // A.8 Start Quiz (Anti-Cheat: Answers stripped)
  const startQuizRes = await axios.post(
    `${API_BASE}/quizzes/start`,
    { testSetId: testSetAId },
    { headers: userA.headers }
  );
  assert(startQuizRes.status === 201, 'A.8 Start Quiz creates attempt session (HTTP 201)');
  const attemptId = startQuizRes.data.attempt.id;
  assert(startQuizRes.data.attempt.status === 'IN_PROGRESS', 'A.8 Quiz attempt status is IN_PROGRESS');
  for (const q of startQuizRes.data.questions) {
    assert(q.correct_answer === undefined && q.correctAnswer === undefined, 'A.8 Anti-cheat: Correct answers strictly stripped while IN_PROGRESS');
  }

  // A.9 Submit Quiz (1 correct, 1 wrong to test mistake review)
  const submitQuizRes = await axios.post(
    `${API_BASE}/quizzes/attempts/${attemptId}/submit`,
    {
      answers: [
        { questionId: questionIds[0], answer: 'A' }, // Correct (10 pts)
        { questionId: questionIds[1], answer: 'C' }, // Wrong (0 pts)
      ],
      durationSeconds: 30
    },
    { headers: userA.headers }
  );
  assert(submitQuizRes.status === 200, 'A.9 Submit Quiz answers succeeds (HTTP 200)');
  assert(Number(submitQuizRes.data.attempt.score) === 10, 'A.9 Auto-grading correctly scored 10 / 20 points');
  assert(submitQuizRes.data.attempt.status === 'SUBMITTED', 'A.9 Attempt marked as SUBMITTED');

  // A.10 Review Mistakes
  const mistakesRes = await axios.get(`${API_BASE}/quizzes/attempts/${attemptId}/mistakes`, { headers: userA.headers });
  assert(mistakesRes.status === 200, 'A.10 Fetch Mistakes returns HTTP 200');
  assert(mistakesRes.data.totalMistakes === 1, 'A.10 Review Mistakes accurately identified exactly 1 wrong question');
  assert(mistakesRes.data.mistakes[0].question_id === questionIds[1], 'A.10 Mistake includes correct answer and explanation for review');

  // A.11 Cross-Phase Verification: Learning Activity & Progress Stats (Phase 10 integration)
  const progressRes = await axios.get(`${API_BASE}/progress/summary`, { headers: userA.headers });
  assert(progressRes.status === 200, 'A.11 Progress Summary returns HTTP 200');
  assert(Number(progressRes.data.total_documents_read) >= 1, 'A.11 Progress correctly reflects uploaded & studied document');
  assert(Number(progressRes.data.streak.currentStreak) >= 1, 'A.11 Study streak automatically incremented upon quiz completion');


  // ========================================================================
  // FLOW B — EXISTING EXAM (Upload Exam -> Parse -> Preview -> Save -> Quiz)
  // ========================================================================
  console.log('\n========================================================================');
  console.log('--- FLOW B: EXISTING EXAM IMPORT & TEST ---');
  console.log('========================================================================');

  // B.1 Parse Raw Exam Text
  const rawExamText = `
Câu 1: Giao thức mạng nào hoạt động ở tầng Transport trong mô hình OSI?
A. HTTP
B. TCP
C. IP
D. Ethernet
Đáp án: B
Giải thích: TCP và UDP là hai giao thức hoạt động tại tầng Transport (Giao vận).

Câu 2: Địa chỉ IPv4 có độ dài bao nhiêu bit?
A. 16 bit
B. 32 bit
C. 64 bit
D. 128 bit
Đáp án: B
Giải thích: Địa chỉ IPv4 chuẩn có độ dài 32 bit, chia làm 4 octet.
  `;

  const parseExamRes = await axios.post(
    `${API_BASE}/exams/parse`,
    {
      textContent: rawExamText,
      name: 'Đề thi trắc nghiệm Mạng máy tính',
      useAI: false
    },
    { headers: userB.headers }
  );
  assert(parseExamRes.status === 200 && parseExamRes.data.success === true, 'B.1 Parse Exam text succeeds (HTTP 200)');
  const parsedQuestions = parseExamRes.data.data.questions;
  assert(parsedQuestions.length === 2, 'B.1 Parser successfully extracted 2 questions with options');

  // B.2 User Correction & Save Official Exam
  parsedQuestions[0].score = 5.0;
  parsedQuestions[1].score = 5.0;
  parsedQuestions[0].content = `${parsedQuestions[0].content} (Đã chuẩn hóa)`;

  const importExamRes = await axios.post(
    `${API_BASE}/exams/import`,
    {
      name: 'Đề thi Mạng máy tính Chuẩn hóa',
      questions: parsedQuestions,
      status: 'APPROVED'
    },
    { headers: userB.headers }
  );
  assert(importExamRes.status === 201 && importExamRes.data.success === true, 'B.2 Save Imported Exam to database as APPROVED (HTTP 201)');
  const importedSetId = importExamRes.data.data.testSet.id;
  const importedQIds = importExamRes.data.data.questions.map((q: any) => q.id);

  // B.3 Take Quiz on Imported Exam
  const examQuizStart = await axios.post(
    `${API_BASE}/quizzes/start`,
    { testSetId: importedSetId },
    { headers: userB.headers }
  );
  assert(examQuizStart.status === 201, 'B.3 Start Quiz on Imported Exam succeeds');
  const examAttemptId = examQuizStart.data.attempt.id;

  // B.4 Submit Answers
  const examQuizSubmit = await axios.post(
    `${API_BASE}/quizzes/attempts/${examAttemptId}/submit`,
    {
      answers: [
        { questionId: importedQIds[0], answer: 'B' }, // Correct (5 pts)
        { questionId: importedQIds[1], answer: 'B' }, // Correct (5 pts)
      ],
      durationSeconds: 20
    },
    { headers: userB.headers }
  );
  assert(examQuizSubmit.status === 200, 'B.4 Submit Exam answers returns HTTP 200');
  assert(Number(examQuizSubmit.data.attempt.score) === 10, 'B.4 Perfect score 10/10 awarded on imported exam');


  // ========================================================================
  // FLOW C — COMMUNITY (Publish -> Feed -> Study -> Like -> Comment -> Save -> Reshare)
  // ========================================================================
  console.log('\n========================================================================');
  console.log('--- FLOW C: COMMUNITY DISCOVERY & INTERACTION ---');
  console.log('========================================================================');

  // C.1 Publish Document to Community Feed
  const pubDocRes = await axios.post(
    `${API_BASE}/community/publish`,
    {
      resourceType: 'document',
      resourceId: docAId,
      title: 'Tài liệu CSDL Quan hệ & Chuẩn hóa (Bản Cộng đồng)',
      description: 'Chia sẻ miễn phí cho mọi sinh viên ôn tập thi cuối kỳ.',
      category: 'Công nghệ thông tin'
    },
    { headers: userA.headers }
  );
  assert(pubDocRes.status === 201, 'C.1 User A publishes document to Community Feed (HTTP 201)');
  const communityResourceId = pubDocRes.data.resource.id;

  // C.2 User B Discovers in Feed
  const feedRes = await axios.get(`${API_BASE}/community/feed`, { headers: userB.headers });
  assert(feedRes.status === 200, 'C.2 User B browses Community Feed (HTTP 200)');
  const foundInFeed = feedRes.data.resources.find((r: any) => r.id === communityResourceId);
  assert(Boolean(foundInFeed), 'C.2 Published resource appears in Community Feed');

  // C.3 User B Studies Resource Detail
  const detailRes = await axios.get(`${API_BASE}/community/resources/${communityResourceId}`, { headers: userB.headers });
  assert(detailRes.status === 200 && detailRes.data.resource.id === communityResourceId, 'C.3 User B opens resource detail');

  // C.4 User B Likes Resource
  const likeRes = await axios.post(`${API_BASE}/community/resources/${communityResourceId}/like`, {}, { headers: userB.headers });
  assert(likeRes.status === 200 && likeRes.data.liked === true, 'C.4 User B likes community resource');

  // C.5 User B Comments on Resource
  const commentRes = await axios.post(
    `${API_BASE}/community/resources/${communityResourceId}/comments`,
    { content: 'Tài liệu chuẩn hóa CSDL này giải thích rất rõ ràng, cảm ơn tác giả!' },
    { headers: userB.headers }
  );
  assert(commentRes.status === 201 && commentRes.data.comment.id > 0, 'C.5 User B adds comment on resource (HTTP 201)');

  // C.6 User B Saves Resource to Personal Collection
  const saveRes = await axios.post(`${API_BASE}/community/resources/${communityResourceId}/save`, {}, { headers: userB.headers });
  assert(saveRes.status === 200 && saveRes.data.saved === true, 'C.6 User B saves resource to personal collection');

  // C.7 User B Reshares Resource with Attribution
  const reshareRes = await axios.post(
    `${API_BASE}/community/resources/${communityResourceId}/reshare`,
    { reshareNote: 'Gợi ý tài liệu cực hay cho các bạn lớp IT01' },
    { headers: userB.headers }
  );
  assert(reshareRes.status === 201, 'C.7 User B reshares resource');
  assert(reshareRes.data.resource.original_author_id === userA.id, 'C.7 Reshare strictly preserves original author attribution (User A)');


  // ========================================================================
  // FLOW D — CHAT (From Comment Context -> DM -> Conversation -> Unread -> Reply)
  // ========================================================================
  console.log('\n========================================================================');
  console.log('--- FLOW D: DIRECT CHAT FROM COMMUNITY CONTEXT ---');
  console.log('========================================================================');

  // D.1 User B starts direct conversation with User A (the resource author)
  const startConvRes = await axios.post(
    `${API_BASE}/messages/conversations`,
    {
      recipient_id: userA.id
    },
    { headers: userB.headers }
  );
  assert(startConvRes.status === 201, 'D.1 User B starts direct conversation with author User A (HTTP 201)');
  const conversationId = startConvRes.data.conversation.id;

  // Send first message from User B
  const sendFirstRes = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    {
      content: 'Chào bạn, mình thấy bài viết CSDL của bạn rất hay! Bạn có tài liệu về Index B-Tree không?'
    },
    { headers: userB.headers }
  );
  assert(sendFirstRes.status === 201, 'D.1 User B sends first message in conversation (HTTP 201)');

  // D.2 User A checks Unread Message Badge
  const unreadRes = await axios.get(`${API_BASE}/messages/unread-count`, { headers: userA.headers });
  assert(unreadRes.status === 200 && Number(unreadRes.data.total_unread ?? unreadRes.data.unreadCount) >= 1, 'D.2 User A unread message badge count incremented');

  // D.3 User A reads conversation & marks as read
  const messagesRes = await axios.get(`${API_BASE}/messages/conversations/${conversationId}/messages`, { headers: userA.headers });
  assert(messagesRes.status === 200 && messagesRes.data.messages.length >= 1, 'D.3 User A fetches conversation message history');

  const markReadRes = await axios.post(`${API_BASE}/messages/conversations/${conversationId}/read`, {}, { headers: userA.headers });
  assert(markReadRes.status === 200, 'D.3 User A marks conversation as read');

  // D.4 User A replies to User B
  const replyRes = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { content: 'Chào bạn! Mình có phần B-Tree ở chương tiếp theo, chiều nay mình sẽ đăng lên nhé!' },
    { headers: userA.headers }
  );
  assert(replyRes.status === 201, 'D.4 User A replies to User B in the same conversation');

  // D.5 Verify Chronological Message Sequence
  const finalMessages = await axios.get(`${API_BASE}/messages/conversations/${conversationId}/messages`, { headers: userB.headers });
  assert(finalMessages.data.messages.length === 2, 'D.5 Chronological conversation history contains both messages in sequence');


  // ========================================================================
  // FLOW E — PREMIUM (Free Limit -> Checkout -> Webhook -> Pro Entitlements & Branches)
  // ========================================================================
  console.log('\n========================================================================');
  console.log('--- FLOW E: PREMIUM SUBSCRIPTION LIFECYCLE & BRANCHES ---');
  console.log('========================================================================');

  const userC = await createTestUser('user', 'Student Premium Flow');

  // E.1 Free User Quota Verification
  const freeEntitlements = await axios.get(`${API_BASE}/payment/entitlements`, { headers: userC.headers });
  const freeData = freeEntitlements.data.data;
  assert(freeEntitlements.status === 200 && freeData.plan === 'FREE', 'E.1 Initial user state is strictly FREE');
  assert(freeData.is_premium === false, 'E.1 Free user has is_premium = false');
  assert(freeData.usage.ai_chat.limit === 20, 'E.1 Free user has daily AI chat limit capped at 20');

  // E.2 Upgrade Checkout Request
  const checkoutRes = await axios.post(
    `${API_BASE}/payment/checkout`,
    { planCode: 'PRO_MONTHLY' },
    { headers: userC.headers }
  );
  assert(checkoutRes.status === 200 && Boolean(checkoutRes.data.data?.orderCode), 'E.2 Upgrade checkout order created');
  const orderCode = Number(checkoutRes.data.data.orderCode);

  // E.3 Branch Test: Payment Failed Webhook
  const failedWebhookData = {
    orderCode,
    amount: 99000,
    description: 'Thanh toan PRO_MONTHLY',
    accountNumber: 'SANDBOX_ACCOUNT',
    reference: `REF_FAIL_${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: `LINK_${orderCode}`,
    code: '01', // Failed code
    desc: 'Transaction declined by bank',
  };
  const failSig = subscriptionService.generateSignature(failedWebhookData);
  await axios.post(`${API_BASE}/payment/webhook`, { data: failedWebhookData, signature: failSig });
  
  const userCAfterFail = await db.query('SELECT is_premium FROM users WHERE id = $1', [userC.id]);
  assert(userCAfterFail.rows[0].is_premium === false, 'E.3 Payment Failed branch: User remains FREE with is_premium = false');

  // E.4 Happy Path: Payment Success Webhook with HMAC-SHA256 signature
  const successWebhookData = {
    ...failedWebhookData,
    code: '00', // Success code
    desc: 'success',
  };
  const successSig = subscriptionService.generateSignature(successWebhookData);
  const webhookSuccessRes = await axios.post(`${API_BASE}/payment/webhook`, { data: successWebhookData, signature: successSig });
  assert(webhookSuccessRes.status === 200, 'E.4 Payment Success Webhook executed with verified HMAC signature');

  // Verify Pro Entitlement Activation
  const proEntitlements = await axios.get(`${API_BASE}/payment/entitlements`, { headers: userC.headers });
  const proData = proEntitlements.data.data;
  assert(proData.plan === 'PRO', 'E.4 User upgraded to PRO plan');
  assert(proData.is_premium === true, 'E.4 User is_premium activated to true');
  assert(proData.usage.ai_chat.unlimited === true, 'E.4 Pro User unlocked unlimited AI Chat privileges');
  assert(proData.usage.ai_questions.unlimited === true, 'E.4 Pro User unlocked unlimited AI Question Generation privileges');

  // E.5 Branch Test: Renewal Failure & Grace Period Transition
  const subCRes = await db.query('SELECT id FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userC.id]);
  const subCId = subCRes.rows[0].id;

  // Simulate Past Due with 3-day grace
  await axios.post(
    `${API_BASE}/payment/subscription/simulate-past-due`,
    { subscriptionId: subCId, gracePeriodDays: 3 },
    { headers: userC.headers }
  );
  const subCPastDue = await db.query('SELECT status, past_due_until FROM subscriptions WHERE id = $1', [subCId]);
  assert(subCPastDue.rows[0].status === 'PAST_DUE', 'E.5 Renewal failure moves subscription to PAST_DUE');
  
  const userCInGrace = await db.query('SELECT is_premium FROM users WHERE id = $1', [userC.id]);
  assert(userCInGrace.rows[0].is_premium === true, 'E.5 Grace Period: User retains Pro privileges while in 3-day grace period');

  // Simulate Grace Period Expiration
  await db.query(
    `UPDATE subscriptions 
     SET past_due_until = CURRENT_TIMESTAMP - INTERVAL '1 day', end_date = CURRENT_TIMESTAMP - INTERVAL '2 days' 
     WHERE id = $1`,
    [subCId]
  );
  await axios.post(`${API_BASE}/payment/subscription/sync-expiry`, { userId: userC.id }, { headers: userC.headers });
  
  const subCExpired = await db.query('SELECT status FROM subscriptions WHERE id = $1', [subCId]);
  assert(subCExpired.rows[0].status === 'EXPIRED', 'E.5 Grace period ended: Subscription transitioned to EXPIRED');
  const userCRevoked = await db.query('SELECT is_premium FROM users WHERE id = $1', [userC.id]);
  assert(userCRevoked.rows[0].is_premium === false, 'E.5 Grace period ended: User is_premium revoked to false (downgraded to FREE)');

  // E.6 Branch Test: Cancellation with Privileges Preserved Until End of Period
  // Reactivate user to test cancellation
  await db.query(
    `UPDATE subscriptions 
     SET status = 'ACTIVE', end_date = CURRENT_TIMESTAMP + INTERVAL '20 days', auto_renew = true 
     WHERE id = $1`,
    [subCId]
  );
  await db.query("UPDATE users SET is_premium = true WHERE id = $1", [userC.id]);

  const cancelRes = await axios.post(`${API_BASE}/payment/subscription/cancel`, {}, { headers: userC.headers });
  assert(cancelRes.status === 200, 'E.6 User cancel auto-renew returns HTTP 200');
  
  const subCCancelled = await db.query('SELECT auto_renew, cancelled_at FROM subscriptions WHERE id = $1', [subCId]);
  assert(subCCancelled.rows[0].auto_renew === false && Boolean(subCCancelled.rows[0].cancelled_at), 'E.6 Auto renew disabled upon cancellation');
  const userCAfterCancel = await db.query('SELECT is_premium FROM users WHERE id = $1', [userC.id]);
  assert(userCAfterCancel.rows[0].is_premium === true, 'E.6 Privileges preserved until the current paid period ends');


  // ========================================================================
  // FLOW F — ADMIN MODERATION & CASCADING SECURITY
  // ========================================================================
  console.log('\n========================================================================');
  console.log('--- FLOW F: ADMIN MODERATION & CASCADING SECURITY ---');
  console.log('========================================================================');

  // F.1 User Bad publishes spam document to Community
  const badDoc = await db.query(
    `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
     VALUES ($1, 'Spam Malware Phishing Document', 'Spam description', 'Chung', 'public', true, 'READY')
     RETURNING id`,
    [userBad.id]
  );
  const badDocId = badDoc.rows[0].id;

  const badPubRes = await axios.post(
    `${API_BASE}/community/publish`,
    { resourceType: 'document', resourceId: badDocId, title: 'Spam Post on Community' },
    { headers: userBad.headers }
  );
  const badResourceId = badPubRes.data.resource.id;

  await axios.post(
    `${API_BASE}/community/resources/${communityResourceId}/comments`,
    { content: 'Spam comment with malicious links!' },
    { headers: userBad.headers }
  );

  // F.2 User B Reports the Bad Resource
  const reportRes = await axios.post(
    `${API_BASE}/community/reports`,
    { targetType: 'resource', targetId: badResourceId, reason: 'SPAM' },
    { headers: userB.headers }
  );
  assert(reportRes.status === 201, 'F.2 User B reports inappropriate resource (HTTP 201)');
  const reportId = reportRes.data.report.id;

  // F.3 Admin Reviews Pending Reports Queue
  const adminReportsRes = await axios.get(`${API_BASE}/admin/moderation/reports?status=PENDING`, { headers: admin.headers });
  assert(adminReportsRes.status === 200, 'F.3 Admin views moderation reports queue');
  const foundReport = adminReportsRes.data.reports.find((r: any) => r.id === reportId);
  assert(Boolean(foundReport), 'F.3 Submitted report is present in admin moderation queue');

  // F.4 Admin Action HIDE: Soft-hides the resource
  const hideRes = await axios.post(
    `${API_BASE}/admin/moderation/reports/${reportId}/action`,
    { action: 'HIDE', reason: 'Phát hiện nội dung spam nguy hại' },
    { headers: admin.headers }
  );
  assert(hideRes.status === 200, 'F.4 Admin applies HIDE action on resource report');
  
  const checkHidden = await db.query('SELECT is_hidden FROM community_resources WHERE id = $1', [badResourceId]);
  assert(checkHidden.rows[0].is_hidden === true, 'F.4 Community resource is_hidden set to true in database');

  // Verify resource is hidden from Community Feed
  const publicFeedCheck = await axios.get(`${API_BASE}/community/feed`, { headers: userB.headers });
  const hiddenPostInFeed = publicFeedCheck.data.resources.find((r: any) => r.id === badResourceId);
  assert(!hiddenPostInFeed, 'F.4 Hidden resource is completely removed from public community feed');

  // F.5 Admin Action WARN: Issues formal warning to User Bad
  const userReportRes = await axios.post(
    `${API_BASE}/community/reports`,
    { targetType: 'user', targetId: userBad.id, reason: 'SPAM' },
    { headers: userB.headers }
  );
  const userReportId = userReportRes.data.report.id;

  const warnRes = await axios.post(
    `${API_BASE}/admin/moderation/reports/${userReportId}/action`,
    { action: 'WARN', reason: 'Cảnh cáo về hành vi spam nội dung' },
    { headers: admin.headers }
  );
  assert(warnRes.status === 200, 'F.5 Admin applies WARN action on user report');
  const userBadWarned = await db.query('SELECT status, warning_count FROM users WHERE id = $1', [userBad.id]);
  assert(userBadWarned.rows[0].status === 'WARNED' && userBadWarned.rows[0].warning_count === 1, 'F.5 User Bad status updated to WARNED and warning_count = 1');

  // F.6 Admin Action SUSPEND User & Cascading Content Removal
  const suspendRes = await axios.post(
    `${API_BASE}/admin/moderation/users/${userBad.id}/suspend`,
    { reason: 'Khóa tài khoản vĩnh viễn do spam hệ thống' },
    { headers: admin.headers }
  );
  assert(suspendRes.status === 200, 'F.6 Admin directly suspends User Bad (HTTP 200)');

  // Verify User Bad is marked SUSPENDED
  const userBadSuspended = await db.query('SELECT is_suspended, status FROM users WHERE id = $1', [userBad.id]);
  assert(userBadSuspended.rows[0].is_suspended === true && userBadSuspended.rows[0].status === 'SUSPENDED', 'F.6 User Bad is_suspended=true and status=SUSPENDED');

  // Verify Cascading Bulk Removal of all resources, comments, and document unpublishing
  const badUserResources = await db.query('SELECT is_hidden FROM community_resources WHERE user_id = $1', [userBad.id]);
  assert(badUserResources.rows.every((r: any) => r.is_hidden === true), 'F.6 Cascading Check: All community resources of suspended user marked is_hidden=true');

  const badUserComments = await db.query('SELECT is_hidden FROM community_comments WHERE user_id = $1', [userBad.id]);
  assert(badUserComments.rows.every((c: any) => c.is_hidden === true), 'F.6 Cascading Check: All comments of suspended user marked is_hidden=true');

  const badUserDocs = await db.query('SELECT is_community_published FROM documents WHERE user_id = $1', [userBad.id]);
  assert(badUserDocs.rows.every((d: any) => d.is_community_published === false), 'F.6 Cascading Check: All documents unlisted from community');

  // F.7 Suspended User Authentication Lockout (HTTP 403 Forbidden)
  try {
    await axios.get(`${API_BASE}/documents`, { headers: userBad.headers });
    assert(false, 'Suspended user request should have been rejected');
  } catch (err: any) {
    assert(err.response?.status === 403, 'F.7 Suspended user is strictly locked out with HTTP 403 Forbidden');
  }

  // ========================================================================
  // CLEANUP TEST DATA
  // ========================================================================
  console.log('\n[Cleanup] Cleaning up Phase 30 test records...');
  await db.query('DELETE FROM users WHERE id IN ($1, $2, $3, $4)', [userA.id, userB.id, userBad.id, userC.id]);
  console.log('  ✓ Phase 30 test users and cascaded records safely cleaned up.');

  console.log('\n========================================================================');
  console.log('  🎉 PHASE 30 COMPLETED: ALL 6 BUSINESS FLOWS PASSED 100%               ');
  console.log('========================================================================\n');
}

runPhase30Tests()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ PHASE 30 TESTS FAILED:', err);
    process.exit(1);
  });
