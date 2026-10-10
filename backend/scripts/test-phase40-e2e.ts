import axios from 'axios';
import { db } from '../src/db';

const API_URL = 'http://localhost:5000/api';

async function runPhase40E2ETest() {
  console.log('========================================================================');
  console.log('       PHASE 40 E2E INTERACTIVE TEST: USER A & USER B (2-WAY FLOW)');
  console.log('========================================================================\n');

  const ts = Date.now().toString().slice(-6);
  const userAData = {
    email: `phase40_user_a_${ts}@example.com`,
    password: 'Password123!',
    name: `Kiểm Thử Viên A ${ts}`,
    phone: `0981${ts}`,
  };

  const userBData = {
    email: `phase40_user_b_${ts}@example.com`,
    password: 'Password123!',
    name: `Kiểm Thử Viên B ${ts}`,
    phone: `0982${ts}`,
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = 0;
  let userBId = 0;
  let docId = 0;

  try {
    // 1. Đăng ký & Đăng nhập User A và User B
    console.log('Step 1: Register User A and User B...');
    const regARes = await axios.post(`${API_URL}/auth/register`, userAData);
    tokenA = regARes.data.accessToken || regARes.data.token;
    userAId = regARes.data.user.id;
    console.log(`- User A registered: [ID ${userAId}] ${userAData.name}`);

    const regBRes = await axios.post(`${API_URL}/auth/register`, userBData);
    tokenB = regBRes.data.accessToken || regBRes.data.token;
    userBId = regBRes.data.user.id;
    console.log(`- User B registered: [ID ${userBId}] ${userBData.name}`);

    // Mark test flag
    await db.query('UPDATE users SET is_test = true WHERE id IN ($1, $2)', [userAId, userBId]);

    // 2. User A tạo tài liệu
    console.log('\nStep 2: User A creates a document...');
    const createDocRes = await axios.post(
      `${API_URL}/documents`,
      {
        title: `Tài liệu Ôn thi Kinh tế Lượng ${ts}`,
        description: 'Bộ tài liệu mô hình hồi quy OLS và kiểm định đa cộng tuyến.',
        category: 'Kinh tế',
        visibility: 'private',
        solution_text: 'Nội dung chi tiết về hồi quy OLS...',
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    docId = createDocRes.data.id;
    await db.query('UPDATE documents SET is_test = true WHERE id = $1', [docId]);
    console.log(`- Document created: [ID ${docId}] "${createDocRes.data.title}" (visibility: private)`);

    // Kiểm tra ban đầu: Chưa công khai -> User B không thấy trên feed cộng đồng
    console.log('\nStep 3: Verify document is NOT yet visible on Community Feed...');
    const initialFeed = await axios.get(`${API_URL}/community/feed`);
    const foundInFeedInitially = initialFeed.data.resources?.some((r: any) => r.resource_id === docId);
    console.log(`- Document present in community feed before publish: ${foundInFeedInitially} (Expected: false)`);
    if (foundInFeedInitially) throw new Error('Private document leaked into community feed!');

    // 4. User A công khai tài liệu lên Cộng đồng
    console.log('\nStep 4: User A publishes document to Community (Public)...');
    const shareRes = await axios.post(
      `${API_URL}/shares/generate`,
      {
        documentId: docId,
        visibility: 'public',
        accessType: 'viewer',
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log(`- Share response:`, shareRes.data.message);
    console.log(`- Share link generated:`, shareRes.data.shareUrl);

    // 5. User B kiểm tra thấy ở Cộng đồng và Tìm kiếm
    console.log('\nStep 5: User B checks Community Feed & Search...');
    const updatedFeed = await axios.get(`${API_URL}/community/feed`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const foundInFeed = updatedFeed.data.resources?.find((r: any) => r.resource_id === docId);
    console.log(`- Document present in community feed: ${!!foundInFeed} (Expected: true)`);
    if (!foundInFeed) throw new Error('Document did not appear in community feed after publish!');

    // 6. User B Thích (Like) & Lưu (Save) tài liệu của User A
    console.log('\nStep 6: User B likes and saves User A document...');
    const likeRes = await axios.post(
      `${API_URL}/documents/${docId}/like`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`- User B Like result: isLiked=${likeRes.data.isLiked}, likeCount=${likeRes.data.likeCount}`);

    const saveRes = await axios.post(
      `${API_URL}/documents/${docId}/save`,
      {},
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.log(`- User B Save result: isSaved=${saveRes.data.isSaved}, saveCount=${saveRes.data.saveCount}`);

    // Kiểm tra thông báo của User A
    console.log('\nStep 7: Verify User A received notifications for like & save...');
    const notifRes = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const userANotifs = notifRes.data.notifications || [];
    console.log(`- User A notification count: ${userANotifs.length}`);
    const hasLikeNotif = userANotifs.some((n: any) => n.type === 'like');
    const hasSaveNotif = userANotifs.some((n: any) => n.type === 'bookmark');
    console.log(`  └─ Has Like Notification: ${hasLikeNotif}`);
    console.log(`  └─ Has Save Notification: ${hasSaveNotif}`);

    // Kiểm tra tab "Đã lưu" & "Đã thích" của User B
    console.log('\nStep 8: Verify document appears in User B saved & liked lists...');
    const savedDocsRes = await axios.get(`${API_URL}/documents/user/saved`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBSaved = savedDocsRes.data.items || [];
    const savedDoc = userBSaved.find((d: any) => d.document_id === docId);
    console.log(`- Document in User B saved list: ${!!savedDoc}, is_available: ${savedDoc?.is_available}`);

    const likedDocsRes = await axios.get(`${API_URL}/documents/user/liked`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBLiked = likedDocsRes.data.items || [];
    const likedDoc = userBLiked.find((d: any) => d.document_id === docId);
    console.log(`- Document in User B liked list: ${!!likedDoc}, is_available: ${likedDoc?.is_available}`);

    // 9. User B thử sửa / xóa tài liệu của User A -> BE chặn 403 Forbidden
    console.log('\nStep 9: Security check - User B attempts to edit & delete User A document...');
    try {
      await axios.put(
        `${API_URL}/documents/${docId}`,
        { title: 'Tài liệu bị hack bởi User B' },
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      throw new Error('SECURITY BREACH: User B was able to edit User A document!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log(`✅ Edit attempt blocked: HTTP 403 Forbidden ("${err.response?.data?.error || err.response?.data?.message}")`);
      } else {
        throw err;
      }
    }

    try {
      await axios.delete(`${API_URL}/documents/${docId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      throw new Error('SECURITY BREACH: User B was able to delete User A document!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.log(`✅ Delete attempt blocked: HTTP 403 Forbidden ("${err.response?.data?.error || err.response?.data?.message}")`);
      } else {
        throw err;
      }
    }

    // 10. User A gỡ công khai (Unpublish) -> Biến mất ở Cộng đồng, tab Đã lưu của User B báo "không còn khả dụng"
    console.log('\nStep 10: User A unpublishes document (sets back to private)...');
    await axios.post(
      `${API_URL}/shares/generate`,
      {
        documentId: docId,
        visibility: 'private',
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const feedAfterUnpublish = await axios.get(`${API_URL}/community/feed`);
    const foundAfterUnpublish = feedAfterUnpublish.data.resources?.some((r: any) => r.resource_id === docId);
    console.log(`- Document present in community feed after unpublish: ${foundAfterUnpublish} (Expected: false)`);
    if (foundAfterUnpublish) throw new Error('Unpublished document still appears on community feed!');

    const savedAfterUnpublish = await axios.get(`${API_URL}/documents/user/saved`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const savedDocAfter = savedAfterUnpublish.data.items?.find((d: any) => d.document_id === docId);
    console.log(`- User B saved list after unpublish: is_available=${savedDocAfter?.is_available} (Expected: false)`);
    if (savedDocAfter?.is_available !== false) {
      throw new Error('Document should be marked as is_available=false when private!');
    }

    console.log('\n========================================================================');
    console.log('🎉 ALL PHASE 40 E2E BUSINESS FLOW VERIFICATIONS PASSED WITH 100% SUCCESS!');
    console.log('========================================================================\n');

  } catch (error: any) {
    console.error('\n❌ E2E Test Failed:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    // Cleanup test data
    console.log('Cleaning up test entities...');
    if (docId) await db.query('DELETE FROM documents WHERE id = $1', [docId]);
    if (userAId) await db.query('DELETE FROM users WHERE id = $1', [userAId]);
    if (userBId) await db.query('DELETE FROM users WHERE id = $1', [userBId]);
    console.log('✅ Cleanup completed cleanly.');
    await db.end();
  }
}

runPhase40E2ETest();
