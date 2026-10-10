import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase15Tests() {
  console.log('\n========================================================');
  console.log('   COGNITO PHASE 15: USER-TO-USER CHAT & MESSAGING      ');
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

  // Cleanup old test users and data
  await db.query(`DELETE FROM users WHERE name LIKE 'P15 %' OR email LIKE '%@p15.cognito.test'`);

  async function registerUser(email: string, name: string) {
    const phone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const uniqueName = `${name} ${Math.floor(Math.random() * 100000)}`;
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: uniqueName,
      email,
      password: 'Password123!',
      phone,
    });
    const userId = res.data.user.id;
    const token = res.data.token;
    return {
      id: userId,
      name: uniqueName,
      email,
      token,
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  const timestamp = Date.now();
  const userA = await registerUser(`p15_user_a_${timestamp}@p15.cognito.test`, 'P15 User A');
  const userB = await registerUser(`p15_user_b_${timestamp}@p15.cognito.test`, 'P15 User B');
  const userC = await registerUser(`p15_user_c_${timestamp}@p15.cognito.test`, 'P15 User C');

  console.log(`[SETUP] Registered test users: A(id=${userA.id}), B(id=${userB.id}), C(id=${userC.id})`);

  let conversationId: number = 0;
  let message1Id: number = 0;
  let message2Id: number = 0;

  // ──────────────────────────────────────────────────────────
  // SUITE 1: 1-on-1 Conversation Creation & Idempotency
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 1: Conversation Creation & Idempotency ---');

  // 1.1 Cannot message self
  try {
    await axios.post(
      `${API_BASE}/messages/conversations`,
      { recipient_id: userA.id },
      { headers: userA.headers }
    );
    assert(false, '1.1 Should not allow user to message themselves');
  } catch (err: any) {
    assert(
      err.response?.status === 400,
      '1.1 Prevent self-messaging returns HTTP 400'
    );
  }

  // 1.2 User A starts conversation with User B
  const convRes = await axios.post(
    `${API_BASE}/messages/conversations`,
    { recipient_id: userB.id },
    { headers: userA.headers }
  );
  assert(convRes.status === 201, '1.2 Start conversation returns HTTP 201');
  assert(!!convRes.data.conversation?.id, '1.2 Conversation ID is generated');
  assert(
    convRes.data.conversation.other_user?.id === userB.id,
    '1.2 Conversation includes other_user details matching User B'
  );
  conversationId = convRes.data.conversation.id;

  // 1.3 Idempotency: User A starts conversation with User B again -> returns same ID
  const dupConvRes = await axios.post(
    `${API_BASE}/messages/conversations`,
    { recipient_id: userB.id },
    { headers: userA.headers }
  );
  assert(
    dupConvRes.data.conversation?.id === conversationId,
    '1.3 Starting existing 1-on-1 conversation returns the same conversation ID (idempotent)'
  );

  // 1.4 User B sees conversation in their list
  const userBConvsRes = await axios.get(`${API_BASE}/messages/conversations`, {
    headers: userB.headers,
  });
  assert(userBConvsRes.status === 200, '1.4 User B fetches conversations list');
  const foundConvForB = userBConvsRes.data.conversations.find((c: any) => c.id === conversationId);
  assert(!!foundConvForB, '1.4 Conversation appears in User B conversation list');
  assert(foundConvForB.other_user?.id === userA.id, '1.4 User B sees other_user as User A');
  assert(foundConvForB.unread_count === 0, '1.4 Initial unread_count is 0');

  // ──────────────────────────────────────────────────────────
  // SUITE 2: Message Sending, Unread Counts & Chronological Retrieval
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: Message Sending, Unread Counts & Timeline ---');

  // 2.1 User A sends message to conversation
  const sendRes1 = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { content: 'Xin chào User B, mình là User A!' },
    { headers: userA.headers }
  );
  assert(sendRes1.status === 201, '2.1 Send message returns HTTP 201');
  assert(sendRes1.data.message?.content === 'Xin chào User B, mình là User A!', '2.1 Message content matches');
  assert(sendRes1.data.message?.sender_id === userA.id, '2.1 Message sender_id matches User A');
  message1Id = sendRes1.data.message.id;

  // 2.2 User B unread count increased to 1
  const unreadB1 = await axios.get(`${API_BASE}/messages/unread-count`, { headers: userB.headers });
  assert(unreadB1.data.total_unread === 1, '2.2 User B global unread count incremented to 1');

  // 2.3 User A unread count remains 0
  const unreadA1 = await axios.get(`${API_BASE}/messages/unread-count`, { headers: userA.headers });
  assert(unreadA1.data.total_unread === 0, '2.3 Sender User A unread count remains 0');

  // 2.4 User B sends reply
  const sendRes2 = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { content: 'Chào bạn A, rất vui được kết nối!' },
    { headers: userB.headers }
  );
  assert(sendRes2.status === 201, '2.4 User B sends reply message successfully');
  message2Id = sendRes2.data.message.id;

  // 2.5 User A unread count is now 1
  const unreadA2 = await axios.get(`${API_BASE}/messages/unread-count`, { headers: userA.headers });
  assert(unreadA2.data.total_unread === 1, '2.5 User A global unread count is now 1');

  // 2.6 Fetch messages in conversation
  const messagesRes = await axios.get(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { headers: userA.headers }
  );
  assert(messagesRes.status === 200, '2.6 Fetch conversation messages returns HTTP 200');
  assert(messagesRes.data.messages.length === 2, '2.6 Retrieved exactly 2 messages');
  assert(
    messagesRes.data.messages[0].id === message1Id && messagesRes.data.messages[1].id === message2Id,
    '2.6 Messages are returned in chronological order (oldest first)'
  );

  // ──────────────────────────────────────────────────────────
  // SUITE 3: Read Receipts & Mark as Read
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: Read Receipts & Mark as Read ---');

  // 3.1 User A marks conversation as read
  const readRes = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/read`,
    {},
    { headers: userA.headers }
  );
  assert(readRes.status === 200, '3.1 Mark conversation as read returns HTTP 200');
  assert(readRes.data.success === true, '3.1 Read operation succeeded');

  // 3.2 User A unread count resets to 0
  const unreadA3 = await axios.get(`${API_BASE}/messages/unread-count`, { headers: userA.headers });
  assert(unreadA3.data.total_unread === 0, '3.2 User A total unread count reset to 0');

  // 3.3 Database verification of message_reads table
  const dbReadCheck = await db.query(
    `SELECT * FROM message_reads WHERE message_id = $1 AND user_id = $2`,
    [message2Id, userA.id]
  );
  assert(dbReadCheck.rows.length === 1, '3.3 Read receipt successfully saved to message_reads');

  // ──────────────────────────────────────────────────────────
  // SUITE 4: IDOR & Security Protection
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: IDOR & Security Access Protection ---');

  // 4.1 Non-member User C cannot view conversation details
  try {
    await axios.get(`${API_BASE}/messages/conversations/${conversationId}`, {
      headers: userC.headers,
    });
    assert(false, '4.1 Non-member should not view conversation details');
  } catch (err: any) {
    assert(err.response?.status === 403, '4.1 Non-member accessing conversation receives 403 Forbidden');
  }

  // 4.2 Non-member User C cannot view conversation messages
  try {
    await axios.get(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
      headers: userC.headers,
    });
    assert(false, '4.2 Non-member should not view conversation messages');
  } catch (err: any) {
    assert(err.response?.status === 403, '4.2 Non-member reading messages receives 403 Forbidden');
  }

  // 4.3 Non-member User C cannot post message into conversation
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: 'Hacker injecting message' },
      { headers: userC.headers }
    );
    assert(false, '4.3 Non-member should not post message to conversation');
  } catch (err: any) {
    assert(err.response?.status === 403, '4.3 Non-member sending message receives 403 Forbidden');
  }

  // 4.4 Non-member User C cannot mark conversation as read
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/read`,
      {},
      { headers: userC.headers }
    );
    assert(false, '4.4 Non-member should not mark conversation as read');
  } catch (err: any) {
    assert(err.response?.status === 403, '4.4 Non-member marking read receives 403 Forbidden');
  }

  // 4.5 User Isolation: GET /conversations strictly returns conversations where caller is a member
  // First, create a separate conversation between User B and User C
  const convBCRes = await axios.post(
    `${API_BASE}/messages/conversations`,
    { recipient_id: userC.id },
    { headers: userB.headers }
  );
  const convBCId = convBCRes.data.conversation?.id;
  assert(!!convBCId, '4.5 Setup: Conversation between B and C created');

  // Verify User A only sees conversation AB, never conversation BC
  const userAConvs = await axios.get(`${API_BASE}/messages/conversations`, {
    headers: userA.headers,
  });
  const userAConvIds = userAConvs.data.conversations.map((c: any) => c.id);
  assert(
    userAConvIds.includes(conversationId),
    '4.5 User A conversation list includes conversation AB'
  );
  assert(
    !userAConvIds.includes(convBCId),
    '4.5 User A conversation list STRICTLY EXCLUDES conversation BC (Zero cross-user leakage)'
  );

  // Verify User C only sees conversation BC, never conversation AB
  const userCConvs = await axios.get(`${API_BASE}/messages/conversations`, {
    headers: userC.headers,
  });
  const userCConvIds = userCConvs.data.conversations.map((c: any) => c.id);
  assert(
    userCConvIds.includes(convBCId),
    '4.5 User C conversation list includes conversation BC'
  );
  assert(
    !userCConvIds.includes(conversationId),
    '4.5 User C conversation list STRICTLY EXCLUDES conversation AB'
  );

  // ──────────────────────────────────────────────────────────
  // SUITE 5: Bi-directional Block Integration
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: Bi-directional Block Integration ---');

  // 5.1 User A blocks User B
  const blockRes = await axios.post(
    `${API_BASE}/community/blocks/${userB.id}`,
    { reason: 'Spamming direct messages' },
    { headers: userA.headers }
  );
  assert(blockRes.status === 200, '5.1 User A blocks User B successfully');

  // 5.2 User A attempts to send message to User B -> 403 Forbidden
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: 'Tin nhắn sau khi chặn' },
      { headers: userA.headers }
    );
    assert(false, '5.2 Blocker should not be able to send messages');
  } catch (err: any) {
    assert(err.response?.status === 403, '5.2 Blocker sending message rejected with 403 Forbidden');
  }

  // 5.3 Blocked User B attempts to send message to User A -> 403 Forbidden
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: 'Bị chặn cố tình gửi tin nhắn' },
      { headers: userB.headers }
    );
    assert(false, '5.3 Blocked party should not be able to send messages');
  } catch (err: any) {
    assert(err.response?.status === 403, '5.3 Blocked user sending message rejected with 403 Forbidden');
  }

  // 5.4 Blocked User B attempts to initiate conversation with User A -> 403 Forbidden
  try {
    await axios.post(
      `${API_BASE}/messages/conversations`,
      { recipient_id: userA.id },
      { headers: userB.headers }
    );
    assert(false, '5.4 Starting conversation with blocker should fail');
  } catch (err: any) {
    if (err.response?.status !== 403) {
      console.error('DEBUG 5.4 FAILED:', err.response?.status, err.response?.data, err.message);
    }
    assert(err.response?.status === 403, '5.4 Starting conversation with blocker rejected with 403 Forbidden');
  }

  // 5.5 User A unblocks User B
  const unblockRes = await axios.delete(`${API_BASE}/community/blocks/${userB.id}`, {
    headers: userA.headers,
  });
  assert(unblockRes.status === 200, '5.5 User A unblocks User B');

  // 5.6 Communication restored: User A can send message again
  const sendResAfterUnblock = await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { content: 'Đã bỏ chặn, trao đổi lại bình thường nhé!' },
    { headers: userA.headers }
  );
  assert(sendResAfterUnblock.status === 201, '5.6 Messaging restored after unblock returns 201 Created');

  // ──────────────────────────────────────────────────────────
  // SUITE 6: Content Reporting for Chat Messages
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: Content Reporting for Chat Messages ---');

  // 6.1 User B reports User A's message
  const reportRes = await axios.post(
    `${API_BASE}/community/reports`,
    {
      targetType: 'message',
      targetId: message1Id,
      reason: 'HARASSMENT',
      details: 'Tin nhắn mang tính chất quấy rối',
    },
    { headers: userB.headers }
  );
  assert(reportRes.status === 201, '6.1 Report message returns HTTP 201');
  assert(reportRes.data.report?.status === 'PENDING', '6.1 Created report has status PENDING');

  // 6.2 Cannot self-report own message
  try {
    await axios.post(
      `${API_BASE}/community/reports`,
      {
        targetType: 'message',
        targetId: message1Id,
        reason: 'HARASSMENT',
        details: 'Tự tố cáo tin nhắn của mình',
      },
      { headers: userA.headers }
    );
    assert(false, '6.2 User should not self-report own message');
  } catch (err: any) {
    assert(err.response?.status === 400, '6.2 Self-reporting message rejected with 400');
  }

  // 6.3 Cannot report same message twice while pending
  try {
    await axios.post(
      `${API_BASE}/community/reports`,
      {
        targetType: 'message',
        targetId: message1Id,
        reason: 'SPAM',
        details: 'Báo cáo trùng lặp lần thứ hai',
      },
      { headers: userB.headers }
    );
    assert(false, '6.3 Duplicate pending report should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 400, '6.3 Duplicate pending report rejected with 400');
  }

  // 6.4 IDOR Protection: Non-member User C cannot report message from conversation AB
  try {
    await axios.post(
      `${API_BASE}/community/reports`,
      {
        targetType: 'message',
        targetId: message1Id,
        reason: 'HARASSMENT',
        details: 'User C tries to report message from conversation they are not in',
      },
      { headers: userC.headers }
    );
    assert(false, '6.4 Non-member User C should not be able to report message in AB conversation');
  } catch (err: any) {
    assert(
      err.response?.status === 403,
      '6.4 IDOR protection: Non-member reporting message rejected with 403 Forbidden'
    );
  }

  // ──────────────────────────────────────────────────────────
  // SUITE 7: Anti-Spam & Input Validation
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: Anti-Spam & Input Validation ---');

  // 7.1 Empty message rejected
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: '   ' },
      { headers: userA.headers }
    );
    assert(false, '7.1 Empty message content should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 400, '7.1 Empty message rejected with 400');
  }

  // 7.2 Overly long message (> 2000 chars) rejected
  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: 'A'.repeat(2005) },
      { headers: userA.headers }
    );
    assert(false, '7.2 Message > 2000 chars should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 400, '7.2 Message > 2000 chars rejected with 400');
  }

  // 7.3 Rapid identical duplicate spam rejected
  await axios.post(
    `${API_BASE}/messages/conversations/${conversationId}/messages`,
    { content: 'Spam message test 123' },
    { headers: userA.headers }
  );

  try {
    await axios.post(
      `${API_BASE}/messages/conversations/${conversationId}/messages`,
      { content: 'Spam message test 123' },
      { headers: userA.headers }
    );
    assert(false, '7.3 Immediate duplicate message should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 400, '7.3 Immediate duplicate message rejected with 400 anti-spam');
  }

  // ──────────────────────────────────────────────────────────
  // SUITE 8: Unified SSE Authentication & Capability Stream Ticket
  // (Multiplexed stream for both messages and notifications)
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 8: Unified SSE Authentication & Capability Stream Ticket ---');

  // 8.1 Passing full JWT in URL query string is strictly banned (mirroring Phase 11 lesson)
  try {
    await axios.get(`${API_BASE}/notifications/stream?token=${userA.token}`);
    assert(false, '8.1 Passing JWT in query string should be strictly rejected');
  } catch (err: any) {
    assert(
      err.response?.status === 400,
      '8.1 Passing JWT in query string is rejected with HTTP 400 Bad Request'
    );
    assert(
      err.response?.data?.error?.includes('bảo mật') || err.response?.data?.error?.includes('query string bị cấm'),
      '8.1 Error message explicitly cites query string JWT security prohibition'
    );
  }

  // 8.2 Obtain short-lived capability stream ticket via authenticated POST
  const ticketRes = await axios.post(
    `${API_BASE}/notifications/stream-ticket`,
    {},
    { headers: userA.headers }
  );
  assert(ticketRes.status === 200, '8.2 Capability ticket request returns 200 OK');
  assert(!!ticketRes.data?.ticket, '8.2 Stream ticket is returned');
  assert(
    ticketRes.data.ticket.startsWith('sse_notif_'),
    '8.2 Ticket format matches sse_notif_<hex>'
  );
  const streamTicket = ticketRes.data.ticket;

  // 8.3 Connect to unified SSE stream using capability ticket
  const sseRes = await axios.get(`${API_BASE}/notifications/stream?ticket=${streamTicket}`, {
    responseType: 'stream',
    timeout: 3000,
  });
  assert(sseRes.status === 200, '8.3 SSE connection established with capability ticket (HTTP 200)');
  assert(
    String(sseRes.headers['content-type']).includes('text/event-stream'),
    '8.3 SSE response has text/event-stream Content-Type'
  );
  // Close connection
  sseRes.data.destroy();

  // 8.4 Single-use ticket invalidation: Reusing the same ticket must be rejected
  try {
    await axios.get(`${API_BASE}/notifications/stream?ticket=${streamTicket}`);
    assert(false, '8.4 Reusing consumed capability ticket should be rejected');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      '8.4 Consumed capability ticket immediately rejected with HTTP 401 Unauthorized'
    );
  }

  // 8.5 Fake or forged ticket must be rejected
  try {
    await axios.get(`${API_BASE}/notifications/stream?ticket=sse_notif_invalid_1234567890`);
    assert(false, '8.5 Fake capability ticket should be rejected');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      '8.5 Forged/invalid ticket rejected with HTTP 401 Unauthorized'
    );
  }

  console.log(`\n========================================================`);
  console.log(`   ALL PHASE 15 TESTS PASSED: ${passedTests}/${totalTests} assertions`);
  console.log(`========================================================\n`);

  // Cleanup test users
  await db.query(`DELETE FROM users WHERE name LIKE 'P15 %' OR email LIKE '%@p15.cognito.test'`);
}

if (require.main === module) {
  runPhase15Tests()
    .then(() => {
      console.log('Phase 15 test script executed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Phase 15 tests failed:', err);
      process.exit(1);
    });
}
