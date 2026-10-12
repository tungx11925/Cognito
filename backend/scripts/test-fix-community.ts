import axios from 'axios';
import { db } from '../src/db';
import { buildStudyUrl } from '../src/services/community.service';

const API_BASE = 'http://localhost:5000/api';

async function runCommunityFixTests() {
  console.log('\n========================================================');
  console.log('    TEST SUITE: COMMUNITY FIX VERIFICATION (AC A -> H)  ');
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
    console.log(`  ✅ [PASS] ${msg}`);
  }

  // Register test user helper
  async function registerUser(email: string, name: string) {
    const phone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const uniqueName = `${name} ${Math.floor(Math.random() * 100000)}`;
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: uniqueName,
      email,
      password: 'Password123!',
      phone,
    });
    return {
      id: res.data.user.id,
      name: uniqueName,
      token: res.data.token,
      headers: { Authorization: `Bearer ${res.data.token}` },
    };
  }

  const ts = Date.now();
  const author = await registerUser(`comm_author_${ts}@cognito.test`, 'Comm Author');
  const userA = await registerUser(`comm_usera_${ts}@cognito.test`, 'Comm User A');
  const userB = await registerUser(`comm_userb_${ts}@cognito.test`, 'Comm User B');

  console.log(`[SETUP] Users registered: Author=${author.id}, UserA=${userA.id}, UserB=${userB.id}\n`);

  try {
    // ---------------------------------------------------------
    // TEST 1: buildStudyUrl shared function & availability guard
    // ---------------------------------------------------------
    console.log('--- TEST 1: buildStudyUrl & Availability Guard (AC-B) ---');
    assert(buildStudyUrl('document', 101, true) === '/viewer/101', 'Document study_url correctly formatted when available');
    assert(buildStudyUrl('test_set', 102, true) === '/quiz/102', 'Quiz study_url correctly formatted when available');
    assert(buildStudyUrl('mindmap', 103, true) === '/mindmap?id=103', 'Mindmap study_url correctly formatted when available');
    assert(buildStudyUrl('flashcard_deck', 104, true) === '/flashcards/104', 'Flashcard deck study_url correctly formatted when available');
    assert(buildStudyUrl('document', 101, false) === null, 'study_url is null when isAvailable=false');
    assert(buildStudyUrl('test_set', 102, false) === null, 'study_url is null when quiz is unavailable');

    // ---------------------------------------------------------
    // TEST 2: Personal resources snake_case flashcard_decks (AC-A)
    // ---------------------------------------------------------
    console.log('\n--- TEST 2: Personal Resources Field Standardisation (AC-A) ---');
    const myRes = await axios.get(`${API_BASE}/community/my-resources`, { headers: author.headers });
    assert(Array.isArray(myRes.data.documents), 'my-resources returns documents array');
    assert(Array.isArray(myRes.data.flashcard_decks), 'my-resources returns snake_case flashcard_decks array');
    assert(!('flashcardDecks' in myRes.data), 'my-resources does NOT return camelCase flashcardDecks');

    // Create a real document for author to publish
    const docRes = await db.query(
      `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
       VALUES ($1, 'Tài liệu ôn thi GDCD', 'Nội dung chi tiết', 'Khác', 'public', true, 'READY')
       RETURNING id`,
      [author.id]
    );
    const rawDocId = docRes.rows[0].id;

    // Publish resource to community
    const pubRes = await axios.post(`${API_BASE}/community/publish`, {
      resourceType: 'document',
      resourceId: rawDocId,
      title: 'Tài liệu ôn thi GDCD 2026',
      description: 'Tài liệu chi tiết ôn thi THPT',
      category: 'Khác',
      tags: ['GDCD', 'THPT'],
    }, { headers: author.headers });
    const commId = pubRes.data.resource.id;
    assert(commId > 0, 'Resource published successfully');

    // Verify study_url in feed
    const feedRes = await axios.get(`${API_BASE}/community/feed`);
    const publishedPost = feedRes.data.resources.find((r: any) => r.id === commId);
    assert(publishedPost !== undefined, 'Published resource appears in community feed');
    assert(publishedPost.study_url === `/viewer/${rawDocId}`, 'Feed post has valid study_url');
    assert(publishedPost.is_available === true, 'Feed post is_available is true');

    // ---------------------------------------------------------
    // TEST 3: Reshare Post (Học ngay, comment, save/like) (AC-G)
    // ---------------------------------------------------------
    console.log('\n--- TEST 3: Reshare Post Functionality (AC-G) ---');
    const reshareRes = await axios.post(`${API_BASE}/community/resources/${commId}/reshare`, {
      reshareNote: 'Bài viết này rất hay, mọi người nên xem qua!',
    }, { headers: userA.headers });
    const reshareId = reshareRes.data.resource.id;
    assert(reshareId > 0, 'User A successfully reshared post');

    // Check reshare feed item
    const feedAfterReshare = await axios.get(`${API_BASE}/community/feed`);
    const resharePost = feedAfterReshare.data.resources.find((r: any) => r.id === reshareId);
    assert(resharePost.is_reshare === true, 'Reshare item has is_reshare: true');
    assert(resharePost.study_url === `/viewer/${rawDocId}`, 'Reshare post has correct inherited study_url');
    assert(resharePost.author_name === userA.name, 'Reshare post author is User A');
    assert(resharePost.original_author_name === author.name, 'Reshare post displays original author');

    // User B likes and saves the reshare post
    const likeRes = await axios.post(`${API_BASE}/community/resources/${reshareId}/like`, {}, { headers: userB.headers });
    assert(likeRes.data.liked === true, 'User B liked reshare post');

    const saveRes = await axios.post(`${API_BASE}/community/resources/${reshareId}/save`, {}, { headers: userB.headers });
    assert(saveRes.data.saved === true, 'User B saved reshare post');

    // ---------------------------------------------------------
    // TEST 4: Profile /my-saved & /my-liked (AC-D)
    // ---------------------------------------------------------
    console.log('\n--- TEST 4: User Profile My-Saved & My-Liked Endpoints (AC-D) ---');
    // Guest access must be rejected
    try {
      await axios.get(`${API_BASE}/community/my-saved`);
      assert(false, 'Guest cannot access /my-saved');
    } catch (e: any) {
      assert(e.response?.status === 401, 'Guest gets 401 on /my-saved');
    }

    // User B fetches saved items
    const userBSaved = await axios.get(`${API_BASE}/community/my-saved`, { headers: userB.headers });
    assert(userBSaved.data.total >= 1, 'User B has saved items');
    const savedItem = userBSaved.data.resources.find((r: any) => r.id === reshareId);
    assert(savedItem !== undefined, 'User B my-saved contains the reshare post');
    assert(savedItem.study_url === `/viewer/${rawDocId}`, 'Saved item has valid study_url');
    assert(savedItem.status === 'AVAILABLE', 'Saved item has status AVAILABLE');

    // User B fetches liked items
    const userBLiked = await axios.get(`${API_BASE}/community/my-liked`, { headers: userB.headers });
    assert(userBLiked.data.total >= 1, 'User B has liked items');
    const likedItem = userBLiked.data.resources.find((r: any) => r.id === reshareId);
    assert(likedItem !== undefined, 'User B my-liked contains the reshare post');

    // User B unsaves -> disappears immediately
    await axios.post(`${API_BASE}/community/resources/${reshareId}/save`, {}, { headers: userB.headers });
    const userBSavedAfter = await axios.get(`${API_BASE}/community/my-saved`, { headers: userB.headers });
    assert(!userBSavedAfter.data.resources.some((r: any) => r.id === reshareId), 'Item removed from my-saved immediately upon unsave');

    // User B unlikes -> disappears immediately
    await axios.post(`${API_BASE}/community/resources/${reshareId}/like`, {}, { headers: userB.headers });
    const userBLikedAfter = await axios.get(`${API_BASE}/community/my-liked`, { headers: userB.headers });
    assert(!userBLikedAfter.data.resources.some((r: any) => r.id === reshareId), 'Item removed from my-liked immediately upon unlike');

    // ---------------------------------------------------------
    // TEST 5: Comments Tree & Cascade Delete Count Recalculation (AC-A & AC-C)
    // ---------------------------------------------------------
    console.log('\n--- TEST 5: Comments Tree & Cascade Delete Recalculation (AC-A, AC-C) ---');
    // Add Parent Comment by User A
    const parentCommentRes = await axios.post(`${API_BASE}/community/resources/${commId}/comments`, {
      content: 'Bình luận cha từ User A',
    }, { headers: userA.headers });
    const parentComment = parentCommentRes.data.comment;
    assert(parentComment.author_name === userA.name, 'Comment uses author_name');
    assert(!('user_name' in parentComment), 'Comment does NOT contain user_name (AC-A)');
    const parentCommentId = parentComment.id;

    // Add Child Reply by User B
    const childCommentRes = await axios.post(`${API_BASE}/community/resources/${commId}/comments`, {
      content: 'Trả lời bình luận con từ User B',
      parentId: parentCommentId,
    }, { headers: userB.headers });
    const childComment = childCommentRes.data.comment;
    assert(childComment.parent_id === parentCommentId, 'Child comment has correct parent_id');

    // List comments and check response & nested tree
    const listRes = await axios.get(`${API_BASE}/community/resources/${commId}/comments`);
    const rawComments = listRes.data.comments;
    assert(rawComments.length === 2, 'API returns all comments including replies');
    const childFound = rawComments.find((c: any) => c.id === childComment.id);
    assert(childFound?.parent_id === parentCommentId, 'Child comment has parent_id pointing to parent');

    // Verify FE tree construction algorithm
    const commentMap = new Map<number, any>();
    const roots: any[] = [];
    rawComments.forEach((c: any) => commentMap.set(c.id, { ...c, replies: [] }));
    rawComments.forEach((c: any) => {
      const current = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(current);
      } else {
        roots.push(current);
      }
    });
    assert(roots.length === 1, 'FE tree constructor groups to exactly 1 root comment');
    assert(roots[0].replies.length === 1, 'FE tree constructor nests child reply under parent');
    assert(roots[0].replies[0].id === childComment.id, 'Nested reply matches child comment ID');

    // Verify comment_count on resource before delete
    const commDetailBefore = await axios.get(`${API_BASE}/community/resources/${commId}`);
    assert(commDetailBefore.data.resource.comment_count === 2, 'Resource comment_count is 2 before deletion');

    // Delete Parent Comment: both parent and child must be deleted, count recalculated to 0
    const delRes = await axios.delete(`${API_BASE}/community/comments/${parentCommentId}`, { headers: userA.headers });
    assert(delRes.data.success === true, 'Parent comment deleted successfully');
    assert(delRes.data.comment_count === 0, 'Returned comment_count is 0 after cascade deletion');

    // Verify in DB that child was cascaded and resource count is 0
    const countCheck = await db.query('SELECT comment_count FROM community_resources WHERE id = $1', [commId]);
    assert(countCheck.rows[0].comment_count === 0, 'DB community_resources.comment_count is exactly 0 after cascade');

    const remainingComments = await db.query('SELECT COUNT(*)::int as count FROM community_comments WHERE resource_id = $1', [commId]);
    assert(remainingComments.rows[0].count === 0, 'No orphaned comments remaining in DB');

    // ---------------------------------------------------------
    // TEST 6: Deleted / Suspended Author Safety (AC-G)
    // ---------------------------------------------------------
    console.log('\n--- TEST 6: Deleted / Suspended Author Fallback (AC-G) ---');
    // Create an anonymous/deleted user with null name
    const anonRes = await db.query(
      `INSERT INTO users (email, password, role, name)
       VALUES ('deleted_user_${ts}@cognito.test', 'hash', 'user', NULL)
       RETURNING id`
    );
    const anonUserId = anonRes.rows[0].id;

    // Insert comment from this deleted/null user directly
    const anonCommentRes = await db.query(
      `INSERT INTO community_comments (resource_id, user_id, content)
       VALUES ($1, $2, 'Bình luận từ tài khoản đã xóa')
       RETURNING id`,
      [commId, anonUserId]
    );

    // List comments and verify fallback 'Người dùng'
    const listAfterAnon = await axios.get(`${API_BASE}/community/resources/${commId}/comments`);
    const anonComment = listAfterAnon.data.comments.find((c: any) => c.id === anonCommentRes.rows[0].id);
    assert(anonComment !== undefined, 'Anon comment retrieved without error');
    assert(anonComment.author_name === 'Người dùng', 'Deleted author safely falls back to "Người dùng"');

    // Clean up anon comment
    await db.query('DELETE FROM community_comments WHERE id = $1', [anonCommentRes.rows[0].id]);
    await db.query('DELETE FROM users WHERE id = $1', [anonUserId]);

    // ---------------------------------------------------------
    // TEST 7: Underlying Resource UNAVAILABLE -> study_url=null (AC-B)
    // ---------------------------------------------------------
    console.log('\n--- TEST 7: Resource UNAVAILABLE Safety (AC-B) ---');
    // Delete the underlying document
    await db.query('DELETE FROM documents WHERE id = $1', [rawDocId]);

    // Fetch feed and check status
    const feedAfterDelete = await axios.get(`${API_BASE}/community/feed`);
    const postAfterDelete = feedAfterDelete.data.resources.find((r: any) => r.id === commId);
    assert(postAfterDelete.is_available === false, 'Resource is marked is_available = false');
    assert(postAfterDelete.study_url === null, 'Resource study_url is set to null when unavailable');
    assert(postAfterDelete.unavailable_reason !== undefined, 'unavailable_reason explains why');

    // ---------------------------------------------------------
    // TEST 8: Two-way Block Filtering (AC-D)
    // ---------------------------------------------------------
    console.log('\n--- TEST 8: Two-Way Block Filtering (AC-D) ---');
    // User A blocks User B
    await axios.post(`${API_BASE}/community/blocks/${userB.id}`, {}, { headers: userA.headers });

    // User B publishes a post
    const docB = await db.query(
      `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
       VALUES ($1, 'Tài liệu của User B', 'Nội dung', 'Khác', 'public', true, 'READY')
       RETURNING id`,
      [userB.id]
    );
    const pubB = await axios.post(`${API_BASE}/community/publish`, {
      resourceType: 'document',
      resourceId: docB.rows[0].id,
      title: 'Bài đăng từ User B bị chặn',
      category: 'Khác',
    }, { headers: userB.headers });
    const commBId = pubB.data.resource.id;

    // User A views feed -> MUST NOT see User B's post
    const feedForUserA = await axios.get(`${API_BASE}/community/feed`, { headers: userA.headers });
    assert(!feedForUserA.data.resources.some((r: any) => r.id === commBId), 'User A does NOT see blocked User B post in feed');

    // User B views feed -> MUST NOT see User A's post (two-way block)
    const feedForUserB = await axios.get(`${API_BASE}/community/feed`, { headers: userB.headers });
    assert(!feedForUserB.data.resources.some((r: any) => r.id === reshareId), 'Blocked User B does NOT see blocker User A post in feed');

    console.log('\n========================================================');
    console.log(`  🎉 ALL COMMUNITY TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('========================================================\n');
  } finally {
    // Clean up test data
    await db.query(`DELETE FROM user_blocks WHERE blocker_id IN ($1, $2, $3) OR blocked_id IN ($1, $2, $3)`, [author.id, userA.id, userB.id]);
    await db.query(`DELETE FROM community_resources WHERE user_id IN ($1, $2, $3)`, [author.id, userA.id, userB.id]);
    await db.query(`DELETE FROM documents WHERE user_id IN ($1, $2, $3)`, [author.id, userA.id, userB.id]);
    await db.query(`DELETE FROM users WHERE id IN ($1, $2, $3)`, [author.id, userA.id, userB.id]);
  }
}

runCommunityFixTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
