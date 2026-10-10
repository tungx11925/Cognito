import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase16Tests() {
  console.log('\n========================================================');
  console.log('       COGNITO PHASE 16: NOTIFICATION SYSTEM            ');
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
  await db.query(`DELETE FROM notifications WHERE title LIKE '%P16%' OR content LIKE '%P16%'`);
  await db.query(`DELETE FROM users WHERE name LIKE 'P16 %' OR email LIKE '%@p16.cognito.test'`);

  async function registerUser(email: string, name: string, role: string = 'student') {
    const phone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const uniqueName = `${name} ${Math.floor(Math.random() * 100000)}`;
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: uniqueName,
      email,
      password: 'Password123!',
      phone,
    });
    const userId = res.data.user.id;
    let token = res.data.token;
    if (role !== 'student') {
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
  const userA = await registerUser(`p16_user_a_${timestamp}@p16.cognito.test`, 'P16 User A');
  const userB = await registerUser(`p16_user_b_${timestamp}@p16.cognito.test`, 'P16 User B');
  const userC = await registerUser(`p16_user_c_${timestamp}@p16.cognito.test`, 'P16 User C');
  const admin = await registerUser(`p16_admin_${timestamp}@p16.cognito.test`, 'P16 Admin', 'admin');

  console.log(`[SETUP] Registered test users: User A (${userA.id}), User B (${userB.id}), User C (${userC.id}), Admin (${admin.id})`);

  // Create a shared resource by User A for testing community events
  const docARes = await db.query(
    `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
     VALUES ($1, 'P16 Advanced Physics Document', 'Desc', 'Physics', 'private', false, 'READY') RETURNING id`,
    [userA.id]
  );
  const docAId = docARes.rows[0].id;

  const resResource = await axios.post(
    `${API_BASE}/community/publish`,
    {
      resourceType: 'document',
      resourceId: docAId,
      title: 'P16 Test Resource on Advanced Physics',
      description: 'Study guide for Phase 16 automated testing.',
      category: 'Physics',
      tags: ['physics', 'science'],
    },
    { headers: userA.headers }
  );
  const resourceId = resResource.data.resource.id;
  assert(!!resourceId, 'Resource created by User A');

  // ──────────────────────────────────────────────────────────
  // SUITE 1: Community Actions Trigger Notifications
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 1: Community Actions Trigger Notifications ---');

  // 1.1 Like Notification: User B likes User A's resource -> User A gets notification
  const likeRes = await axios.post(
    `${API_BASE}/community/resources/${resourceId}/like`,
    {},
    { headers: userB.headers }
  );
  assert(likeRes.data.liked === true, '1.1 User B liked User A resource');

  // Fetch User A's notifications
  let notifsA = await axios.get(`${API_BASE}/notifications`, { headers: userA.headers });
  const likeNotif = notifsA.data.notifications.find((n: any) => n.type === 'like');
  assert(!!likeNotif, '1.1 User A received a "like" notification');
  assert(likeNotif.link?.includes(String(resourceId)), '1.1 Like notification contains resource link');

  // 1.2 Comment Notification: User B comments on User A's resource -> User A gets notification
  const commentRes = await axios.post(
    `${API_BASE}/community/resources/${resourceId}/comments`,
    { content: 'P16 Great physics resource! Highly recommend.' },
    { headers: userB.headers }
  );
  const commentId = commentRes.data.comment.id;
  assert(!!commentId, '1.2 User B commented on User A resource');

  notifsA = await axios.get(`${API_BASE}/notifications`, { headers: userA.headers });
  const commentNotif = notifsA.data.notifications.find((n: any) => n.type === 'comment');
  assert(!!commentNotif, '1.2 User A received a "comment" notification');
  assert(commentNotif.content?.includes('P16 Great physics resource'), '1.2 Comment notification contains comment snippet');

  // 1.3 Comment Reply Notification: User A replies to User B's comment -> User B gets notification
  // Wait a small instant or reset cooldown for User A comment
  await db.query(`UPDATE community_comments SET created_at = NOW() - INTERVAL '5 seconds' WHERE user_id = $1`, [userA.id]);
  const replyRes = await axios.post(
    `${API_BASE}/community/resources/${resourceId}/comments`,
    {
      content: 'P16 Thanks User B! Glad you found it useful.',
      parentId: commentId,
    },
    { headers: userA.headers }
  );
  assert(!!replyRes.data.comment.id, '1.3 User A replied to User B comment');

  const notifsB = await axios.get(`${API_BASE}/notifications`, { headers: userB.headers });
  const replyNotif = notifsB.data.notifications.find((n: any) => n.type === 'comment_reply');
  assert(!!replyNotif, '1.3 User B received a "comment_reply" notification');

  // 1.4 Reshare Notification: User B reshares User A's resource -> User A gets notification
  await axios.post(
    `${API_BASE}/community/resources/${resourceId}/reshare`,
    {},
    { headers: userB.headers }
  );
  notifsA = await axios.get(`${API_BASE}/notifications`, { headers: userA.headers });
  const reshareNotif = notifsA.data.notifications.find((n: any) => n.type === 'reshare');
  assert(!!reshareNotif, '1.4 User A received a "reshare" notification');

  // ──────────────────────────────────────────────────────────
  // SUITE 2: Direct Messaging Notification
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: Direct Messaging Notification ---');

  // 2.1 User A starts a conversation with User B and sends a message
  const convRes = await axios.post(
    `${API_BASE}/messages/conversations`,
    { recipient_id: userB.id },
    { headers: userA.headers }
  );
  const convId = convRes.data.conversation.id;

  await axios.post(
    `${API_BASE}/messages/conversations/${convId}/messages`,
    { content: 'Hello User B, do you want to collaborate on P16?' },
    { headers: userA.headers }
  );

  const notifsBAfterMsg = await axios.get(`${API_BASE}/notifications`, { headers: userB.headers });
  const msgNotif = notifsBAfterMsg.data.notifications.find((n: any) => n.type === 'message');
  assert(!!msgNotif, '2.1 User B received a "message" notification');
  assert(msgNotif.link?.includes('/messages'), '2.1 Message notification links to /messages');

  // ──────────────────────────────────────────────────────────
  // SUITE 3: Moderation & Disciplinary Notifications
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: Moderation & Disciplinary Notifications ---');

  // 3.1 User B reports User A's resource
  const reportRes = await axios.post(
    `${API_BASE}/community/reports`,
    {
      targetType: 'resource',
      targetId: resourceId,
      reason: 'SPAM',
      details: 'P16 Test report for moderation notifications.',
    },
    { headers: userB.headers }
  );
  const reportId = reportRes.data.report.id;
  assert(!!reportId, '3.1 User B reported User A resource');

  // 3.2 Admin reviews report with REMOVE action
  await axios.post(
    `${API_BASE}/admin/moderation/reports/${reportId}/action`,
    {
      action: 'REMOVE',
      reason: 'Violated spam guidelines. Content removed.',
    },
    { headers: admin.headers }
  );

  // Check Reporter (User B) received report_resolved notification
  const notifsBAfterReport = await axios.get(`${API_BASE}/notifications`, { headers: userB.headers });
  const reportResolvedNotif = notifsBAfterReport.data.notifications.find((n: any) => n.type === 'report_resolved');
  assert(!!reportResolvedNotif, '3.2 Reporter (User B) received "report_resolved" notification');

  // Check Author (User A) received resource_removed notification
  const notifsAAfterReport = await axios.get(`${API_BASE}/notifications`, { headers: userA.headers });
  const resourceRemovedNotif = notifsAAfterReport.data.notifications.find((n: any) => n.type === 'resource_removed');
  assert(!!resourceRemovedNotif, '3.2 Author (User A) received "resource_removed" notification');

  // 3.3 Admin warns User A directly via report action
  const report2Res = await axios.post(
    `${API_BASE}/community/reports`,
    {
      targetType: 'user',
      targetId: userA.id,
      reason: 'HARASSMENT',
      details: 'P16 Warning test reporting harassment.',
    },
    { headers: userB.headers }
  );
  const report2Id = report2Res.data.report.id;

  await axios.post(
    `${API_BASE}/admin/moderation/reports/${report2Id}/action`,
    {
      action: 'WARN',
      reason: 'Official conduct warning issued.',
    },
    { headers: admin.headers }
  );

  const notifsAAfterWarn = await axios.get(`${API_BASE}/notifications`, { headers: userA.headers });
  const warnedNotif = notifsAAfterWarn.data.notifications.find((n: any) => n.type === 'account_warned');
  assert(!!warnedNotif, '3.3 Warned user (User A) received "account_warned" notification');

  // 3.4 Admin suspends User A directly
  await axios.post(
    `${API_BASE}/admin/moderation/users/${userA.id}/suspend`,
    { reason: 'P16 Suspension test for disciplinary notification' },
    { headers: admin.headers }
  );

  const suspendedDb = await db.query(
    'SELECT * FROM notifications WHERE user_id = $1 AND type = $2',
    [userA.id, 'account_suspended']
  );
  assert(suspendedDb.rows.length > 0, '3.4 Suspended user (User A) received "account_suspended" notification');

  // ──────────────────────────────────────────────────────────
  // SUITE 4: Notification Suppression Rules
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: Suppression Rules (Self, Block, Suspension) ---');

  // 4.1 Self-Action Suppression: User B creates resource and likes/comments on it
  const docBRes = await db.query(
    `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
     VALUES ($1, 'P16 User B Math', 'Desc', 'Math', 'private', false, 'READY') RETURNING id`,
    [userB.id]
  );
  const userBResourceRes = await axios.post(
    `${API_BASE}/community/publish`,
    {
      resourceType: 'document',
      resourceId: docBRes.rows[0].id,
      title: 'P16 User B Math Resource',
      description: 'Resource created by User B.',
      category: 'Math',
      tags: ['math'],
    },
    { headers: userB.headers }
  );
  const bResourceId = userBResourceRes.data.resource.id;

  const bNotifsBefore = (await axios.get(`${API_BASE}/notifications`, { headers: userB.headers })).data.total;
  // User B likes own resource
  await axios.post(`${API_BASE}/community/resources/${bResourceId}/like`, {}, { headers: userB.headers });
  // User B comments on own resource
  await axios.post(
    `${API_BASE}/community/resources/${bResourceId}/comments`,
    { content: 'My own comment' },
    { headers: userB.headers }
  );
  const bNotifsAfter = (await axios.get(`${API_BASE}/notifications`, { headers: userB.headers })).data.total;
  assert(bNotifsAfter === bNotifsBefore, '4.1 Self-actions (like/comment on own content) do NOT generate notifications');

  // 4.2 Block Suppression: User B blocks User C -> User C actions do not notify User B
  await axios.post(
    `${API_BASE}/community/blocks/${userC.id}`,
    { reason: 'Testing block notification suppression' },
    { headers: userB.headers }
  );

  const bTotalBeforeCAction = (await axios.get(`${API_BASE}/notifications`, { headers: userB.headers })).data.total;
  // User C likes User B's resource
  try {
    await axios.post(`${API_BASE}/community/resources/${bResourceId}/like`, {}, { headers: userC.headers });
  } catch (err) {}
  const bTotalAfterCAction = (await axios.get(`${API_BASE}/notifications`, { headers: userB.headers })).data.total;
  assert(bTotalAfterCAction === bTotalBeforeCAction, '4.2 Block suppression: Blocked user action produces no notification');

  // 4.3 Suspended Recipient Suppression: User A is suspended -> social actions produce no notification
  // User B likes User A's resource (even though suspended, if DB allowed, notification service suppresses social notifs)
  const notifService = (await import('../src/services/notification.service')).notificationService;
  const suppressedResult = await notifService.createNotification({
    userId: userA.id,
    actorId: userB.id,
    type: 'like',
    title: 'New Like',
    content: 'User B liked your post',
  });
  assert(suppressedResult === null, '4.3 Suspended user social notifications (like, comment, reshare) are suppressed');

  // 4.4 Suspended recipient CAN receive admin notifications
  const adminNotifResult = await notifService.createNotification({
    userId: userA.id,
    type: 'system',
    title: 'Important Account Update',
    content: 'Please contact support regarding your appeal.',
  });
  assert(adminNotifResult !== null, '4.4 Suspended user can still receive administrative/system notifications');

  // ──────────────────────────────────────────────────────────
  // SUITE 5: Strict IDOR Protection & Authorization
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: Strict IDOR Protection & Authorization ---');

  // Get a notification belonging to User B
  const userBNotifs = (await axios.get(`${API_BASE}/notifications`, { headers: userB.headers })).data.notifications;
  const userBNotifId = userBNotifs[0].id;
  assert(!!userBNotifId, 'Found User B notification for IDOR testing');

  // 5.1 User C tries to mark User B's notification as read -> 403 Forbidden
  try {
    await axios.patch(
      `${API_BASE}/notifications/${userBNotifId}/read`,
      {},
      { headers: userC.headers }
    );
    assert(false, '5.1 User C should NOT be able to mark User B notification as read');
  } catch (err: any) {
    assert(err.response?.status === 403, '5.1 IDOR Protection: Mark read of another user notification returns HTTP 403 Forbidden');
  }

  // 5.2 User C tries to delete User B's notification -> 403 Forbidden
  try {
    await axios.delete(
      `${API_BASE}/notifications/${userBNotifId}`,
      { headers: userC.headers }
    );
    assert(false, '5.2 User C should NOT be able to delete User B notification');
  } catch (err: any) {
    assert(err.response?.status === 403, '5.2 IDOR Protection: Deletion of another user notification returns HTTP 403 Forbidden');
  }

  // 5.3 Unauthenticated access -> 401 Unauthorized
  try {
    await axios.get(`${API_BASE}/notifications`);
    assert(false, '5.3 Unauthenticated access to /api/notifications should fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '5.3 Unauthenticated access returns HTTP 401 Unauthorized');
  }

  // ──────────────────────────────────────────────────────────
  // SUITE 6: Querying, Filtering & Read Status Management
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: Querying, Filtering & Read Status Management ---');

  // 6.1 Unread Count
  const countRes = await axios.get(`${API_BASE}/notifications/unread-count`, { headers: userB.headers });
  assert(countRes.status === 200 && typeof countRes.data.unread_count === 'number', '6.1 GET /unread-count returns numeric unread_count');
  const initialUnread = countRes.data.unread_count;

  // 6.2 Filter by unreadOnly=true
  const unreadOnlyRes = await axios.get(`${API_BASE}/notifications?unreadOnly=true`, { headers: userB.headers });
  assert(unreadOnlyRes.data.notifications.every((n: any) => n.is_read === false), '6.2 unreadOnly=true returns only unread notifications');

  // 6.3 Mark single notification as read
  const markReadRes = await axios.patch(
    `${API_BASE}/notifications/${userBNotifId}/read`,
    {},
    { headers: userB.headers }
  );
  assert(markReadRes.data.notification.is_read === true, '6.3 User B marks own notification as read -> is_read = true');

  const countAfterOneRead = (await axios.get(`${API_BASE}/notifications/unread-count`, { headers: userB.headers })).data.unread_count;
  assert(countAfterOneRead === initialUnread - 1, '6.3 Unread count decrements by 1 after single mark as read');

  // 6.4 Mark all notifications as read
  const markAllRes = await axios.patch(
    `${API_BASE}/notifications/read-all`,
    {},
    { headers: userB.headers }
  );
  assert(markAllRes.status === 200, '6.4 Mark all notifications as read returns HTTP 200');

  const countAfterAllRead = (await axios.get(`${API_BASE}/notifications/unread-count`, { headers: userB.headers })).data.unread_count;
  assert(countAfterAllRead === 0, '6.4 Unread count drops to 0 after read-all');

  // 6.5 Delete notification
  const delRes = await axios.delete(
    `${API_BASE}/notifications/${userBNotifId}`,
    { headers: userB.headers }
  );
  assert(delRes.status === 200, '6.5 User B successfully deletes own notification');

  // ──────────────────────────────────────────────────────────
  // SUITE 7: Unified SSE Security & Capability Tickets
  // ──────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: SSE Infrastructure Security & Capability Tickets ---');

  // 7.1 Ban JWT in query parameter
  try {
    await axios.get(`${API_BASE}/notifications/stream?token=${userB.token}`);
    assert(false, '7.1 Query JWT on /api/notifications/stream must be rejected');
  } catch (err: any) {
    assert(
      err.response?.status === 400 && (err.response?.data?.error?.includes('bảo mật') || err.response?.data?.error?.includes('security')),
      '7.1 Passing token in query returns HTTP 400 Bad Request (strictly prevents JWT query leak)'
    );
  }

  // 7.2 Create capability ticket
  const ticketRes = await axios.post(
    `${API_BASE}/notifications/stream-ticket`,
    {},
    { headers: userB.headers }
  );
  assert(ticketRes.status === 200 && ticketRes.data.ticket?.startsWith('sse_notif_'), '7.2 Successfully generated capability ticket sse_notif_*');
  const ticket = ticketRes.data.ticket;

  // 7.3 Connect with valid capability ticket
  const streamRes = await axios.get(
    `${API_BASE}/notifications/stream?ticket=${ticket}`,
    {
      headers: { Accept: 'text/event-stream' },
      responseType: 'stream',
      timeout: 2000,
    }
  );
  assert(streamRes.status === 200, '7.3 Stream connects successfully with valid capability ticket');
  streamRes.data.destroy(); // Close stream

  // 7.4 Single-use enforcement: reusing ticket must fail
  try {
    await axios.get(
      `${API_BASE}/notifications/stream?ticket=${ticket}`,
      { headers: { Accept: 'text/event-stream' } }
    );
    assert(false, '7.4 Reusing consumed capability ticket must fail');
  } catch (err: any) {
    assert(err.response?.status === 401, '7.4 Ticket is strictly single-use: reuse returns HTTP 401 Unauthorized');
  }

  // ──────────────────────────────────────────────────────────
  // CLEANUP & SUMMARY
  // ──────────────────────────────────────────────────────────
  await db.query(`DELETE FROM notifications WHERE title LIKE '%P16%' OR content LIKE '%P16%'`);
  await db.query(`DELETE FROM users WHERE name LIKE 'P16 %' OR email LIKE '%@p16.cognito.test'`);

  console.log('\n========================================================');
  console.log(`  PHASE 16 TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('========================================================\n');
  return { passedTests, totalTests };
}

if (require.main === module) {
  runPhase16Tests()
    .then(() => {
      console.log('All Phase 16 tests completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Phase 16 tests failed with error:', err);
      process.exit(1);
    });
}
