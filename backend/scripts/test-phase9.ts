import axios from 'axios';
import { db } from '../src/db';

const API_BASE = 'http://127.0.0.1:5000/api';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`\x1b[31m  [FAIL] ${message}\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m  [PASS] ${message}\x1b[0m`);
  }
}

async function runPhase9Tests() {
  console.log('========================================================');
  console.log(' COGNITO PHASE 9: STUDY SYSTEM & FLASHCARDS WORKSPACE  ');
  console.log('========================================================\n');

  let testUserAId: number | null = null;
  let testUserBId: number | null = null;
  let testDocId: number | null = null;
  let standaloneNoteId: number | null = null;
  let attachedNoteId: number | null = null;
  let standaloneMindmapId: number | null = null;
  let attachedMindmapId: number | null = null;
  let testDeckId: number | null = null;
  let testCardId: number | null = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // Setup test users & test documents
    // ─────────────────────────────────────────────────────────────
    await db.query(
      `DELETE FROM users WHERE email IN ('phase9_userA@example.com', 'phase9_userB@example.com') OR phone IN ('0987659001', '0987659002')`
    );

    const regA = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase9_userA@example.com',
      password: 'Password123!',
      name: 'Phase9 User A',
      phone: '0987659001',
    });
    const tokenA = regA.data.accessToken || regA.data.token;
    testUserAId = regA.data.user.id;
    const headersA = { Authorization: `Bearer ${tokenA}` };

    const regB = await axios.post(`${API_BASE}/auth/register`, {
      email: 'phase9_userB@example.com',
      password: 'Password123!',
      name: 'Phase9 User B',
      phone: '0987659002',
    });
    const tokenB = regB.data.accessToken || regB.data.token;
    testUserBId = regB.data.user.id;
    const headersB = { Authorization: `Bearer ${tokenB}` };

    console.log(`[Setup] User A ID: ${testUserAId}, User B ID: ${testUserBId}`);

    // Create a document belonging to User A
    const docRes = await db.query(
      `INSERT INTO documents (user_id, title, description, doc_url, category)
       VALUES ($1, 'Giáo trình Giải tích 1 & Vi phân nâng cao', 'Tài liệu toán đại học', 'https://example.com/math.pdf', 'Toán học')
       RETURNING id`,
      [testUserAId]
    );
    testDocId = docRes.rows[0].id;
    console.log(`[Setup] Created Test Document ID: ${testDocId}\n`);

    // ─────────────────────────────────────────────────────────────
    // SUITE 1: Notes System — Complete Lifecycle & Attachment
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Notes System (CRUD, Search, Document Attachment) ---');

    // 1.1 Create standalone note
    const createNote1 = await axios.post(
      `${API_BASE}/notes`,
      {
        title: 'Ghi chú độc lập về Phương pháp học Pomodoro',
        content: 'Học 25 phút, nghỉ 5 phút. Sau 4 chu kỳ thì nghỉ 20 phút.',
        document_id: null,
      },
      { headers: headersA }
    );
    assert(createNote1.status === 201, '1.1 Tạo ghi chú độc lập thành công (HTTP 201)');
    assert(createNote1.data.note.document_id === null, '1.1 Ghi chú độc lập có document_id = null');
    assert(createNote1.data.note.title.includes('Pomodoro'), '1.1 Tiêu đề ghi chú chính xác');
    standaloneNoteId = createNote1.data.note.id;

    // 1.2 Create attached note
    const createNote2 = await axios.post(
      `${API_BASE}/notes`,
      {
        title: 'Công thức đạo hàm hàm hợp và định lý Fermat',
        content: 'Đạo hàm của f(g(x)) = f\'(g(x)) * g\'(x). Cực trị hàm số xảy ra khi f\'(x) = 0.',
        document_id: testDocId,
      },
      { headers: headersA }
    );
    assert(createNote2.status === 201, '1.2 Tạo ghi chú gắn với tài liệu thành công (HTTP 201)');
    assert(createNote2.data.note.document_id === testDocId, '1.2 document_id được liên kết chuẩn xác');
    assert(createNote2.data.note.document_title.includes('Giải tích 1'), '1.2 Trả về document_title của tài liệu');
    attachedNoteId = createNote2.data.note.id;

    // 1.3 Validation: Note with empty content
    let emptyContentBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/notes`,
        { title: 'Tiêu đề hợp lệ', content: '   ' },
        { headers: headersA }
      );
    } catch (err: any) {
      emptyContentBlocked = err.response?.status === 400;
    }
    assert(emptyContentBlocked, '1.3 Chặn tạo ghi chú khi nội dung rỗng (HTTP 400 Bad Request)');

    // 1.4 Validation: Attach to non-existent document
    let invalidDocBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/notes`,
        { title: 'Ghi chú sai doc', content: 'Nội dung', document_id: 999999 },
        { headers: headersA }
      );
    } catch (err: any) {
      invalidDocBlocked = err.response?.status === 404;
    }
    assert(invalidDocBlocked, '1.4 Chặn gắn ghi chú vào tài liệu không tồn tại (HTTP 404 Not Found)');

    // 1.5 List notes with search query ?q=
    const searchRes = await axios.get(`${API_BASE}/notes?q=Pomodoro`, { headers: headersA });
    assert(searchRes.status === 200, '1.5 Tìm kiếm ghi chú thành công');
    assert(
      searchRes.data.notes.some((n: any) => n.id === standaloneNoteId) &&
      !searchRes.data.notes.some((n: any) => n.id === attachedNoteId),
      '1.5 Bộ lọc tìm kiếm theo từ khóa q= lọc chính xác ghi chú tương ứng'
    );

    // 1.6 Filter notes by document_id
    const filterDocRes = await axios.get(`${API_BASE}/notes?document_id=${testDocId}`, { headers: headersA });
    assert(
      filterDocRes.data.notes.length === 1 && filterDocRes.data.notes[0].id === attachedNoteId,
      '1.6 Bộ lọc ?document_id= trả về đúng các ghi chú thuộc tài liệu đó'
    );

    // 1.7 Backward compatibility endpoint: GET /notes/document/:docId
    const compatRes = await axios.get(`${API_BASE}/notes/document/${testDocId}`, { headers: headersA });
    assert(
      Array.isArray(compatRes.data) && compatRes.data[0].id === attachedNoteId,
      '1.7 Endpoint tương thích ngược /notes/document/:docId hoạt động trơn tru'
    );

    // 1.8 Update note: Change title, content, attach to document
    const updateRes = await axios.put(
      `${API_BASE}/notes/${standaloneNoteId}`,
      {
        title: 'Kỹ thuật Pomodoro bản nâng cao (2026)',
        content: 'Nội dung cập nhật: Nghỉ dài 30 phút sau 4 phiên làm việc.',
        document_id: testDocId, // Chuyển từ độc lập sang gắn tài liệu
      },
      { headers: headersA }
    );
    assert(updateRes.status === 200, '1.8 Cập nhật ghi chú thành công (HTTP 200)');
    assert(updateRes.data.note.title.includes('nâng cao'), '1.8 Tiêu đề được cập nhật');
    assert(updateRes.data.note.document_id === testDocId, '1.8 Gắn ghi chú vào tài liệu thành công qua lệnh update');

    // 1.9 Delete note
    const deleteRes = await axios.delete(`${API_BASE}/notes/${standaloneNoteId}`, { headers: headersA });
    assert(deleteRes.status === 200, '1.9 Xóa ghi chú thành công (HTTP 200)');
    const checkDeleted = await db.query('SELECT * FROM notes WHERE id = $1', [standaloneNoteId]);
    assert(checkDeleted.rows.length === 0, '1.9 Ghi chú đã thực sự được xóa khỏi CSDL\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 2: Notes Access Control & Anti-IDOR Security
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 2: Notes Access Control & Anti-IDOR Security ---');

    // 2.1 User B tries to view User A's attached note
    let bViewBlocked = false;
    try {
      await axios.get(`${API_BASE}/notes/${attachedNoteId}`, { headers: headersB });
    } catch (err: any) {
      bViewBlocked = err.response?.status === 403;
    }
    assert(bViewBlocked, '2.1 Chặn User B xem ghi chú của User A (HTTP 403 Forbidden)');

    // 2.2 User B tries to edit User A's attached note
    let bEditBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/notes/${attachedNoteId}`,
        { content: 'Hacker sửa nội dung' },
        { headers: headersB }
      );
    } catch (err: any) {
      bEditBlocked = err.response?.status === 403;
    }
    assert(bEditBlocked, '2.2 Chặn User B sửa ghi chú của User A (HTTP 403 Forbidden)');

    // 2.3 User B tries to delete User A's attached note
    let bDeleteBlocked = false;
    try {
      await axios.delete(`${API_BASE}/notes/${attachedNoteId}`, { headers: headersB });
    } catch (err: any) {
      bDeleteBlocked = err.response?.status === 403;
    }
    assert(bDeleteBlocked, '2.3 Chặn User B xóa ghi chú của User A (HTTP 403 Forbidden)');

    // 2.4 Access non-existent note
    let notFoundBlocked = false;
    try {
      await axios.get(`${API_BASE}/notes/999999`, { headers: headersA });
    } catch (err: any) {
      notFoundBlocked = err.response?.status === 404;
    }
    assert(notFoundBlocked, '2.4 Trả về HTTP 404 khi truy cập ghi chú không tồn tại');

    // 2.5 Foreign Key IDOR: User B tạo note gắn document_id riêng tư của User A
    let bCreateAttachPrivateDocBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/notes`,
        {
          title: 'Ghi chú nghe lén của User B',
          content: 'Cố tình lấy document_title của User A qua foreign key',
          document_id: testDocId,
        },
        { headers: headersB }
      );
    } catch (err: any) {
      bCreateAttachPrivateDocBlocked = err.response?.status === 403;
    }
    assert(
      bCreateAttachPrivateDocBlocked,
      '2.5 [IDOR Khóa ngoại] Chặn User B tạo note gắn vào document riêng tư của User A (HTTP 403 Forbidden)'
    );

    // 2.6 Foreign Key IDOR: User B sửa note của mình để gắn document_id riêng tư của User A
    const bNoteRes = await axios.post(
      `${API_BASE}/notes`,
      { title: 'Note hợp lệ của B', content: 'Nội dung của B' },
      { headers: headersB }
    );
    const bNoteId = bNoteRes.data.note.id;

    let bUpdateAttachPrivateDocBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/notes/${bNoteId}`,
        { document_id: testDocId },
        { headers: headersB }
      );
    } catch (err: any) {
      bUpdateAttachPrivateDocBlocked = err.response?.status === 403;
    }
    assert(
      bUpdateAttachPrivateDocBlocked,
      '2.6 [IDOR Khóa ngoại] Chặn User B sửa note để gắn vào document riêng tư của User A (HTTP 403 Forbidden)\n'
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 3: Mindmap System (CRUD, Document Attachment, Search)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 3: Mindmap System (CRUD, Document Attachment, Search) ---');

    // 3.1 Create standalone mindmap
    const createMm1 = await axios.post(
      `${API_BASE}/mindmaps`,
      {
        title: 'Sơ đồ tư duy Cấu trúc dữ liệu và Giải thuật',
        mermaid_code: `mindmap\n  root((DSA))\n    Array\n    LinkedList\n    Trees\n      BST\n      AVL`,
        document_id: null,
      },
      { headers: headersA }
    );
    assert(createMm1.status === 201, '3.1 Tạo sơ đồ tư duy độc lập thành công (HTTP 201)');
    assert(createMm1.data.mindmap.document_id === null, '3.1 Sơ đồ độc lập có document_id = null');
    assert(createMm1.data.mindmap.mermaid_code.includes('root((DSA))'), '3.1 Mã Mermaid được lưu trữ chính xác');
    standaloneMindmapId = createMm1.data.mindmap.id;

    // 3.2 Create document-attached mindmap
    const createMm2 = await axios.post(
      `${API_BASE}/mindmaps`,
      {
        title: 'Sơ đồ phân nhánh Giải tích 1',
        mermaid_code: `mindmap\n  root((Giải tích 1))\n    Giới hạn\n    Đạo hàm\n    Tích phân`,
        document_id: testDocId,
      },
      { headers: headersA }
    );
    assert(createMm2.status === 201, '3.2 Tạo sơ đồ tư duy gắn với tài liệu thành công (HTTP 201)');
    assert(createMm2.data.mindmap.document_id === testDocId, '3.2 document_id được gắn kết chuẩn');
    assert(createMm2.data.mindmap.document_title.includes('Giải tích 1'), '3.2 Trả về document_title đi kèm');
    attachedMindmapId = createMm2.data.mindmap.id;

    // 3.3 Validation: Empty mermaid_code
    let emptyMmBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/mindmaps`,
        { title: 'Sơ đồ rỗng', mermaid_code: '   ' },
        { headers: headersA }
      );
    } catch (err: any) {
      emptyMmBlocked = err.response?.status === 400;
    }
    assert(emptyMmBlocked, '3.3 Chặn tạo sơ đồ tư duy khi mã Mermaid rỗng (HTTP 400 Bad Request)');

    // 3.4 Search & Filter Mindmaps
    const searchMm = await axios.get(`${API_BASE}/mindmaps?q=DSA`, { headers: headersA });
    assert(
      searchMm.data.mindmaps.some((m: any) => m.id === standaloneMindmapId) &&
      !searchMm.data.mindmaps.some((m: any) => m.id === attachedMindmapId),
      '3.4 Tìm kiếm sơ đồ tư duy theo tiêu đề ?q= hoạt động chuẩn xác'
    );

    const docMm = await axios.get(`${API_BASE}/mindmaps?document_id=${testDocId}`, { headers: headersA });
    assert(
      docMm.data.mindmaps.length === 1 && docMm.data.mindmaps[0].id === attachedMindmapId,
      '3.4 Lọc sơ đồ tư duy theo ?document_id= trả về đúng sơ đồ gắn tài liệu'
    );

    // 3.5 Update mindmap
    const updateMm = await axios.put(
      `${API_BASE}/mindmaps/${standaloneMindmapId}`,
      {
        title: 'Sơ đồ DSA nâng cao',
        mermaid_code: `mindmap\n  root((DSA Nâng cao))\n    Graph\n      BFS\n      DFS`,
      },
      { headers: headersA }
    );
    assert(updateMm.status === 200, '3.5 Cập nhật sơ đồ tư duy thành công (HTTP 200)');
    assert(updateMm.data.mindmap.title === 'Sơ đồ DSA nâng cao', '3.5 Tiêu đề cập nhật thành công');
    assert(updateMm.data.mindmap.mermaid_code.includes('Graph'), '3.5 Mã Mermaid mới đã được lưu');

    // 3.6 Delete mindmap
    const delMm = await axios.delete(`${API_BASE}/mindmaps/${standaloneMindmapId}`, { headers: headersA });
    assert(delMm.status === 200, '3.6 Xóa sơ đồ tư duy thành công (HTTP 200)');
    const checkMmDel = await db.query('SELECT * FROM mindmaps WHERE id = $1', [standaloneMindmapId]);
    assert(checkMmDel.rows.length === 0, '3.6 Sơ đồ tư duy đã thực sự được xóa khỏi CSDL\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 4: Mindmap Access Control & Anti-IDOR Security
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 4: Mindmap Access Control & Anti-IDOR Security ---');

    // 4.1 User B tries to view User A's mindmap
    let bViewMmBlocked = false;
    try {
      await axios.get(`${API_BASE}/mindmaps/${attachedMindmapId}`, { headers: headersB });
    } catch (err: any) {
      bViewMmBlocked = err.response?.status === 403;
    }
    assert(bViewMmBlocked, '4.1 Chặn User B xem sơ đồ tư duy của User A (HTTP 403 Forbidden)');

    // 4.2 User B tries to edit User A's mindmap
    let bEditMmBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/mindmaps/${attachedMindmapId}`,
        { title: 'Hacked Mindmap' },
        { headers: headersB }
      );
    } catch (err: any) {
      bEditMmBlocked = err.response?.status === 403;
    }
    assert(bEditMmBlocked, '4.2 Chặn User B chỉnh sửa sơ đồ tư duy của User A (HTTP 403 Forbidden)');

    // 4.3 User B tries to delete User A's mindmap
    let bDeleteMmBlocked = false;
    try {
      await axios.delete(`${API_BASE}/mindmaps/${attachedMindmapId}`, { headers: headersB });
    } catch (err: any) {
      bDeleteMmBlocked = err.response?.status === 403;
    }
    assert(bDeleteMmBlocked, '4.3 Chặn User B xóa sơ đồ tư duy của User A (HTTP 403 Forbidden)');

    // 4.4 Non-existent mindmap
    let notFoundMmBlocked = false;
    try {
      await axios.get(`${API_BASE}/mindmaps/999999`, { headers: headersA });
    } catch (err: any) {
      notFoundMmBlocked = err.response?.status === 404;
    }
    assert(notFoundMmBlocked, '4.4 Trả về HTTP 404 khi truy cập sơ đồ không tồn tại');

    // 4.5 Foreign Key IDOR: User B tạo mindmap gắn document_id riêng tư của User A
    let bCreateMmAttachPrivateDocBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/mindmaps`,
        {
          title: 'Sơ đồ nghe lén của User B',
          mermaid_code: 'mindmap\n  root((Hacked))',
          document_id: testDocId,
        },
        { headers: headersB }
      );
    } catch (err: any) {
      bCreateMmAttachPrivateDocBlocked = err.response?.status === 403;
    }
    assert(
      bCreateMmAttachPrivateDocBlocked,
      '4.5 [IDOR Khóa ngoại] Chặn User B tạo mindmap gắn vào document riêng tư của User A (HTTP 403 Forbidden)'
    );

    // 4.6 Foreign Key IDOR: User B sửa mindmap của mình để gắn document_id riêng tư của User A
    const bMmRes = await axios.post(
      `${API_BASE}/mindmaps`,
      { title: 'Mindmap hợp lệ của B', mermaid_code: 'mindmap\n  root((Valid B))' },
      { headers: headersB }
    );
    const bMmId = bMmRes.data.mindmap.id;

    let bUpdateMmAttachPrivateDocBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/mindmaps/${bMmId}`,
        { document_id: testDocId },
        { headers: headersB }
      );
    } catch (err: any) {
      bUpdateMmAttachPrivateDocBlocked = err.response?.status === 403;
    }
    assert(
      bUpdateMmAttachPrivateDocBlocked,
      '4.6 [IDOR Khóa ngoại] Chặn User B sửa mindmap để gắn vào document riêng tư của User A (HTTP 403 Forbidden)\n'
    );

    // ─────────────────────────────────────────────────────────────
    // SUITE 5: Flashcard System (Manual Creation, Deck CRUD, NO AI)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 5: Flashcard System (Manual Creation, Deck CRUD, NO AI) ---');

    // 5.1 Create Deck
    const createDeckRes = await axios.post(
      `${API_BASE}/flashcards/decks`,
      {
        name: 'Bộ thẻ Từ vựng Chuyên ngành Kỹ thuật phần mềm',
        description: 'Tổng hợp thuật ngữ lập trình và kiến trúc hệ thống',
        is_public: false,
      },
      { headers: headersA }
    );
    assert(createDeckRes.status === 201, '5.1 Tạo bộ thẻ Flashcard thành công (HTTP 201)');
    testDeckId = createDeckRes.data.id;

    // 5.2 Manual Create Flashcard (No AI generation)
    const createCardRes = await axios.post(
      `${API_BASE}/flashcards`,
      {
        deck_id: testDeckId,
        front: 'Idempotency trong thiết kế REST API là gì?',
        back: 'Là tính chất mà khi một thao tác được thực hiện nhiều lần liên tiếp, kết quả trả về và trạng thái hệ thống vẫn không thay đổi so với thực hiện 1 lần duy nhất (ví dụ: PUT, DELETE).',
        document_id: testDocId,
      },
      { headers: headersA }
    );
    assert(createCardRes.status === 201, '5.2 Tạo thẻ Flashcard thủ công thành công (Không sinh AI)');
    assert(createCardRes.data.ease_factor === 2.5, '5.2 Ease factor ban đầu mặc định là 2.5');
    assert(createCardRes.data.repetitions === 0, '5.2 Số lần lặp lại repetitions ban đầu là 0');
    assert(createCardRes.data.interval_days === 0, '5.2 Khoảng cách ngày interval_days ban đầu là 0');
    testCardId = createCardRes.data.id;

    // 5.3 Edit Flashcard
    const editCardRes = await axios.put(
      `${API_BASE}/flashcards/${testCardId}`,
      {
        front: 'Idempotency trong REST API là gì? (Cập nhật)',
        back: 'Thao tác nhiều lần cho cùng một kết quả trạng thái hệ thống.',
      },
      { headers: headersA }
    );
    assert(editCardRes.status === 200, '5.3 Chỉnh sửa nội dung Flashcard thành công (HTTP 200)');
    assert(editCardRes.data.front.includes('(Cập nhật)'), '5.3 Mặt trước thẻ đã được cập nhật');

    // 5.4 Star Flashcard
    const starRes = await axios.put(
      `${API_BASE}/flashcards/${testCardId}/star`,
      { is_starred: true },
      { headers: headersA }
    );
    assert(starRes.status === 200, '5.4 Đánh dấu sao Flashcard thành công (is_starred = true)');

    // 5.5 Deck Access Control & Anti-IDOR
    let bDeckCardsBlocked = false;
    try {
      await axios.get(`${API_BASE}/flashcards/decks/${testDeckId}/cards`, { headers: headersB });
    } catch (err: any) {
      bDeckCardsBlocked = err.response?.status === 403;
    }
    assert(bDeckCardsBlocked, '5.5 Chặn User B xem thẻ trong bộ đề riêng tư của User A (HTTP 403)');

    let bDeckDeleteBlocked = false;
    try {
      await axios.delete(`${API_BASE}/flashcards/decks/${testDeckId}`, { headers: headersB });
    } catch (err: any) {
      bDeckDeleteBlocked = err.response?.status === 403;
    }
    assert(bDeckDeleteBlocked, '5.5 Chặn User B xóa bộ thẻ của User A (HTTP 403 Forbidden)');

    // 5.6 Foreign Key IDOR: User B tạo flashcard trong deck của mình nhưng gắn document_id riêng tư của User A
    const bDeckRes = await axios.post(
      `${API_BASE}/flashcards/decks`,
      { name: 'Deck của B' },
      { headers: headersB }
    );
    const bDeckId = bDeckRes.data.id;

    let bCreateCardAttachPrivateDocBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/flashcards`,
        {
          deck_id: bDeckId,
          front: 'Front B',
          back: 'Back B',
          document_id: testDocId,
        },
        { headers: headersB }
      );
    } catch (err: any) {
      bCreateCardAttachPrivateDocBlocked = err.response?.status === 403;
    }
    assert(
      bCreateCardAttachPrivateDocBlocked,
      '5.6 [IDOR Khóa ngoại] Chặn User B tạo flashcard gắn vào document riêng tư của User A (HTTP 403 Forbidden)'
    );

    // 5.7 Per-Card IDOR: User B cố tình sửa nội dung thẻ của User A
    let bEditCardBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/flashcards/${testCardId}`,
        { front: 'Hacker sửa thẻ của User A', back: 'Hacker sửa back' },
        { headers: headersB }
      );
    } catch (err: any) {
      bEditCardBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    assert(bEditCardBlocked, '5.7 [IDOR Cấp thẻ] Chặn User B sửa thẻ trong bộ thẻ của User A (HTTP 404/403)');

    // 5.8 Per-Card IDOR: User B cố tình gắn sao thẻ của User A
    let bStarCardBlocked = false;
    try {
      await axios.put(
        `${API_BASE}/flashcards/${testCardId}/star`,
        { is_starred: true },
        { headers: headersB }
      );
    } catch (err: any) {
      bStarCardBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    assert(bStarCardBlocked, '5.8 [IDOR Cấp thẻ] Chặn User B gắn sao thẻ trong bộ thẻ của User A (HTTP 404/403)');

    // 5.9 Per-Card IDOR: User B cố tình xóa thẻ của User A
    let bDeleteCardBlocked = false;
    try {
      await axios.delete(
        `${API_BASE}/flashcards/${testCardId}`,
        { headers: headersB }
      );
    } catch (err: any) {
      bDeleteCardBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    assert(bDeleteCardBlocked, '5.9 [IDOR Cấp thẻ] Chặn User B xóa thẻ trong bộ thẻ của User A (HTTP 404/403)');

    // 5.10 Per-Card IDOR: User B cố tình ôn tập thẻ của User A
    let bReviewCardBlocked = false;
    try {
      await axios.post(
        `${API_BASE}/flashcards/review/${testCardId}`,
        { difficulty: 'good' },
        { headers: headersB }
      );
    } catch (err: any) {
      bReviewCardBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    assert(bReviewCardBlocked, '5.10 [IDOR Cấp thẻ] Chặn User B ôn tập thẻ trong bộ thẻ của User A (HTTP 404/403)\n');

    // ─────────────────────────────────────────────────────────────
    // SUITE 6: Spaced Repetition (SM-2 Algorithm Deep Verification)
    // ─────────────────────────────────────────────────────────────
    console.log('--- SUITE 6: Spaced Repetition (SM-2 Algorithm Deep Verification) ---');

    // 6.1 Review: Rating 'hard' or 'again' -> resets reps to 0, interval = 1, ease factor decreases by 0.2
    const reviewHard = await axios.post(
      `${API_BASE}/flashcards/review/${testCardId}`,
      { difficulty: 'hard' },
      { headers: headersA }
    );
    assert(reviewHard.status === 200, '6.1 Đánh giá thẻ mức độ Hard thành công (HTTP 200)');
    assert(reviewHard.data.card.repetitions === 0, '6.1 Đánh giá Hard: repetitions được reset về 0');
    assert(reviewHard.data.card.interval_days === 1, '6.1 Đánh giá Hard: interval_days chuyển về 1 ngày');
    assert(
      Math.abs(reviewHard.data.card.ease_factor - 2.3) < 0.001,
      `6.1 Đánh giá Hard: ease_factor giảm 0.2 còn 2.3 (thực tế: ${reviewHard.data.card.ease_factor})`
    );

    // 6.2 Review: Rating 'good' (First successful repetition) -> repetitions = 1, interval = 1
    const reviewGood1 = await axios.post(
      `${API_BASE}/flashcards/review/${testCardId}`,
      { difficulty: 'good' },
      { headers: headersA }
    );
    assert(reviewGood1.data.card.repetitions === 1, '6.2 Đánh giá Good lần 1: repetitions tăng lên 1');
    assert(reviewGood1.data.card.interval_days === 1, '6.2 Đánh giá Good lần 1: interval_days là 1 ngày');

    // 6.3 Review: Rating 'good' (Second consecutive repetition) -> repetitions = 2, interval = 6
    const reviewGood2 = await axios.post(
      `${API_BASE}/flashcards/review/${testCardId}`,
      { difficulty: 'good' },
      { headers: headersA }
    );
    assert(reviewGood2.data.card.repetitions === 2, '6.3 Đánh giá Good lần 2: repetitions tăng lên 2');
    assert(reviewGood2.data.card.interval_days === 6, '6.3 Đánh giá Good lần 2: interval_days tăng lên 6 ngày');

    // 6.4 Review: Rating 'good' (Third consecutive repetition) -> interval = Math.round(6 * 2.3) = 14
    const reviewGood3 = await axios.post(
      `${API_BASE}/flashcards/review/${testCardId}`,
      { difficulty: 'good' },
      { headers: headersA }
    );
    assert(reviewGood3.data.card.repetitions === 3, '6.4 Đánh giá Good lần 3: repetitions tăng lên 3');
    assert(reviewGood3.data.card.interval_days === 14, `6.4 Đánh giá Good lần 3: interval = 14 ngày (thực tế: ${reviewGood3.data.card.interval_days})`);

    // 6.5 Review: Rating 'easy' -> ease_factor increases (+0.15)
    const reviewEasy = await axios.post(
      `${API_BASE}/flashcards/review/${testCardId}`,
      { difficulty: 'easy' },
      { headers: headersA }
    );
    assert(
      Math.abs(reviewEasy.data.card.ease_factor - 2.45) < 0.001,
      `6.5 Đánh giá Easy: ease_factor tăng 0.15 đạt 2.45 (thực tế: ${reviewEasy.data.card.ease_factor})`
    );

    // 6.6 Ease Factor Floor Constraint (minimum bound = 1.3)
    // Run consecutive 'hard' ratings to verify ease_factor never drops below 1.3
    for (let i = 0; i < 10; i++) {
      await axios.post(
        `${API_BASE}/flashcards/review/${testCardId}`,
        { difficulty: 'hard' },
        { headers: headersA }
      );
    }
    const floorCheck = await db.query('SELECT ease_factor FROM flashcards WHERE id = $1', [testCardId]);
    assert(
      floorCheck.rows[0].ease_factor >= 1.3,
      `6.6 Giới hạn dưới của ease_factor không bao giờ tụt dưới 1.3 (thực tế: ${floorCheck.rows[0].ease_factor})`
    );

    // 6.7 User Streak & Activity verification
    const streakCheck = await db.query('SELECT streak FROM users WHERE id = $1', [testUserAId]);
    assert(
      streakCheck.rows[0].streak >= 1,
      `6.7 Ôn tập flashcard tự động cộng chuỗi học tập streak (hiện tại: ${streakCheck.rows[0].streak})`
    );

    console.log('\n========================================================');
    console.log('   ✅ ALL PHASE 9 INTEGRATION TESTS PASSED (100%)      ');
    console.log('========================================================\n');
  } catch (error: any) {
    console.error('\x1b[31m[UNHANDLED ERROR]\x1b[0m', error?.response?.data || error?.message || error);
    process.exit(1);
  } finally {
    // ─────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────
    if (testUserAId || testUserBId) {
      await db.query(
        `DELETE FROM users WHERE email IN ('phase9_userA@example.com', 'phase9_userB@example.com') OR phone IN ('0987659001', '0987659002')`
      );
      console.log('[Cleanup] Cleaned up Phase 9 test users and cascade records.');
    }
    await db.end();
  }
}

runPhase9Tests();
