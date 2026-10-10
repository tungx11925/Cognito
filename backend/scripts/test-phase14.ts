import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

export async function runPhase14Tests() {
  console.log('\n========================================================');
  console.log('   COGNITO PHASE 14: USER PROFILE + PUBLIC PROFILE      ');
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
  await db.query(`DELETE FROM users WHERE name LIKE 'P14 %' OR email LIKE '%@p14.cognito.test'`);

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
  const userA = await registerUser(`p14_user_a_${timestamp}@p14.cognito.test`, 'P14 User A');
  const userB = await registerUser(`p14_user_b_${timestamp}@p14.cognito.test`, 'P14 User B');
  const userC = await registerUser(`p14_user_c_${timestamp}@p14.cognito.test`, 'P14 User C');
  const admin = await registerUser(`p14_admin_${timestamp}@p14.cognito.test`, 'P14 Admin', 'admin');

  console.log(`[SETUP] Registered test users: UserA=${userA.id}, UserB=${userB.id}, UserC=${userC.id}, Admin=${admin.id}\n`);

  try {
    // ─── SUITE 1: Private Profile & Self Learning Data ───
    console.log('--- SUITE 1: Private Profile & Self Learning Data ---');
    {
      // 1.1 Owner requests their own profile
      const res = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userA.headers });
      assert(res.status === 200, 'Self profile returns 200 OK');
      assert(res.data.isRestricted === false, 'Self profile is not restricted');
      assert(res.data.isSelf === true, 'Self profile indicates isSelf = true');

      const u = res.data.user;
      assert(u.id === userA.id, 'User ID matches self');
      assert(u.email === userA.email, 'Owner can see their own private email');
      assert(u.phone !== undefined, 'Owner can see their own phone number');
      assert(u.privacy_setting !== undefined, 'Owner can see privacy_setting');

      // 1.2 Learning stats & study tracking for self
      assert(u.learning_stats !== undefined, 'Self profile includes learning_stats');
      assert(typeof u.learning_stats.total_documents === 'number', 'learning_stats includes total_documents');
      assert(typeof u.learning_stats.total_decks === 'number', 'learning_stats includes total_decks');
      assert(typeof u.learning_stats.total_quizzes === 'number', 'learning_stats includes total_quizzes');
      assert(typeof u.learning_stats.total_notes === 'number', 'learning_stats includes total_notes');
      assert(typeof u.learning_stats.total_mindmaps === 'number', 'learning_stats includes total_mindmaps');
      assert(typeof u.learning_stats.total_study_sessions === 'number', 'learning_stats includes total_study_sessions');
      assert(typeof u.learning_stats.total_focus_minutes === 'number', 'learning_stats includes total_focus_minutes');
      assert(Array.isArray(u.study_dates), 'Self profile includes study_dates calendar array');
      assert(Array.isArray(u.documents), 'Self profile includes full document list');
    }

    // ─── SUITE 2: Profile Settings Update (PUT /api/auth/profile) ───
    console.log('\n--- SUITE 2: Profile Settings Update ---');
    {
      // 2.1 Update settings with valid data
      const updatedPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
      const updateData = {
        name: 'P14 User A Updated',
        phone: updatedPhone,
        education: 'Đại học Quốc Gia',
        address: 'Hà Nội, Việt Nam',
        website: 'https://cognito-student.dev',
        privacy_setting: 'private',
        bio: 'Đam mê lập trình và học tập trực tuyến',
        headline: 'Full-stack Developer & Sinh viên xuất sắc',
      };

      const res = await axios.put(`${API_BASE}/auth/profile`, updateData, { headers: userA.headers });
      assert(res.status === 200, 'Update profile returns 200 OK');
      assert(res.data.user.name === updateData.name, 'Name successfully updated');
      assert(res.data.user.education === updateData.education, 'Education successfully updated');
      assert(res.data.user.address === updateData.address, 'Address successfully updated');
      assert(res.data.user.website === updateData.website, 'Website successfully updated');
      assert(res.data.user.privacy_setting === 'private', 'Privacy setting updated to private');
      assert(res.data.user.bio === updateData.bio, 'Bio successfully updated');
      assert(res.data.user.headline === updateData.headline, 'Headline successfully updated');

      // 2.2 Verify update persisted in DB
      const dbCheck = await db.query('SELECT privacy_setting, bio, headline, website FROM users WHERE id = $1', [userA.id]);
      assert(dbCheck.rows[0].privacy_setting === 'private', 'DB stores updated privacy_setting');
      assert(dbCheck.rows[0].bio === updateData.bio, 'DB stores updated bio');
      assert(dbCheck.rows[0].website === updateData.website, 'DB stores updated website');

      // 2.3 Validation rejects invalid privacy settings (e.g. secret_world or friends)
      try {
        await axios.put(`${API_BASE}/auth/profile`, { name: 'Test', privacy_setting: 'secret_world' }, { headers: userA.headers });
        assert(false, 'Invalid privacy_setting secret_world should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Invalid privacy_setting returns 400 Bad Request');
      }

      try {
        await axios.put(`${API_BASE}/auth/profile`, { name: 'Test', privacy_setting: 'friends' }, { headers: userA.headers });
        assert(false, 'privacy_setting friends should be rejected (out of scope)');
      } catch (err: any) {
        assert(err.response?.status === 400, 'privacy_setting friends is rejected (400 Bad Request)');
      }
    }

    // ─── SUITE 3: Public Profile Visibility & Strict Anti-Leak Protection ───
    console.log('\n--- SUITE 3: Public Profile Visibility & Strict Anti-Leak Protection ---');
    {
      // 3.1 When privacy_setting is 'private': User B cannot see restricted profile
      await axios.put(`${API_BASE}/auth/profile`, { name: 'P14 User A Updated', privacy_setting: 'private' }, { headers: userA.headers });
      const privateView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(privateView.status === 200, 'Private profile returns 200 OK');
      assert(privateView.data.isRestricted === true, 'Private profile returns isRestricted = true');
      assert(privateView.data.privacy === 'private', 'Returns privacy = private');
      assert(privateView.data.user.name !== undefined, 'Basic name is visible');
      assert(privateView.data.user.email === undefined, 'ANTI-LEAK: Private profile hides email');
      assert(privateView.data.user.phone === undefined, 'ANTI-LEAK: Private profile hides phone');
      assert(privateView.data.user.education === undefined, 'ANTI-LEAK: Private profile hides education');
      assert(privateView.data.user.address === undefined, 'ANTI-LEAK: Private profile hides address');
      assert(privateView.data.user.role === undefined, 'ANTI-LEAK: Private profile hides role');
      assert(privateView.data.user.is_premium === undefined, 'ANTI-LEAK: Private profile hides is_premium');
      assert(privateView.data.user.documents === undefined, 'ANTI-LEAK: Private profile hides user.documents');
      assert(privateView.data.documents === undefined, 'ANTI-LEAK: Private profile hides res.data.documents');
      assert(privateView.data.user.learning_stats === undefined, 'ANTI-LEAK: Private profile hides user.learning_stats');
      assert(privateView.data.learning_stats === undefined, 'ANTI-LEAK: Private profile hides res.data.learning_stats');
      assert(privateView.data.public_resources === undefined, 'ANTI-LEAK: Private profile hides public_resources');
      assert(privateView.data.public_quizzes === undefined, 'ANTI-LEAK: Private profile hides public_quizzes');
      assert(privateView.data.public_stats === undefined, 'ANTI-LEAK: Private profile hides public_stats');

      // 3.2 When privacy_setting is 'public': User A shares community resources
      await axios.put(`${API_BASE}/auth/profile`, { name: 'P14 User A Updated', privacy_setting: 'public' }, { headers: userA.headers });

      // Create test public assets for User A:
      // a) Public community resource (document)
      const docRes = await db.query(
        `INSERT INTO community_resources (user_id, resource_id, title, description, resource_type, category, is_public, is_hidden, like_count, save_count, view_count)
         VALUES ($1, 1, 'Tài liệu Giải tích 1', 'Toàn bộ bài giảng giải tích', 'document', 'Toán học', true, false, 15, 6, 80)
         RETURNING id`,
        [userA.id]
      );
      const communityDocId = docRes.rows[0].id;

      // b) Public community quiz (test_set)
      const testSetRes = await db.query(
        `INSERT INTO test_sets (created_by, name, total_questions, total_score, is_active)
         VALUES ($1, 'Đề thi trắc nghiệm Toán', 40, 100, true)
         RETURNING id`,
        [userA.id]
      );
      const testSetId = testSetRes.rows[0].id;

      await db.query(
        `INSERT INTO community_resources (user_id, resource_id, title, description, resource_type, is_public, is_hidden, like_count, save_count, view_count)
         VALUES ($1, $2, 'Đề thi trắc nghiệm Toán', 'Kiểm tra 45 phút', 'test_set', true, false, 8, 3, 40)`,
        [userA.id, testSetId]
      );

      // c) Public flashcard deck
      await db.query(
        `INSERT INTO flashcard_decks (user_id, name, description, is_public)
         VALUES ($1, 'Flashcards Từ vựng tiếng Anh', 'Ôn tập 500 từ TOEIC', true)`,
        [userA.id]
      );

      // d) Private internal document (CRITICAL: MUST NOT BE LEAKED TO OTHER USERS)
      await db.query(
        `INSERT INTO documents (user_id, title, description, category, doc_url, file_size, visibility)
         VALUES ($1, 'Tài liệu bí mật riêng tư cá nhân.pdf', 'Mô tả bí mật học tập', 'Riêng tư', '/secret.pdf', 1024, 'private')`,
        [userA.id]
      );

      // User B (another user) views User A's public profile
      const publicView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(publicView.status === 200, 'Public profile returns 200 OK');
      assert(publicView.data.isRestricted === false, 'Public profile is not restricted');
      assert(publicView.data.isSelf === false, 'Viewing another user indicates isSelf = false');

      const targetU = publicView.data.user;
      // Legitimate public showcase fields
      assert(targetU.name === 'P14 User A Updated', 'Display Name is exposed');
      assert(targetU.bio !== undefined, 'Bio is exposed');
      assert(targetU.headline !== undefined, 'Headline is exposed');
      assert(targetU.streak !== undefined, 'Streak is exposed');
      assert(targetU.website === 'https://cognito-student.dev', 'Website is exposed');
      assert(targetU.created_at !== undefined, 'Join date (created_at) is exposed');

      // STRICT ANTI-LEAK CHECKS ON TARGET USER OBJECT
      assert(targetU.email === undefined, 'ANTI-LEAK: Email is NOT exposed to other users');
      assert(targetU.phone === undefined, 'ANTI-LEAK: Phone is NOT exposed to other users');
      assert(targetU.education === undefined, 'ANTI-LEAK: Education is NOT exposed to other users');
      assert(targetU.address === undefined, 'ANTI-LEAK: Address is NOT exposed to other users');
      assert(targetU.wallet_balance === undefined, 'ANTI-LEAK: Wallet balance is NOT exposed');
      assert(targetU.role === undefined, 'ANTI-LEAK: Role is NOT exposed to other users');
      assert(targetU.is_premium === undefined, 'ANTI-LEAK: is_premium status is strictly hidden on public profile');
      assert(targetU.documents === undefined, 'ANTI-LEAK: user.documents array is NOT exposed');
      assert(targetU.learning_stats === undefined, 'ANTI-LEAK: user.learning_stats is NOT exposed');
      assert(targetU.study_dates === undefined, 'ANTI-LEAK: user.study_dates is NOT exposed');

      // STRICT ANTI-LEAK CHECKS ON ROOT RESPONSE BODY
      assert(publicView.data.documents === undefined, 'ANTI-LEAK: Root documents array is NOT exposed');
      assert(publicView.data.learning_stats === undefined, 'ANTI-LEAK: Root learning_stats is NOT exposed');
      assert(publicView.data.study_dates === undefined, 'ANTI-LEAK: Root study_dates is NOT exposed');
      assert(publicView.data.quiz_attempts === undefined, 'ANTI-LEAK: Quiz attempts NOT exposed');
      assert(publicView.data.study_sessions === undefined, 'ANTI-LEAK: Study sessions NOT exposed');

      // STRICT WHITELIST KEY VERIFICATION: No unexpected fields present on user object
      const allowedPublicKeys = ['avatar_url', 'bio', 'created_at', 'headline', 'id', 'name', 'privacy_setting', 'streak', 'website'].sort();
      const actualUserKeys = Object.keys(targetU).sort();
      assert(
        JSON.stringify(actualUserKeys) === JSON.stringify(allowedPublicKeys),
        `Public user keys strictly match whitelist: received [${actualUserKeys.join(', ')}] vs expected [${allowedPublicKeys.join(', ')}]`
      );

      // Check exposed public community content
      assert(Array.isArray(publicView.data.public_resources), 'public_resources is returned as array');
      assert(publicView.data.public_resources.some((r: any) => r.id === communityDocId), 'Contains published document');
      assert(!publicView.data.public_resources.some((r: any) => r.resource_type === 'test_set'), 'public_resources excludes test_sets');
      assert(!publicView.data.public_resources.some((r: any) => r.title.includes('bí mật')), 'ANTI-LEAK: Private document NOT in public_resources');

      assert(Array.isArray(publicView.data.public_quizzes), 'public_quizzes is returned as array');
      assert(publicView.data.public_quizzes.some((q: any) => q.quiz_id === testSetId), 'Contains published quiz');

      assert(Array.isArray(publicView.data.public_decks), 'public_decks is returned as array');
      assert(publicView.data.public_decks.length >= 1, 'Contains published flashcard decks');

      // Check exposed public stats
      const stats = publicView.data.public_stats;
      assert(stats !== undefined, 'public_stats is exposed');
      assert(stats.total_published_resources >= 1, 'Stats total_published_resources correct');
      assert(stats.total_public_quizzes >= 1, 'Stats total_public_quizzes correct');
      assert(stats.total_public_decks >= 1, 'Stats total_public_decks correct');
      assert(stats.total_likes_received >= 23, 'Stats total_likes_received aggregated correctly');
      assert(stats.total_saves_received >= 9, 'Stats total_saves_received aggregated correctly');
    }

    // ─── SUITE 4: Guest / Unauthenticated Access to Public Profile ───
    console.log('\n--- SUITE 4: Guest / Unauthenticated Access to Public Profile ---');
    {
      // 4.1 Guest (no token) views public profile
      const guestRes = await axios.get(`${API_BASE}/users/${userA.id}/profile`);
      assert(guestRes.status === 200, 'Guest can view public profile without token (200 OK)');
      assert(guestRes.data.isRestricted === false, 'Guest receives unrestricted view for public profile');
      assert(guestRes.data.isSelf === false, 'Guest isSelf is false');
      assert(guestRes.data.user.name === 'P14 User A Updated', 'Guest can see display name');
      assert(guestRes.data.user.email === undefined, 'ANTI-LEAK: Guest cannot see email');
      assert(guestRes.data.user.phone === undefined, 'ANTI-LEAK: Guest cannot see phone');
      assert(Array.isArray(guestRes.data.public_resources), 'Guest can see public resources');
      assert(Array.isArray(guestRes.data.public_quizzes), 'Guest can see public quizzes');

      // 4.2 Guest views non-existent user
      try {
        await axios.get(`${API_BASE}/users/99999999/profile`);
        assert(false, 'Non-existent user should return 404');
      } catch (err: any) {
        assert(err.response?.status === 404, 'Non-existent user returns 404 Not Found');
      }
    }

    // ─── SUITE 5: Dynamic Privacy Toggling & Self Profile Inspection ───
    console.log('\n--- SUITE 5: Dynamic Privacy Toggling & Self Profile Inspection ---');
    {
      // 5.1 Switch User A to private
      await axios.put(`${API_BASE}/auth/profile`, { name: 'P14 User A Updated', privacy_setting: 'private' }, { headers: userA.headers });

      // User B sees restricted profile
      const userBView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(userBView.data.isRestricted === true, 'When private, other users receive restricted profile');
      assert(userBView.data.public_resources === undefined, 'No resources exposed when private');

      // 5.2 User A views self profile (isSelf === true)
      const selfView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userA.headers });
      assert(selfView.data.isRestricted === false, 'Owner viewing self is unrestricted');
      assert(selfView.data.isSelf === true, 'Owner viewing self has isSelf = true');
      assert(selfView.data.user.id === userA.id, 'Self view returns owner id');
      assert(selfView.data.user.email !== undefined, 'Owner can see own email');
      assert(selfView.data.user.phone !== undefined, 'Owner can see own phone');
      assert(selfView.data.user.role !== undefined, 'Owner can see own role');
      assert(selfView.data.user.is_premium !== undefined, 'Owner can see own is_premium status');
      assert(Array.isArray(selfView.data.user.documents), 'Owner sees full private documents list');
      assert(selfView.data.user.documents.length >= 1, 'Owner documents includes private document');
      assert(selfView.data.user.learning_stats !== undefined, 'Owner sees full private learning stats');

      // 5.3 Switch User A back to public
      await axios.put(`${API_BASE}/auth/profile`, { name: 'P14 User A Updated', privacy_setting: 'public' }, { headers: userA.headers });

      // User B can view public showcase again
      const restoredView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(restoredView.data.isRestricted === false, 'Switching back to public restores public showcase');
      assert(Array.isArray(restoredView.data.public_resources), 'User B sees public resources again');
    }

    // ─── SUITE 6: Bi-directional Block Relationship (Phase 13 Integration) ───
    console.log('\n--- SUITE 6: Bi-directional Block Relationship ---');
    {
      // Switch User A to public
      await axios.put(`${API_BASE}/auth/profile`, { name: 'P14 User A Updated', privacy_setting: 'public' }, { headers: userA.headers });

      // 6.1 User B blocks User A
      await axios.post(`${API_BASE}/community/blocks/${userA.id}`, { reason: 'Test block' }, { headers: userB.headers });

      // 6.2 Blocker (User B) tries to view blocked target (User A)
      try {
        await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
        assert(false, 'Blocker viewing blocked user profile should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocker gets 403 Forbidden');
        assert(err.response?.data?.error?.includes('chặn'), 'Error explains active block relationship');
      }

      // 6.3 Blocked user (User A) tries to view blocker (User B)
      try {
        await axios.get(`${API_BASE}/users/${userB.id}/profile`, { headers: userA.headers });
        assert(false, 'Blocked user viewing blocker profile should be rejected');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Blocked user gets 403 Forbidden');
      }

      // 6.4 Neutral third party (User C) views User A
      const neutralView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userC.headers });
      assert(neutralView.status === 200, 'Neutral third party can view profile without interference');

      // 6.5 User B unblocks User A
      await axios.delete(`${API_BASE}/community/blocks/${userA.id}`, { headers: userB.headers });

      // Now User B can view User A again
      const unblockedView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(unblockedView.status === 200, 'After unblocking, profile is accessible again');
    }

    // ─── SUITE 7: Suspended User Account Profile Access ───
    console.log('\n--- SUITE 7: Suspended User Account Profile Access ---');
    {
      // 7.1 Admin suspends User A
      await axios.post(
        `${API_BASE}/admin/moderation/users/${userA.id}/suspend`,
        { reason: 'Tài khoản vi phạm nghiêm trọng điều khoản sử dụng' },
        { headers: admin.headers }
      );

      // 7.2 User B views suspended user's profile
      try {
        await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
        assert(false, 'Viewing suspended user profile should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Suspended user profile returns 403 Forbidden');
        assert(err.response?.data?.error?.includes('đình chỉ'), 'Error mentions suspension');
      }

      // 7.3 Guest views suspended user's profile
      try {
        await axios.get(`${API_BASE}/users/${userA.id}/profile`);
        assert(false, 'Guest viewing suspended user profile should fail');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Guest viewing suspended profile gets 403 Forbidden');
      }

      // 7.4 Admin un-suspends User A
      await db.query('UPDATE users SET is_suspended = false, suspension_reason = NULL WHERE id = $1', [userA.id]);

      // Profile is accessible again
      const restoredView = await axios.get(`${API_BASE}/users/${userA.id}/profile`, { headers: userB.headers });
      assert(restoredView.status === 200, 'After un-suspending, profile is accessible again (200 OK)');
    }

  } finally {
    // Clean up test data
    await db.query(`DELETE FROM users WHERE name LIKE 'P14 %' OR email LIKE '%@p14.cognito.test'`);
  }

  console.log('\n========================================================');
  console.log(`  PHASE 14 TESTS COMPLETE: ${passedTests}/${totalTests} ASSERTIONS PASSED`);
  console.log('========================================================\n');
}

if (require.main === module) {
  runPhase14Tests()
    .then(() => {
      console.log('Phase 14 test runner completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Phase 14 test runner encountered an error:', err);
      process.exit(1);
    });
}
