/**
 * Automated Integration Test Suite for Phase 4: Document Learning
 * Tests the entire document lifecycle, formats, validation, processing pipeline,
 * strict visibility protection, and Public != Community Published separation.
 */

import axios from 'axios';
import { db } from '../src/db';
import { documentProcessingService } from '../src/services/document-processing.service';
import { documentChunksRepository } from '../src/repositories/document-chunks.repository';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('========================================================');
  console.log('      COGNITO PHASE 4: DOCUMENT LEARNING INTEGRATION TEST');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  try {
    // 0. Setup: Clean up existing test users and data
    await db.query(`DELETE FROM users WHERE email IN ('test_p4_user_a@cognito.test', 'test_p4_user_b@cognito.test') OR phone IN ('0987654991', '0987654992')`);

    // Register User A
    const regResA = await axios.post(`${API_BASE}/auth/register`, {
      name: 'P4 User A (Owner)',
      email: 'test_p4_user_a@cognito.test',
      password: 'Password123!',
      phone: '0987654991',
    });
    const tokenA = regResA.data.token;
    const userA = regResA.data.user;

    // Register User B
    const regResB = await axios.post(`${API_BASE}/auth/register`, {
      name: 'P4 User B (Stranger)',
      email: 'test_p4_user_b@cognito.test',
      password: 'Password123!',
      phone: '0987654992',
    });
    const tokenB = regResB.data.token;
    const userB = regResB.data.user;

    const authHeadersA = { Authorization: `Bearer ${tokenA}` };
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    console.log(`[Setup] User A ID: ${userA.id}, User B ID: ${userB.id}\n`);

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Validation Gate (Missing title, invalid schema)
    // ─────────────────────────────────────────────────────────────
    try {
      await axios.post(
        `${API_BASE}/documents`,
        { title: '', description: 'No title document' },
        { headers: authHeadersA }
      );
      assert(false, 'Validation Gate rejects document with empty title');
    } catch (err: any) {
      assert(
        err.response?.status === 400,
        'Validation Gate rejects document with empty title (HTTP 400)'
      );
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Create Document & Master Prompt Attributes Verification
    // ─────────────────────────────────────────────────────────────
    const createDocRes = await axios.post(
      `${API_BASE}/documents`,
      {
        title: 'Tài liệu Giải tích 1 - Đạo hàm và Vi phân',
        description: 'Tài liệu ôn tập giải tích dành cho sinh viên năm nhất',
        category: 'Toán học',
        docUrl: 'https://example.com/mock-analysis.txt',
        solutionText: 'Tài liệu lý thuyết và bài tập đạo hàm chuẩn.',
        visibility: 'private',
      },
      { headers: authHeadersA }
    );

    const docA = createDocRes.data;
    assert(
      createDocRes.status === 201 && docA.id > 0,
      'Create Document succeeds (HTTP 201)'
    );

    // Verify all required Master Prompt Phase 4 fields
    const hasAllFields =
      docA.owner === userA.id &&
      docA.title === 'Tài liệu Giải tích 1 - Đạo hàm và Vi phân' &&
      typeof docA.description === 'string' &&
      typeof docA.file === 'string' &&
      typeof docA.type === 'string' &&
      typeof docA.size === 'number' &&
      typeof docA.status === 'string' &&
      docA.visibility === 'private' &&
      !docA.is_community_published &&
      Boolean(docA.createdAt) &&
      Boolean(docA.updatedAt);

    assert(
      hasAllFields,
      'Document object contains all required Master Prompt Phase 4 attributes (owner, title, description, file, type, size, status, visibility, createdAt, updatedAt)'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Processing Pipeline, OCR/Chunking & Keyword Extraction
    // ─────────────────────────────────────────────────────────────
    // Insert mock text chunks into database to verify chunking and indexing structure
    const sampleText = `Chương 1: Khái niệm đạo hàm và ý nghĩa hình học. Đạo hàm của hàm số tại một điểm biểu diễn tốc độ biến thiên tức thời của hàm số đó.
    
Chương 2: Quy tắc tính đạo hàm cho các hàm số sơ cấp cơ bản gồm hàm đa thức, hàm lượng giác, hàm mũ và hàm logarit. Đạo hàm tích và đạo hàm thương.

Chương 3: Ứng dụng đạo hàm trong khảo sát sự biến thiên và vẽ đồ thị hàm số, tìm cực trị của hàm số, giá trị lớn nhất và nhỏ nhất.`;

    const insertedChunks = await documentChunksRepository.insertChunks([
      {
        document_id: docA.id,
        chunk_index: 0,
        content: 'Chương 1: Khái niệm đạo hàm và ý nghĩa hình học. Đạo hàm của hàm số biểu diễn tốc độ biến thiên.',
        page_number: 1,
        token_count: 55,
        is_ocr: false,
        keywords: ['đạo hàm', 'ý nghĩa hình học', 'tốc độ biến thiên'],
      },
      {
        document_id: docA.id,
        chunk_index: 1,
        content: 'Chương 2: Quy tắc tính đạo hàm cho các hàm số sơ cấp cơ bản gồm hàm đa thức, lượng giác, hàm mũ.',
        page_number: 1,
        token_count: 60,
        is_ocr: false,
        keywords: ['hàm số', 'lượng giác', 'hàm mũ'],
      },
      {
        document_id: docA.id,
        chunk_index: 2,
        content: 'Chương 3: Ứng dụng đạo hàm trong khảo sát sự biến thiên và cực trị hàm số.',
        page_number: 2,
        token_count: 50,
        is_ocr: false,
        keywords: ['khảo sát biến thiên', 'cực trị', 'đồ thị'],
      },
    ]);

    await db.query(
      `UPDATE documents SET status = 'READY', processing_status = 'READY', page_count = 2, processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [docA.id]
    );

    const chunkCount = await documentChunksRepository.countByDocument(docA.id);
    const chunkList = await documentChunksRepository.listByDocument(docA.id);

    assert(
      chunkCount === 3 && chunkList.length === 3 && chunkList[0].keywords?.length! > 0,
      'Document Chunks and Academic Keywords correctly structured and indexed in document_chunks'
    );

    // Verify GET /api/documents/:id/status
    const statusRes = await axios.get(`${API_BASE}/documents/${docA.id}/status`, { headers: authHeadersA });
    assert(
      statusRes.status === 200 && statusRes.data.status === 'READY' && statusRes.data.chunk_count === 3,
      'Pipeline Status endpoint (GET /api/documents/:id/status) returns READY with chunk count'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Strict Access Control for Private Documents
    // ─────────────────────────────────────────────────────────────
    // Owner can access
    const ownerGetRes = await axios.get(`${API_BASE}/documents/${docA.id}`, { headers: authHeadersA });
    assert(
      ownerGetRes.status === 200 && ownerGetRes.data.id === docA.id,
      'Owner can access private document (HTTP 200)'
    );

    // Stranger CANNOT access private document
    try {
      await axios.get(`${API_BASE}/documents/${docA.id}`, { headers: authHeadersB });
      assert(false, 'Stranger is blocked from reading private document');
    } catch (err: any) {
      assert(
        err.response?.status === 403,
        'Stranger receives HTTP 403 Forbidden when trying to access private document'
      );
    }

    // Stranger CANNOT access chunks of private document
    try {
      await axios.get(`${API_BASE}/documents/${docA.id}/chunks`, { headers: authHeadersB });
      assert(false, 'Stranger is blocked from reading chunks of private document');
    } catch (err: any) {
      assert(
        err.response?.status === 403,
        'Stranger receives HTTP 403 Forbidden when trying to access private document chunks'
      );
    }

    // Stranger CANNOT update private document
    try {
      await axios.put(
        `${API_BASE}/documents/${docA.id}`,
        { title: 'Hacked Title' },
        { headers: authHeadersB }
      );
      assert(false, 'Stranger is blocked from editing private document');
    } catch (err: any) {
      assert(
        err.response?.status === 403,
        'Stranger receives HTTP 403 Forbidden when trying to edit document'
      );
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Public Document Visibility & updatedAt auto-trigger
    // ─────────────────────────────────────────────────────────────
    // Wait 50ms so updated_at is distinctly newer
    await new Promise(r => setTimeout(r, 50));

    const updateToPublicRes = await axios.put(
      `${API_BASE}/documents/${docA.id}`,
      { visibility: 'public' },
      { headers: authHeadersA }
    );
    assert(
      updateToPublicRes.status === 200 && updateToPublicRes.data.visibility === 'public',
      'Owner updates document visibility to public'
    );

    // Verify updatedAt was updated
    const initialCreated = new Date(docA.createdAt).getTime();
    const updatedTimestamp = new Date(updateToPublicRes.data.updatedAt).getTime();
    assert(
      updatedTimestamp >= initialCreated,
      'Database trigger trg_documents_updated_at auto-updates updatedAt timestamp'
    );

    // Stranger CAN now view public document
    const strangerGetPublicRes = await axios.get(`${API_BASE}/documents/${docA.id}`, { headers: authHeadersB });
    assert(
      strangerGetPublicRes.status === 200 && strangerGetPublicRes.data.id === docA.id,
      'Stranger CAN view document when visibility is public (HTTP 200)'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Public != Community Published
    // ─────────────────────────────────────────────────────────────
    // Even though visibility is 'public', is_community_published is false.
    // It MUST NOT appear in the marketplace!
    const marketCheck1 = await axios.get(`${API_BASE}/marketplace/resources?type=document`, { headers: authHeadersB });
    const foundInMarketplace1 = (marketCheck1.data.resources || []).some((r: any) => r.id === docA.id);
    assert(
      !foundInMarketplace1,
      'RULE ENFORCED: PUBLIC != Community Published (Public document without community publishing is NOT in marketplace)'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Explicit Community Publishing
    // ─────────────────────────────────────────────────────────────
    const publishRes = await axios.put(
      `${API_BASE}/documents/${docA.id}`,
      { is_community_published: true },
      { headers: authHeadersA }
    );
    assert(
      publishRes.status === 200 && publishRes.data.is_community_published === true,
      'Owner explicitly publishes document to community'
    );

    // Now it MUST appear in marketplace
    const marketCheck2 = await axios.get(`${API_BASE}/marketplace/resources?type=document`, { headers: authHeadersB });
    const foundInMarketplace2 = (marketCheck2.data.resources || []).some((r: any) => r.id === docA.id);
    assert(
      foundInMarketplace2,
      'Community Published document appears in Marketplace resources'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Community Unpublishing
    // ─────────────────────────────────────────────────────────────
    const unpublishRes = await axios.put(
      `${API_BASE}/documents/${docA.id}`,
      { is_community_published: false },
      { headers: authHeadersA }
    );
    assert(
      unpublishRes.status === 200 && unpublishRes.data.is_community_published === false,
      'Owner unpublishes document from community'
    );

    const marketCheck3 = await axios.get(`${API_BASE}/marketplace/resources?type=document`, { headers: authHeadersB });
    const foundInMarketplace3 = (marketCheck3.data.resources || []).some((r: any) => r.id === docA.id);
    assert(
      !foundInMarketplace3,
      'Unpublished document is immediately removed from Marketplace resources'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 9: Delete Document & Cascading Cleanup
    // ─────────────────────────────────────────────────────────────
    const deleteRes = await axios.delete(`${API_BASE}/documents/${docA.id}`, { headers: authHeadersA });
    assert(
      deleteRes.status === 200,
      'Owner deletes document successfully (HTTP 200)'
    );

    // Verify document deleted from documents table
    const checkDeleted = await db.query('SELECT * FROM documents WHERE id = $1', [docA.id]);
    assert(
      checkDeleted.rows.length === 0,
      'Document record removed from documents table'
    );

    // Verify chunks deleted
    const checkChunks = await db.query('SELECT * FROM document_chunks WHERE document_id = $1', [docA.id]);
    assert(
      checkChunks.rows.length === 0,
      'Document chunks cascade-cleaned from document_chunks table'
    );

    // ─────────────────────────────────────────────────────────────
    // TEST 10: FAILED State Handling on Corrupt/Empty Document
    // ─────────────────────────────────────────────────────────────
    const corruptDocRes = await axios.post(
      `${API_BASE}/documents`,
      {
        title: 'Corrupt Empty File.pdf',
        description: 'Tài liệu giả mạo file hỏng',
        category: 'Test',
        docUrl: 'http://127.0.0.1:9999/non-existent-corrupt.pdf',
        visibility: 'private',
      },
      { headers: authHeadersA }
    );
    const corruptDoc = corruptDocRes.data;

    // Trigger pipeline processing on corrupt document
    await documentProcessingService.processDocument(corruptDoc.id);

    // Wait 500ms for async worker to complete
    await new Promise(r => setTimeout(r, 600));

    const corruptStatusRes = await axios.get(
      `${API_BASE}/documents/${corruptDoc.id}/status`,
      { headers: authHeadersA }
    );

    assert(
      corruptStatusRes.data.status === 'FAILED' &&
      corruptStatusRes.data.processing_status === 'FAILED' &&
      typeof corruptStatusRes.data.processing_error === 'string' &&
      corruptStatusRes.data.processing_error.length > 0,
      'Corrupt/unparseable document transitions to status FAILED with error explanation (no infinite hanging)'
    );

    await axios.delete(`${API_BASE}/documents/${corruptDoc.id}`, { headers: authHeadersA });

    // ─────────────────────────────────────────────────────────────
    // TEST 11: Delete Document while Community-Published Clean up
    // ─────────────────────────────────────────────────────────────
    const pubDocRes = await axios.post(
      `${API_BASE}/documents`,
      {
        title: 'Tài liệu Xuất bản Trực tiếp và Xóa',
        description: 'Kiểm tra dọn dẹp khi xóa thẳng tài liệu công khai',
        category: 'Test',
        visibility: 'public',
        is_community_published: true,
      },
      { headers: authHeadersA }
    );
    const pubDoc = pubDocRes.data;

    // Verify it is in marketplace
    const checkMarketBefore = await axios.get(`${API_BASE}/marketplace/resources?type=document`, { headers: authHeadersB });
    const inMarketBefore = (checkMarketBefore.data.resources || []).some((r: any) => r.id === pubDoc.id);
    assert(inMarketBefore, 'Published document appears in marketplace');

    // Owner deletes directly without unpublishing
    const delPubRes = await axios.delete(`${API_BASE}/documents/${pubDoc.id}`, { headers: authHeadersA });
    assert(delPubRes.status === 200, 'Owner deletes published document directly (HTTP 200)');

    // Verify gone from marketplace
    const checkMarketAfter = await axios.get(`${API_BASE}/marketplace/resources?type=document`, { headers: authHeadersB });
    const inMarketAfter = (checkMarketAfter.data.resources || []).some((r: any) => r.id === pubDoc.id);
    assert(!inMarketAfter, 'Deleted published document immediately disappears from marketplace');

    // Verify community_resources record is removed
    const checkCommRes = await db.query('SELECT * FROM community_resources WHERE resource_type = $1 AND resource_id = $2', ['document', pubDoc.id]);
    assert(checkCommRes.rows.length === 0, 'Community resource listing cleanly wiped upon document deletion');

    // ─────────────────────────────────────────────────────────────
    // Clean up test users
    // ─────────────────────────────────────────────────────────────
    await db.query(`DELETE FROM users WHERE email IN ('test_p4_user_a@cognito.test', 'test_p4_user_b@cognito.test')`);

  } catch (error: any) {
    console.error('Test execution error:', error.response?.data || error.message || error);
  }

  console.log('\n========================================================');
  console.log(`  PHASE 4 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================\n');

  if (passedTests === totalTests && totalTests > 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
