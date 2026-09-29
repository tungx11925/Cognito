import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase13Tests() {
  console.log('\n========================================================');
  console.log('    COGNITO PHASE 13: COMMUNITY SAFETY & MODERATION     ');
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

  // Cleanup test users
  await db.query(`DELETE FROM users WHERE name LIKE 'P13 %' OR email LIKE '%@p13.cognito.test'`);

  async function registerUser(email: string, name: string, role: string = 'student') {
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
  const userA = await registerUser(`p13_user_a_${timestamp}@p13.cognito.test`, 'P13 User A');
  const userB = await registerUser(`p13_user_b_${timestamp}@p13.cognito.test`, 'P13 User B');
  const userC = await registerUser(`p13_user_c_${timestamp}@p13.cognito.test`, 'P13 User C');
  const admin = await registerUser(`p13_admin_${timestamp}@p13.cognito.test`, 'P13 Admin', 'admin');

  console.log(`[SETUP] Registered test users: UserA=${userA.id}, UserB=${userB.id}, UserC=${userC.id}, Admin=${admin.id}\n`);

  try {
    // ─── SUITE 1: User Blocking Lifecycle & Validation ───
    console.log('--- SUITE 1: User Blocking Lifecycle & Validation ---');
    {
      // 1.1 Prevent self-blocking
      try {
        await axios.post(`${API_BASE}/community/blocks/${userA.id}`, {}, { headers: userA.headers });
        assert(false, 'Self-blocking should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Self-blocking returns 400 Bad Request');
      }

      // 1.2 Prevent blocking admin
      try {
        await axios.post(`${API_BASE}/community/blocks/${admin.id}`, {}, { headers: userA.headers });
        assert(false, 'Blocking an Admin should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Blocking admin returns 400 Bad Request');
      }

      // 1.3 User A blocks User B
      const blockRes = await axios.post(
        `${API_BASE}/community/blocks/${userB.id}`,
        { reason: 'Spamming inappropriate comments' },
        { headers: userA.headers }
      );
      assert(blockRes.status === 200 && blockRes.data.success === true, 'User A successfully blocked User B');

      // 1.4 Verify User B is in User A's block list
      const listRes = await axios.get(`${API_BASE}/community/blocks`, { headers: userA.headers });
      assert(listRes.status === 200, 'Fetched User A blocked list (200 OK)');
      const blockedItem = listRes.data.blocks.find((b: any) => b.blocked_id === userB.id);
      assert(!!blockedItem, 'User B found in User A blocked list');
      assert(blockedItem.reason === 'Spamming inappropriate comments', 'Block reason recorded correctly');

      // 1.5 User A unblocks User B
      const unblockRes = await axios.delete(`${API_BASE}/community/blocks/${userB.id}`, { headers: userA.headers });
      assert(unblockRes.status === 200 && unblockRes.data.success === true, 'User A unblocked User B (200 OK)');

      // 1.6 Verify unblock 404 when unblocking non-blocked user
      try {
        await axios.delete(`${API_BASE}/community/blocks/${userB.id}`, { headers: userA.headers });
        assert(false, 'Unblocking non-blocked user should fail');
      } catch (err: any) {
        assert(err.response?.status === 404, 'Unblocking non-blocked user returns 404 Not Found');
      }

      // Re-block User B for subsequent interaction tests
      await axios.post(`${API_BASE}/community/blocks/${userB.id}`, { reason: 'Test block' }, { headers: userA.headers });
      console.log('  Re-blocked User B by User A for relationship testing.\n');
    }

    // ─── SUITE 2: Bi-directional Block Effect on Feed & Comments ───
    console.log('--- SUITE 2: Bi-directional Block Effect on Feed & Comments ---');
    let postA_Id: number;
    let postB_Id: number;
    let commentA_Id: number;
    {
      // Create Document & Publish for User A
      const docARes = await db.query(
        `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
         VALUES ($1, 'P13 Doc by User A', 'Tài liệu A', 'Công nghệ', 'public', true, 'READY') RETURNING id`,
        [userA.id]
      );
      const pubARes = await axios.post(
        `${API_BASE}/community/publish`,
        { resourceType: 'document', resourceId: docARes.rows[0].id, title: 'Bài viết công nghệ của User A' },
        { headers: userA.headers }
      );
      postA_Id = pubARes.data.resource.id;
      assert(pubARes.status === 201, 'User A published resource successfully');

      // Create Document & Publish for User B
      const docBRes = await db.query(
        `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
         VALUES ($1, 'P13 Doc by User B', 'Tài liệu B', 'Khoa học', 'public', true, 'READY') RETURNING id`,
        [userB.id]
      );
      const pubBRes = await axios.post(
        `${API_BASE}/community/publish`,
        { resourceType: 'document', resourceId: docBRes.rows[0].id, title: 'Bài viết khoa học của User B' },
        { headers: userB.headers }
      );
      postB_Id = pubBRes.data.resource.id;
      assert(pubBRes.status === 201, 'User B published resource successfully');

      // 2.1 User A checks feed -> Post B should NOT appear
      const feedA = await axios.get(`${API_BASE}/community/feed`, { headers: userA.headers });
      const foundPostB_in_A = feedA.data.resources.some((r: any) => r.id === postB_Id);
      assert(!foundPostB_in_A, 'Post B is hidden from User A feed (blocked author)');

      // 2.2 User B checks feed -> Post A should NOT appear (bi-directional!)
      const feedB = await axios.get(`${API_BASE}/community/feed`, { headers: userB.headers });
      const foundPostA_in_B = feedB.data.resources.some((r: any) => r.id === postA_Id);
      assert(!foundPostA_in_B, 'Post A is hidden from User B feed (bi-directional block filtering)');

      // 2.3 User C (neutral) checks feed -> Both Post A and Post B should appear
      const feedC = await axios.get(`${API_BASE}/community/feed`, { headers: userC.headers });
      const foundPostA_in_C = feedC.data.resources.some((r: any) => r.id === postA_Id);
      const foundPostB_in_C = feedC.data.resources.some((r: any) => r.id === postB_Id);
      assert(foundPostA_in_C && foundPostB_in_C, 'Neutral User C sees both Post A and Post B in feed');

      // 2.4 User B direct access to Post A detail -> 403 Forbidden
      try {
        await axios.get(`${API_BASE}/community/resources/${postA_Id}`, { headers: userB.headers });
        assert(false, 'Blocked user should not access resource detail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'User B accessing Post A detail returns 403 Forbidden');
      }

      // 2.5 User A comments on Post A
      const commARes = await axios.post(
        `${API_BASE}/community/resources/${postA_Id}/comments`,
        { content: 'Bình luận mở đầu từ User A' },
        { headers: userA.headers }
      );
      commentA_Id = commARes.data.comment.id;
      assert(commARes.status === 201, 'User A commented on own post');

      // Neutral User C comments on Post A
      await axios.post(
        `${API_BASE}/community/resources/${postA_Id}/comments`,
        { content: 'Bình luận từ User C' },
        { headers: userC.headers }
      );

      // User B lists comments on Post A without blocking header (public) vs with User B header
      const commsForUserB = await axios.get(`${API_BASE}/community/resources/${postA_Id}/comments`, { headers: userB.headers });
      const foundCommA_for_B = commsForUserB.data.comments.some((c: any) => c.id === commentA_Id);
      assert(!foundCommA_for_B, 'User A comments are filtered out for User B in comments list');

      const commsForUserC = await axios.get(`${API_BASE}/community/resources/${postA_Id}/comments`, { headers: userC.headers });
      const foundCommA_for_C = commsForUserC.data.comments.some((c: any) => c.id === commentA_Id);
      assert(foundCommA_for_C, 'User C can see User A comments');
      console.log('  Feed and Comments bi-directional filtering validated.\n');
    }

    // ─── SUITE 3: Block Enforcement on Interactions (Like, Save, Reshare, Comment) ───
    console.log('--- SUITE 3: Block Enforcement on Interactions ---');
    {
      // 3.1 User B tries to like User A's post -> 403
      try {
        await axios.post(`${API_BASE}/community/resources/${postA_Id}/like`, {}, { headers: userB.headers });
        assert(false, 'User B liking User A post should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocked User B cannot like User A post (403 Forbidden)');
      }

      // 3.2 User B tries to save User A's post -> 403
      try {
        await axios.post(`${API_BASE}/community/resources/${postA_Id}/save`, {}, { headers: userB.headers });
        assert(false, 'User B saving User A post should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocked User B cannot save User A post (403 Forbidden)');
      }

      // 3.3 User B tries to reshare User A's post -> 403
      try {
        await axios.post(`${API_BASE}/community/resources/${postA_Id}/reshare`, { reshareNote: 'Note' }, { headers: userB.headers });
        assert(false, 'User B resharing User A post should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocked User B cannot reshare User A post (403 Forbidden)');
      }

      // 3.4 User B tries to comment on User A's post -> 403
      try {
        await axios.post(
          `${API_BASE}/community/resources/${postA_Id}/comments`,
          { content: 'Bình luận không được phép' },
          { headers: userB.headers }
        );
        assert(false, 'User B commenting on User A post should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocked User B cannot comment on User A post (403 Forbidden)');
      }

      // 3.5 User A tries to interact with User B's post -> 403 (bi-directional interaction block)
      try {
        await axios.post(`${API_BASE}/community/resources/${postB_Id}/like`, {}, { headers: userA.headers });
        assert(false, 'User A liking User B post should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'User A cannot like blocked User B post (403 Forbidden)');
      }
      console.log('  All interaction restrictions validated under block relationships.\n');
    }

    // ─── SUITE 4: Content Reporting Lifecycle & Anti-Spam Protections ───
    console.log('--- SUITE 4: Content Reporting Lifecycle & Anti-Spam Protections ---');
    let reportResource_Id: number;
    let reportComment_Id: number;
    let reportUser_Id: number;
    {
      // 4.1 Prevent self-reporting
      try {
        await axios.post(
          `${API_BASE}/community/reports`,
          { targetType: 'resource', targetId: postA_Id, reason: 'SPAM' },
          { headers: userA.headers }
        );
        assert(false, 'Self-reporting should fail');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Self-reporting resource returns 400 Bad Request');
      }

      // 4.2 User C reports User A's resource
      const repRes = await axios.post(
        `${API_BASE}/community/reports`,
        {
          targetType: 'resource',
          targetId: postA_Id,
          reason: 'INAPPROPRIATE',
          details: 'Nội dung chứa từ ngữ gây hiểu lầm',
        },
        { headers: userC.headers }
      );
      assert(repRes.status === 201, 'User C reported User A post successfully (201 Created)');
      reportResource_Id = repRes.data.report.id;

      // Verify report count incremented on resource
      const postCheck = await db.query('SELECT report_count FROM community_resources WHERE id = $1', [postA_Id]);
      assert(postCheck.rows[0].report_count === 1, 'Resource report_count incremented to 1');

      // 4.3 Prevent duplicate pending report from same reporter
      try {
        await axios.post(
          `${API_BASE}/community/reports`,
          { targetType: 'resource', targetId: postA_Id, reason: 'SPAM' },
          { headers: userC.headers }
        );
        assert(false, 'Duplicate pending report should fail');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Duplicate pending report returns 400 Bad Request');
      }

      // 4.4 User C reports User A's comment
      const repComm = await axios.post(
        `${API_BASE}/community/reports`,
        {
          targetType: 'comment',
          targetId: commentA_Id,
          reason: 'HARASSMENT',
          details: 'Quấy rối qua bình luận',
        },
        { headers: userC.headers }
      );
      assert(repComm.status === 201, 'User C reported User A comment (201 Created)');
      reportComment_Id = repComm.data.report.id;

      // 4.5 User C reports User A (user account)
      const repUser = await axios.post(
        `${API_BASE}/community/reports`,
        {
          targetType: 'user',
          targetId: userA.id,
          reason: 'OTHER',
          details: 'Hành vi vi phạm quy chuẩn cộng đồng chung',
        },
        { headers: userC.headers }
      );
      assert(repUser.status === 201, 'User C reported User A account (201 Created)');
      reportUser_Id = repUser.data.report.id;

      // 4.6 User C views their submitted reports
      const myReports = await axios.get(`${API_BASE}/community/my-reports`, { headers: userC.headers });
      assert(myReports.status === 200, 'Fetched user submitted reports (200 OK)');
      assert(myReports.data.reports.length >= 3, 'User C sees all 3 submitted reports');

      // 4.7 Auto-flagging / Auto-hide threshold test: when report_count reaches 5, auto-hide
      await db.query('UPDATE community_resources SET report_count = 4 WHERE id = $1', [postA_Id]);
      // Create user D to make the 5th report
      const userD = await registerUser(`p13_user_d_${timestamp}@p13.cognito.test`, 'P13 User D');
      await axios.post(
        `${API_BASE}/community/reports`,
        { targetType: 'resource', targetId: postA_Id, reason: 'SPAM' },
        { headers: userD.headers }
      );
      const postAfter5Reports = await db.query('SELECT is_hidden, report_count FROM community_resources WHERE id = $1', [postA_Id]);
      assert(postAfter5Reports.rows[0].report_count === 5, 'Resource report count reached 5');
      assert(postAfter5Reports.rows[0].is_hidden === true, 'Resource is automatically hidden when report_count >= 5');
      console.log('  Content reporting lifecycle & auto-flag threshold validated.\n');
    }

    // ─── SUITE 5: Rate Limiting & Anti-Spam Protection ───
    console.log('--- SUITE 5: Rate Limiting & Anti-Spam Protection ---');
    {
      // 5.1 Comment cooldown (< 3 seconds)
      const userE = await registerUser(`p13_user_e_${timestamp}@p13.cognito.test`, 'P13 User E');
      const c1 = await axios.post(
        `${API_BASE}/community/resources/${postB_Id}/comments`,
        { content: 'Bình luận 1' },
        { headers: userE.headers }
      );
      assert(c1.status === 201, 'Sent comment 1');

      try {
        await axios.post(
          `${API_BASE}/community/resources/${postB_Id}/comments`,
          { content: 'Bình luận 2 gửi ngay lập tức' },
          { headers: userE.headers }
        );
        assert(false, 'Rapid comment should trigger cooldown 429');
      } catch (err: any) {
        assert(err.response?.status === 429, 'Comment cooldown (<3s) returns 429 Too Many Requests');
      }

      // 5.2 Duplicate comment detection
      // Simulate waiting 3.1 seconds in DB timestamp
      await db.query(
        `UPDATE community_comments SET created_at = NOW() - INTERVAL '5 seconds' WHERE user_id = $1`,
        [userE.id]
      );
      try {
        await axios.post(
          `${API_BASE}/community/resources/${postB_Id}/comments`,
          { content: 'Bình luận 1' }, // Exactly identical to comment 1
          { headers: userE.headers }
        );
        assert(false, 'Duplicate comment should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 400, `Duplicate comment on same post returns 400 Bad Request (got ${err.response?.status}: ${err.response?.data?.error})`);
      }

      // 5.3 Publish rate limit (max 5 per 10 minutes)
      const userF = await registerUser(`p13_user_f_${timestamp}@p13.cognito.test`, 'P13 User F');
      for (let i = 0; i < 5; i++) {
        const d = await db.query(
          `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
           VALUES ($1, 'Doc rate limit ${i}', 'Desc', 'Chung', 'public', true, 'READY') RETURNING id`,
          [userF.id]
        );
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'document', resourceId: d.rows[0].id, title: `Doc ${i}` },
          { headers: userF.headers }
        );
      }
      // 6th publish should fail with 429
      const dExtra = await db.query(
        `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
         VALUES ($1, 'Doc rate limit 6', 'Desc', 'Chung', 'public', true, 'READY') RETURNING id`,
        [userF.id]
      );
      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'document', resourceId: dExtra.rows[0].id, title: 'Doc 6' },
          { headers: userF.headers }
        );
        assert(false, '6th publish should exceed rate limit');
      } catch (err: any) {
        assert(err.response?.status === 429, 'Publish rate limit exceeded returns 429 Too Many Requests');
      }
      console.log('  Anti-spam & rate limit protections validated.\n');
    }

    // ─── SUITE 6: Admin Content Moderation Queue & Action Execution ───
    console.log('--- SUITE 6: Admin Content Moderation Queue & Action Execution ---');
    {
      // 6.1 Admin Moderation Stats
      const statsRes = await axios.get(`${API_BASE}/admin/moderation/stats`, { headers: admin.headers });
      assert(statsRes.status === 200, 'Admin fetched moderation stats (200 OK)');
      assert(Number(statsRes.data.pendingReports) >= 1, 'Moderation stats shows pending reports');

      // 6.2 Admin lists moderation reports queue
      const queueRes = await axios.get(`${API_BASE}/admin/moderation/reports?status=PENDING`, { headers: admin.headers });
      assert(queueRes.status === 200, 'Admin fetched pending reports queue (200 OK)');
      assert(queueRes.data.reports.length > 0, 'Reports queue contains submitted reports');

      // 6.3 Action KEEP on resource report: dismiss report, keep content
      const keepRes = await axios.post(
        `${API_BASE}/admin/moderation/reports/${reportResource_Id}/action`,
        { action: 'KEEP', reason: 'Nội dung hợp lệ sau kiểm tra thực tế', notes: 'Đã xem xét nội dung kỹ' },
        { headers: admin.headers }
      );
      assert(keepRes.status === 200, 'Admin applied KEEP action (200 OK)');
      assert(keepRes.data.report.status === 'DISMISSED', 'Report marked DISMISSED after KEEP action');

      // 6.4 Action HIDE on comment report: soft-hide comment
      const hideRes = await axios.post(
        `${API_BASE}/admin/moderation/reports/${reportComment_Id}/action`,
        { action: 'HIDE', reason: 'Bình luận có ngôn từ không chuẩn mực' },
        { headers: admin.headers }
      );
      assert(hideRes.status === 200, 'Admin applied HIDE action (200 OK)');
      assert(hideRes.data.report.status === 'RESOLVED', 'Report marked RESOLVED after HIDE action');
      const commentCheck = await db.query('SELECT is_hidden FROM community_comments WHERE id = $1', [commentA_Id]);
      assert(commentCheck.rows[0].is_hidden === true, 'Comment is_hidden set to true');

      // 6.5 Action WARN on user report: increments warning_count, status WARNED
      const warnRes = await axios.post(
        `${API_BASE}/admin/moderation/reports/${reportUser_Id}/action`,
        { action: 'WARN', reason: 'Cảnh cáo lần 1 về hành vi bình luận tiêu cực' },
        { headers: admin.headers }
      );
      assert(warnRes.status === 200, 'Admin applied WARN action (200 OK)');
      const userACheck = await db.query('SELECT status, warning_count FROM users WHERE id = $1', [userA.id]);
      assert(userACheck.rows[0].status === 'WARNED', 'User status updated to WARNED');
      assert(userACheck.rows[0].warning_count === 1, 'User warning_count incremented to 1');

      // 6.6 Direct user suspension
      const suspendRes = await axios.post(
        `${API_BASE}/admin/moderation/users/${userA.id}/suspend`,
        { reason: 'Tạm khóa tài khoản do tái phạm nhiều lần' },
        { headers: admin.headers }
      );
      assert(suspendRes.status === 200, 'Admin directly suspended User A (200 OK)');

      // Verify User A status in DB
      const userASuspended = await db.query('SELECT is_suspended, status, suspension_reason FROM users WHERE id = $1', [userA.id]);
      assert(userASuspended.rows[0].is_suspended === true, 'User A is_suspended is true');
      assert(userASuspended.rows[0].status === 'SUSPENDED', 'User A status is SUSPENDED');

      // 6.7 Suspended user is blocked from making authenticated requests -> 403 Forbidden
      try {
        await axios.get(`${API_BASE}/community/my-resources`, { headers: userA.headers });
        assert(false, 'Suspended user request should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Suspended user authenticated request rejected with 403 Forbidden');
      }

      // 6.8 Direct user unsuspension
      const unsuspendRes = await axios.post(
        `${API_BASE}/admin/moderation/users/${userA.id}/unsuspend`,
        {},
        { headers: admin.headers }
      );
      assert(unsuspendRes.status === 200, 'Admin unsuspended User A (200 OK)');
      const userAActive = await db.query('SELECT is_suspended, status FROM users WHERE id = $1', [userA.id]);
      assert(userAActive.rows[0].is_suspended === false, 'User A is_suspended is false after unsuspension');
      assert(userAActive.rows[0].status === 'ACTIVE', 'User A status is ACTIVE');

      // 6.9 Action REMOVE on newly created content report
      // Create a test comment to remove
      const commTemp = await db.query(
        `INSERT INTO community_comments (resource_id, user_id, content) VALUES ($1, $2, 'Rác') RETURNING id`,
        [postB_Id, userC.id]
      );
      const repTemp = await db.query(
        `INSERT INTO content_reports (reporter_id, target_type, target_id, reason, status)
         VALUES ($1, 'comment', $2, 'SPAM', 'PENDING') RETURNING id`,
        [userB.id, commTemp.rows[0].id]
      );
      const removeRes = await axios.post(
        `${API_BASE}/admin/moderation/reports/${repTemp.rows[0].id}/action`,
        { action: 'REMOVE', reason: 'Nội dung rác vi phạm nghiêm trọng' },
        { headers: admin.headers }
      );
      assert(removeRes.status === 200, 'Admin applied REMOVE action (200 OK)');
      const checkDeletedComm = await db.query('SELECT 1 FROM community_comments WHERE id = $1', [commTemp.rows[0].id]);
      assert(checkDeletedComm.rows.length === 0, 'Comment permanently removed from database');
      console.log('  Admin moderation workflows and actions validated.\n');
    }

    // ─── SUITE 7: Moderation History Audit Trail ───
    console.log('--- SUITE 7: Moderation History Audit Trail ---');
    {
      const historyRes = await axios.get(`${API_BASE}/admin/moderation/history`, { headers: admin.headers });
      assert(historyRes.status === 200, 'Admin fetched moderation history (200 OK)');
      assert(historyRes.data.history.length >= 4, 'Moderation audit log has recorded all actions');

      const actions = historyRes.data.history.map((h: any) => h.action);
      assert(actions.includes('KEEP'), 'Audit log contains KEEP action');
      assert(actions.includes('HIDE'), 'Audit log contains HIDE action');
      assert(actions.includes('WARN'), 'Audit log contains WARN action');
      assert(actions.includes('SUSPEND'), 'Audit log contains SUSPEND action');
      assert(actions.includes('REMOVE'), 'Audit log contains REMOVE action');

      // Check admin info in audit log
      assert(historyRes.data.history[0].admin_name !== undefined, 'Audit log entries include moderator admin name');
      console.log('  Moderation history audit trail fully verified.\n');
    }

    // ─── SUITE 8: IDOR & Role-Based Access Control ───
    console.log('--- SUITE 8: IDOR & Role-Based Access Control ---');
    {
      // Non-admin (User C) tries to access moderation routes -> 403
      try {
        await axios.get(`${API_BASE}/admin/moderation/stats`, { headers: userC.headers });
        assert(false, 'Non-admin accessing stats should be forbidden');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Non-admin accessing /moderation/stats returns 403 Forbidden');
      }

      try {
        await axios.get(`${API_BASE}/admin/moderation/reports`, { headers: userC.headers });
        assert(false, 'Non-admin accessing reports queue should be forbidden');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Non-admin accessing /moderation/reports returns 403 Forbidden');
      }

      try {
        await axios.post(
          `${API_BASE}/admin/moderation/reports/${reportResource_Id}/action`,
          { action: 'KEEP', reason: 'Hack' },
          { headers: userC.headers }
        );
        assert(false, 'Non-admin taking moderation action should be forbidden');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Non-admin taking moderation action returns 403 Forbidden');
      }

      try {
        await axios.post(
          `${API_BASE}/admin/moderation/users/${userA.id}/suspend`,
          { reason: 'Hack' },
          { headers: userC.headers }
        );
        assert(false, 'Non-admin suspending user should be forbidden');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Non-admin suspending user returns 403 Forbidden');
      }
      console.log('  IDOR & Role-based security checks passed.\n');
    }

    console.log(`\n🎉 PHASE 13 TESTS FINISHED: ${passedTests}/${totalTests} PASSED (100%)\n`);
  } finally {
    // Cleanup test data
    await db.query(`DELETE FROM users WHERE name LIKE 'P13 %' OR email LIKE '%@p13.cognito.test'`);
  }
}

if (require.main === module) {
  runPhase13Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during Phase 13 tests:', err);
      process.exit(1);
    });
}
