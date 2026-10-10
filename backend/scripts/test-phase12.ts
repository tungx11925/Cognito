import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://localhost:5000/api';

async function runPhase12Tests() {
  console.log('\n========================================================');
  console.log('         COGNITO PHASE 12: COMMUNITY TESTS             ');
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

  // Clean up any stale test users
  await db.query(`DELETE FROM users WHERE name LIKE 'P12 %' OR email LIKE '%@cognito.test'`);

  // Helper for registering test users
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

  const timestamp = Date.now();
  const user1 = await registerUser(`p12_author_${timestamp}@cognito.test`, 'P12 Author (User 1)');
  const user2 = await registerUser(`p12_learner_${timestamp}@cognito.test`, 'P12 Learner (User 2)');
  console.log(`[SETUP] Registered test users: User1=${user1.id}, User2=${user2.id}\n`);

  let docId: number;
  let quizId: number;
  let mindmapId: number;
  let deckId: number;

  let commDocId: number;
  let commQuizId: number;
  let commMindmapId: number;
  let commDeckId: number;

  try {
    // ─── SETUP PERSONAL RESOURCES FOR USER 1 ───
    // 1. Personal Document
    const docRes = await db.query(
      `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
       VALUES ($1, 'Lập trình TypeScript Nâng Cao', 'Hướng dẫn Generics và Decorators', 'Công nghệ', 'private', false, 'READY')
       RETURNING id`,
      [user1.id]
    );
    docId = docRes.rows[0].id;

    // 2. Personal Quiz (Test Set)
    const quizRes = await db.query(
      `INSERT INTO test_sets (created_by, name, status)
       VALUES ($1, 'Đề thi Trắc nghiệm React 19', 'APPROVED')
       RETURNING id`,
      [user1.id]
    );
    quizId = quizRes.rows[0].id;

    // 3. Personal Mindmap
    const mindmapRes = await db.query(
      `INSERT INTO mindmaps (user_id, document_id, title, mermaid_code, source)
       VALUES ($1, $2, 'Mindmap Cấu trúc Dữ liệu & Giải thuật', 'mindmap\n  root((DSA))', 'manual')
       RETURNING id`,
      [user1.id, docId]
    );
    mindmapId = mindmapRes.rows[0].id;

    // 4. Personal Flashcard Deck
    const deckRes = await db.query(
      `INSERT INTO flashcard_decks (user_id, name, description, visibility)
       VALUES ($1, '500 Từ vựng IELTS Chuyên sâu', 'Từ vựng band 8.0 cho Writing Task 2', 'private')
       RETURNING id`,
      [user1.id]
    );
    deckId = deckRes.rows[0].id;

    // ─── SUITE 1: Multi-Type Resource Publishing & Abstraction ───
    console.log('--- SUITE 1: Multi-Type Resource Publishing & Community Abstraction ---');
    {
      // 1.1 Publish Document
      const pubDocRes = await axios.post(
        `${API_BASE}/community/publish`,
        {
          resourceType: 'document',
          resourceId: docId,
          title: 'Lập trình TypeScript Nâng Cao (Full)',
          description: 'Cẩm nang toàn diện về TypeScript 5.x',
          category: 'Công nghệ',
          tags: ['typescript', 'javascript', 'backend'],
        },
        { headers: user1.headers }
      );
      assert(pubDocRes.status === 201, 'POST /community/publish (Document) trả về 201 Created');
      commDocId = pubDocRes.data.resource.id;
      assert(pubDocRes.data.resource.resource_type === 'document', 'Abstraction lưu đúng resource_type = document');
      assert(pubDocRes.data.resource.resource_id === docId, 'Abstraction liên kết đúng document_id');
      assert(pubDocRes.data.resource.category === 'Công nghệ', 'Category được lưu chuẩn xác');

      // Check document was synced to public & community_published
      const checkDoc = await db.query('SELECT visibility, is_community_published FROM documents WHERE id = $1', [docId]);
      assert(checkDoc.rows[0].visibility === 'public', 'Document visibility tự động chuyển thành public khi đăng cộng đồng');
      assert(checkDoc.rows[0].is_community_published === true, 'Document is_community_published = true');

      // 1.2a Chặn xuất bản bộ đề thi còn ở trạng thái DRAFT (Nguyên tắc APPROVED != public)
      const draftQuizRes = await db.query(
        `INSERT INTO test_sets (created_by, name, status)
         VALUES ($1, 'Đề thi nháp chưa duyệt React 19', 'DRAFT')
         RETURNING id`,
        [user1.id]
      );
      const draftQuizId = draftQuizRes.rows[0].id;

      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          {
            resourceType: 'test_set',
            resourceId: draftQuizId,
            title: 'Cố tình đăng đề thi nháp DRAFT',
          },
          { headers: user1.headers }
        );
        assert(false, 'Bộ đề thi DRAFT không được phép xuất bản lên Community');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Chặn xuất bản quiz DRAFT: trả về HTTP 400 Bad Request');
        assert(
          (err.response?.data?.error || '').includes('APPROVED'),
          'Thông báo lỗi chỉ rõ yêu cầu status = APPROVED'
        );
      }

      const checkDraftInFeed = await db.query(
        'SELECT id FROM community_resources WHERE resource_type = $1 AND resource_id = $2',
        ['test_set', draftQuizId]
      );
      assert(checkDraftInFeed.rows.length === 0, 'Đề thi DRAFT tuyệt đối không được ghi nhận vào community_resources');

      // 1.2b Xuất bản bộ đề thi đã duyệt (APPROVED) thành công
      const pubQuizRes = await axios.post(
        `${API_BASE}/community/publish`,
        {
          resourceType: 'test_set',
          resourceId: quizId,
          title: 'Đề thi Trắc nghiệm React 19 Chuẩn',
          description: 'Kiểm tra kiến thức Actions và Hooks mới',
          category: 'Công nghệ',
          tags: ['react', 'frontend'],
        },
        { headers: user1.headers }
      );
      assert(pubQuizRes.status === 201, 'POST /community/publish (Quiz) trả về 201 Created');
      commQuizId = pubQuizRes.data.resource.id;
      assert(pubQuizRes.data.resource.resource_type === 'test_set', 'Abstraction lưu đúng resource_type = test_set');

      // 1.3 Publish Mindmap
      const pubMindmapRes = await axios.post(
        `${API_BASE}/community/publish`,
        {
          resourceType: 'mindmap',
          resourceId: mindmapId,
          title: 'Sơ đồ DSA Toàn diện',
          description: 'Học nhanh thuật toán qua sơ đồ',
          category: 'Toán học',
          tags: ['algorithms', 'dsa'],
        },
        { headers: user1.headers }
      );
      assert(pubMindmapRes.status === 201, 'POST /community/publish (Mindmap) trả về 201 Created');
      commMindmapId = pubMindmapRes.data.resource.id;
      assert(pubMindmapRes.data.resource.resource_type === 'mindmap', 'Abstraction lưu đúng resource_type = mindmap');

      // 1.4 Publish Flashcard Deck
      const pubDeckRes = await axios.post(
        `${API_BASE}/community/publish`,
        {
          resourceType: 'flashcard_deck',
          resourceId: deckId,
          title: '500 Từ vựng IELTS Master',
          description: 'Học từ vựng qua flashcard cộng đồng',
          category: 'Ngoại ngữ',
          tags: ['ielts', 'english'],
        },
        { headers: user1.headers }
      );
      assert(pubDeckRes.status === 201, 'POST /community/publish (Flashcards) trả về 201 Created');
      commDeckId = pubDeckRes.data.resource.id;
      assert(pubDeckRes.data.resource.resource_type === 'flashcard_deck', 'Abstraction lưu đúng resource_type = flashcard_deck');
    }

    // ─── SUITE 2: Isolation: PUBLIC != PUBLISHED ───
    console.log('\n--- SUITE 2: Isolation between PUBLIC and PUBLISHED (Rule: PUBLIC != PUBLISHED) ---');
    {
      // Create a public document that is NOT community published
      const unpubDoc = await db.query(
        `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
         VALUES ($1, 'Tài liệu Xem Công khai Nhưng Không Đăng Chợ', 'Mô tả', 'Khác', 'public', false, 'READY')
         RETURNING id`,
        [user1.id]
      );
      const unpubDocId = unpubDoc.rows[0].id;

      // Verify it does NOT exist in community_resources
      const checkComm = await db.query(
        `SELECT id FROM community_resources WHERE resource_type = 'document' AND resource_id = $1`,
        [unpubDocId]
      );
      assert(checkComm.rows.length === 0, 'Tài liệu có visibility = public KHÔNG tự động xuất hiện trong community_resources');

      // Feed check: unpubDoc should not be in community feed
      const feedRes = await axios.get(`${API_BASE}/community/feed?search=Không+Đăng+Chợ`);
      assert(feedRes.data.resources.length === 0, 'Feed cộng đồng tuyệt đối không chứa tài liệu chưa được publish rõ ràng');
    }

    // ─── SUITE 3: Community Feed Querying & Filtering ───
    console.log('\n--- SUITE 3: Community Feed Querying & Filters (Recent, Popular, Search, Category, Type) ---');
    {
      // 3.1 Tab Recent
      const recentFeed = await axios.get(`${API_BASE}/community/feed?tab=recent`);
      assert(recentFeed.status === 200, 'GET /community/feed?tab=recent trả về 200 OK');
      assert(recentFeed.data.resources.length >= 4, 'Bảng tin trả về ít nhất 4 tài nguyên vừa đăng');
      assert(recentFeed.data.resources[0].author_name === user1.name, 'Thông tin tác giả được join chính xác');

      // 3.2 Filter by Type: quiz only
      const quizFeed = await axios.get(`${API_BASE}/community/feed?type=test_set`);
      assert(quizFeed.data.resources.every((r: any) => r.resource_type === 'test_set'), 'Filter type=test_set chỉ trả về các bài quiz');

      // 3.3 Filter by Category: Ngoại ngữ
      const langFeed = await axios.get(`${API_BASE}/community/feed?category=Ngoại ngữ`);
      assert(langFeed.data.resources.every((r: any) => r.category === 'Ngoại ngữ'), 'Filter category=Ngoại ngữ lọc chuẩn xác');

      // 3.4 Search filter
      const searchFeed = await axios.get(`${API_BASE}/community/feed?search=TypeScript`);
      assert(searchFeed.data.resources.length >= 1, 'Search từ khóa "TypeScript" tìm thấy tài liệu phù hợp');
      assert(searchFeed.data.resources[0].title.includes('TypeScript'), 'Tiêu đề kết quả tìm kiếm khớp từ khóa');
    }

    // ─── SUITE 4: Study Flow & Direct Target Routing ───
    console.log('\n--- SUITE 4: Study Flow & Direct Target Routing (View, Like, Comment) ---');
    {
      // 4.1 Resource Detail & Study Target
      const detailRes = await axios.get(`${API_BASE}/community/resources/${commDocId}`, {
        headers: user2.headers,
      });
      assert(detailRes.status === 200, 'GET /community/resources/:id trả về 200 OK');
      assert(detailRes.data.resource.study_url === `/viewer/${docId}`, 'study_url trỏ chính xác tới trình đọc tài liệu /viewer/:id');
      assert(Number(detailRes.data.resource.view_count) >= 1, 'Số lượt xem tăng lên sau khi mở xem chi tiết');

      // Check quiz study_url
      const quizDetail = await axios.get(`${API_BASE}/community/resources/${commQuizId}`);
      assert(quizDetail.data.resource.study_url === `/quiz/${quizId}`, 'study_url của quiz trỏ chính xác tới /quiz/:id');

      // Check mindmap study_url
      const mindmapDetail = await axios.get(`${API_BASE}/community/resources/${commMindmapId}`);
      assert(mindmapDetail.data.resource.study_url === `/mindmap?id=${mindmapId}`, 'study_url của mindmap trỏ chính xác tới /mindmap?id=:id');

      // 4.2 Toggle Like
      const likeRes1 = await axios.post(`${API_BASE}/community/resources/${commDocId}/like`, {}, { headers: user2.headers });
      assert(likeRes1.data.liked === true, 'User 2 thích tài nguyên -> liked = true');
      assert(likeRes1.data.like_count === 1, 'Số lượt thích tăng lên 1');

      // Detail check has_liked
      const checkLiked = await axios.get(`${API_BASE}/community/resources/${commDocId}`, { headers: user2.headers });
      assert(checkLiked.data.resource.has_liked === true, 'Chi tiết tài nguyên trả về has_liked = true cho User 2');

      // Toggle Like again -> Unlike
      const likeRes2 = await axios.post(`${API_BASE}/community/resources/${commDocId}/like`, {}, { headers: user2.headers });
      assert(likeRes2.data.liked === false, 'User 2 bỏ thích tài nguyên -> liked = false');
      assert(likeRes2.data.like_count === 0, 'Số lượt thích giảm về 0');

      // Re-like for popularity test later
      await axios.post(`${API_BASE}/community/resources/${commDocId}/like`, {}, { headers: user2.headers });

      // 4.3 Comments
      const commentRes = await axios.post(
        `${API_BASE}/community/resources/${commDocId}/comments`,
        { content: 'Tài liệu rất bổ ích, cảm ơn tác giả!' },
        { headers: user2.headers }
      );
      assert(commentRes.status === 201, 'POST /comments trả về 201 Created');
      const commentId = commentRes.data.comment.id;
      assert(commentRes.data.comment.author_name === user2.name, 'Tên người bình luận được gắn chuẩn xác');

      // Nested reply
      const replyRes = await axios.post(
        `${API_BASE}/community/resources/${commDocId}/comments`,
        { content: 'Cảm ơn bạn đã ủng hộ!', parentId: commentId },
        { headers: user1.headers }
      );
      assert(replyRes.status === 201, 'Tác giả trả lời bình luận thành công (nested reply)');
      assert(replyRes.data.comment.parent_id === commentId, 'parent_id liên kết đúng bình luận cha');

      // List comments
      const listCommentsRes = await axios.get(`${API_BASE}/community/resources/${commDocId}/comments`);
      assert(listCommentsRes.data.comments.length === 2, 'Danh sách trả về đủ 2 bình luận');
    }

    // ─── SUITE 5: Save Reference & Zero Data Duplication ───
    console.log('\n--- SUITE 5: Save Reference & Zero Data Duplication ---');
    {
      const initialDocCount = (await db.query('SELECT COUNT(*)::int as count FROM documents WHERE user_id = $1', [user2.id])).rows[0].count;

      // User 2 saves User 1's community resource
      const saveRes = await axios.post(`${API_BASE}/community/resources/${commDocId}/save`, {}, { headers: user2.headers });
      assert(saveRes.status === 200, 'POST /resources/:id/save trả về 200 OK');
      assert(saveRes.data.saved === true, 'saved = true');
      assert(saveRes.data.save_count === 1, 'save_count của community_resources tăng lên 1');

      // Verify ZERO DATA DUPLICATION
      const afterDocCount = (await db.query('SELECT COUNT(*)::int as count FROM documents WHERE user_id = $1', [user2.id])).rows[0].count;
      assert(initialDocCount === afterDocCount, 'Lưu tài nguyên KHÔNG sao chép hay duplicate bản ghi vào bảng documents');

      // Verify reference in community_saves
      const saveDbCheck = await db.query(
        'SELECT * FROM community_saves WHERE resource_id = $1 AND user_id = $2',
        [commDocId, user2.id]
      );
      assert(saveDbCheck.rows.length === 1, 'Bản ghi tham chiếu được lưu chính xác trong community_saves');

      // Retrieve via Saved Tab
      const savedFeed = await axios.get(`${API_BASE}/community/feed?tab=saved`, { headers: user2.headers });
      assert(savedFeed.data.resources.length >= 1, 'Tab Saved trả về tài nguyên đã lưu');
      assert(savedFeed.data.resources[0].id === commDocId, 'Tài nguyên trong tab Saved khớp đúng ID đã lưu');
      assert(savedFeed.data.resources[0].has_saved === true, 'has_saved = true');
    }

    // ─── SUITE 6: Graceful Handling of Deleted Original Resources (UNAVAILABLE Policy) ───
    console.log('\n--- SUITE 6: Graceful Handling of Deleted Original Resources (UNAVAILABLE Policy) ---');
    {
      // Create a temporary document and publish it
      const tempDoc = await db.query(
        `INSERT INTO documents (user_id, title, description, category, visibility, is_community_published, status)
         VALUES ($1, 'Tài liệu Sắp Bị Xóa', 'Mô tả tạm', 'Khác', 'public', true, 'READY')
         RETURNING id`,
        [user1.id]
      );
      const tempDocId = tempDoc.rows[0].id;

      const pubTempRes = await axios.post(
        `${API_BASE}/community/publish`,
        {
          resourceType: 'document',
          resourceId: tempDocId,
          title: 'Tài liệu Sắp Bị Xóa (Community)',
        },
        { headers: user1.headers }
      );
      const commTempId = pubTempRes.data.resource.id;

      // User 2 saves it
      await axios.post(`${API_BASE}/community/resources/${commTempId}/save`, {}, { headers: user2.headers });

      // Author deletes the original document
      await db.query('DELETE FROM documents WHERE id = $1', [tempDocId]);

      // Query community detail for deleted resource
      const detailRes = await axios.get(`${API_BASE}/community/resources/${commTempId}`, { headers: user2.headers });
      assert(detailRes.status === 200, 'Endpoint GET /resources/:id KHÔNG bị crash khi tài liệu gốc bị xóa');
      assert(detailRes.data.resource.is_available === false, 'is_available trả về false');
      assert(detailRes.data.resource.status === 'UNAVAILABLE', 'Trạng thái chuyển thành UNAVAILABLE rõ ràng');
      assert(detailRes.data.resource.study_url === null, 'study_url trả về null khi tài liệu gốc không còn');

      // Query feed
      const feedRes = await axios.get(`${API_BASE}/community/feed?search=Sắp+Bị+Xóa`);
      assert(feedRes.data.resources.length >= 1, 'Bảng tin vẫn trả về tài nguyên');
      assert(feedRes.data.resources[0].status === 'UNAVAILABLE', 'Feed gắn cờ status = UNAVAILABLE cho client hiển thị cảnh báo');

      // Cleanup temp post
      await db.query('DELETE FROM community_resources WHERE id = $1', [commTempId]);
    }

    // ─── SUITE 7: Reshare with Strict Attribution ───
    console.log('\n--- SUITE 7: Reshare with Strict Attribution (Original Author, Original Post, Reshared By) ---');
    {
      // User 2 reshares User 1's TypeScript document
      const reshareRes = await axios.post(
        `${API_BASE}/community/resources/${commDocId}/reshare`,
        { reshareNote: 'Tài liệu này giải thích Generics cực kỳ dễ hiểu, mọi người nên xem!' },
        { headers: user2.headers }
      );
      assert(reshareRes.status === 201, 'POST /resources/:id/reshare trả về 201 Created');
      const reshareId = reshareRes.data.resource.id;
      assert(reshareRes.data.resource.is_reshare === true, 'is_reshare = true');
      assert(reshareRes.data.resource.user_id === user2.id, 'Người chia sẻ lại (Reshared By) là User 2');
      assert(reshareRes.data.resource.original_author_id === user1.id, 'Tác giả gốc (Original Author) giữ nguyên User 1');
      assert(reshareRes.data.resource.original_resource_id === commDocId, 'Bài đăng gốc (Original Post) trỏ đúng commDocId');
      assert(reshareRes.data.resource.reshare_note.includes('Generics'), 'Ghi chú chia sẻ lại được lưu trọn vẹn');

      // Feed check for reshare attribution
      const reshareDetail = await axios.get(`${API_BASE}/community/resources/${reshareId}`);
      assert(reshareDetail.data.resource.author_name === user2.name, 'author_name thể hiện người chia sẻ lại');
      assert(reshareDetail.data.resource.original_author_name === user1.name, 'original_author_name thể hiện tác giả gốc');
      assert(reshareDetail.data.resource.original_resource_title.includes('TypeScript'), 'Tiêu đề bài gốc được trích dẫn chính xác');

      // Duplicate reshare prevention
      try {
        await axios.post(
          `${API_BASE}/community/resources/${commDocId}/reshare`,
          { reshareNote: 'Chia sẻ lại lần 2' },
          { headers: user2.headers }
        );
        assert(false, 'Không được phép chia sẻ lại trùng lặp cùng 1 tài nguyên');
      } catch (err: any) {
        assert(err.response?.status === 400, 'Chia sẻ lại trùng lặp bị từ chối với HTTP 400 Bad Request');
      }

      // Multi-tier Reshare Attribution Chain: User 1 (Original) -> User 2 (Reshare 1) -> User 3 (Reshare 2)
      const user3 = await registerUser(`p12_resharer3_${timestamp}@cognito.test`, 'P12 Multi-tier Resharer (User 3)');
      const multiReshareRes = await axios.post(
        `${API_BASE}/community/resources/${reshareId}/reshare`,
        { reshareNote: 'User 3 chia sẻ lại bài đã được User 2 chia sẻ' },
        { headers: user3.headers }
      );
      assert(multiReshareRes.status === 201, 'User 3 chia sẻ lại một bài đã reshare thành công (HTTP 201 Created)');
      const multiReshareId = multiReshareRes.data.resource.id;

      // Verify detail of User 3's multi-tier reshare
      const multiDetail = await axios.get(`${API_BASE}/community/resources/${multiReshareId}`, {
        headers: user3.headers,
      });
      const multiData = multiDetail.data.resource;
      assert(multiData.is_reshare === true, 'is_reshare = true cho bài đăng của User 3');
      assert(multiData.author_name === user3.name, 'author_name thể hiện đúng User 3');
      assert(
        multiData.original_author_id === user1.id,
        'original_author_id bảo toàn User 1 nguyên thủy (KHÔNG bị trôi thành User 2)'
      );
      assert(
        multiData.original_author_name === user1.name,
        'original_author_name bảo toàn User 1 nguyên thủy qua chuỗi nhiều tầng reshare'
      );
      assert(
        multiData.original_resource_id === commDocId,
        'original_resource_id trỏ chính xác về bài đăng gốc của User 1 (không trỏ về bài của User 2)'
      );
    }

    // ─── SUITE 8: IDOR & Authorization Controls (All 4 Resource Types) ───
    console.log('\n--- SUITE 8: IDOR & Authorization Controls (All 4 Resource Types) ---');
    {
      // 8.1 Chặn IDOR Publish trên toàn bộ 4 loại tài nguyên: User 2 cố tình đăng tài sản của User 1
      // 8.1.1 Document
      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'document', resourceId: docId, title: 'Hacked Doc' },
          { headers: user2.headers }
        );
        assert(false, 'User 2 không được phép đăng document của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Publish Document: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.1.2 Test Set (Quiz)
      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'test_set', resourceId: quizId, title: 'Hacked Quiz' },
          { headers: user2.headers }
        );
        assert(false, 'User 2 không được phép đăng quiz của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Publish Test Set: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.1.3 Mindmap
      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'mindmap', resourceId: mindmapId, title: 'Hacked Mindmap' },
          { headers: user2.headers }
        );
        assert(false, 'User 2 không được phép đăng mindmap của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Publish Mindmap: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.1.4 Flashcard Deck
      try {
        await axios.post(
          `${API_BASE}/community/publish`,
          { resourceType: 'flashcard_deck', resourceId: deckId, title: 'Hacked Deck' },
          { headers: user2.headers }
        );
        assert(false, 'User 2 không được phép đăng flashcard deck của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Publish Flashcards: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.2 Chặn IDOR Unpublish trên toàn bộ các tài nguyên cộng đồng đã đăng của User 1
      // 8.2.1 Unpublish Document
      try {
        await axios.delete(`${API_BASE}/community/resources/${commDocId}`, { headers: user2.headers });
        assert(false, 'User 2 không được phép gỡ Document của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Unpublish Document: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.2.2 Unpublish Quiz
      try {
        await axios.delete(`${API_BASE}/community/resources/${commQuizId}`, { headers: user2.headers });
        assert(false, 'User 2 không được phép gỡ Quiz của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Unpublish Quiz: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.2.3 Unpublish Mindmap
      try {
        await axios.delete(`${API_BASE}/community/resources/${commMindmapId}`, { headers: user2.headers });
        assert(false, 'User 2 không được phép gỡ Mindmap của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Unpublish Mindmap: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.2.4 Unpublish Flashcard Deck
      try {
        await axios.delete(`${API_BASE}/community/resources/${commDeckId}`, { headers: user2.headers });
        assert(false, 'User 2 không được phép gỡ Flashcards của User 1');
      } catch (err: any) {
        assert(err.response?.status === 403, 'Chặn IDOR Unpublish Flashcards: User 2 bị từ chối với HTTP 403 Forbidden');
      }

      // 8.3 Unauthenticated publish attempt
      try {
        await axios.post(`${API_BASE}/community/publish`, {
          resourceType: 'document',
          resourceId: docId,
          title: 'Guest post',
        });
        assert(false, 'Guest không được phép publish');
      } catch (err: any) {
        assert(err.response?.status === 401, 'Khách vãng lai đăng bài bị từ chối với HTTP 401 Unauthorized');
      }

      // 8.4 Author unpublishes successfully
      const unpubRes = await axios.delete(`${API_BASE}/community/resources/${commDocId}`, {
        headers: user1.headers,
      });
      assert(unpubRes.status === 200, 'Chủ sở hữu gỡ bài đăng thành công (HTTP 200 OK)');

      // Verify document is_community_published updated back to false
      const docCheck = await db.query('SELECT is_community_published FROM documents WHERE id = $1', [docId]);
      assert(docCheck.rows[0].is_community_published === false, 'Tài liệu tự động đánh dấu is_community_published = false khi bài đăng bị gỡ');
    }

    console.log('\n========================================================');
    console.log(`    ✅ ALL PHASE 12 INTEGRATION TESTS PASSED (${passedTests}/${totalTests})     `);
    console.log('========================================================\n');
  } catch (error: any) {
    console.error('\n❌ TEST RUN FAILED:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  } finally {
    // Cleanup test data
    await db.query('DELETE FROM users WHERE email LIKE $1', [`%@cognito.test`]);
  }
}

runPhase12Tests().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
