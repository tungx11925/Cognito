import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db';
import { documentProcessingService } from '../src/services/document-processing.service';
import { documentChunksRepository } from '../src/repositories/document-chunks.repository';

async function runTests() {
  console.log('=== TEST PIPELINE VỚI 3 LOẠI FILE THẬT ===\n');

  // Lấy 1 user_id hợp lệ
  const userRes = await db.query('SELECT id FROM users LIMIT 1');
  const userId = userRes.rows[0]?.id || 1;

  const fixturesDir = path.join(__dirname, '../uploads/test_fixtures');
  const testFiles = [
    {
      name: 'File 1: PDF có text layer',
      title: 'Test Doc 1 - PDF Text Layer (React Native)',
      fileName: 'file_1_text_layer.pdf',
      fileType: 'application/pdf',
      expectedOcr: false,
    },
    {
      name: 'File 2: PDF scan / ảnh (không có text layer)',
      title: 'Test Doc 2 - PDF Scanned Image (Triết học Mác-Lênin)',
      fileName: 'file_2_scanned_image.pdf',
      fileType: 'application/pdf',
      expectedOcr: true,
    },
    {
      name: 'File 3: File PPTX thật',
      title: 'Test Doc 3 - PPTX Slide (Điện toán đám mây)',
      fileName: 'file_3_presentation.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      expectedOcr: false,
    },
  ];

  for (const item of testFiles) {
    console.log(`\n--------------------------------------------------`);
    console.log(`BẮT ĐẦU TEST: [${item.name}]`);
    console.log(`File: ${item.fileName}`);

    const filePath = path.join(fixturesDir, item.fileName);

    // 1. Tạo bản ghi document trong DB
    const insRes = await db.query(
      `INSERT INTO documents (user_id, title, doc_url, file_type, processing_status, status)
       VALUES ($1, $2, $3, $4, 'PENDING', 'PROCESSING')
       RETURNING id, title, processing_status`,
      [userId, item.title, filePath, item.fileType]
    );
    const docId = insRes.rows[0].id;
    console.log(`Đã tạo document ID: ${docId}, trạng thái ban đầu: PENDING`);

    // 2. Kích hoạt pipeline
    const startTime = Date.now();
    await documentProcessingService.processDocument(docId);
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

    // 3. Kiểm tra kết quả trong DB
    const checkDoc = await db.query(
      'SELECT id, title, processing_status, processing_error, page_count FROM documents WHERE id = $1',
      [docId]
    );
    const doc = checkDoc.rows[0];
    const chunks = await documentChunksRepository.listByDocument(docId);
    const keywords = await documentChunksRepository.getKeywordCatalog(docId);

    console.log(`Kết quả xử lý (${durationSec}s):`);
    console.log(`- Trạng thái processing_status: ${doc.processing_status}`);
    console.log(`- Số trang page_count: ${doc.page_count}`);
    console.log(`- Số chunks đã tạo: ${chunks.length}`);
    console.log(`- Cờ is_ocr trên các chunks: ${chunks.map(c => c.is_ocr)}`);
    console.log(`- Từ khoá trích xuất (${keywords.length}): ${keywords.slice(0, 8).map(k => `${k.keyword} (${k.count})`).join(', ')}`);

    if (chunks.length > 0) {
      console.log(`- Preview chunk 1: "${chunks[0].content.substring(0, 120).replace(/\n/g, ' ')}..."`);
    }

    // Verify assertions
    if (doc.processing_status !== 'READY') {
      throw new Error(`FAIL: Document ${docId} không đạt trạng thái READY, lỗi: ${doc.processing_error}`);
    }
    if (chunks.length === 0) {
      throw new Error(`FAIL: Document ${docId} không tạo được chunk nào!`);
    }
    if (item.expectedOcr && !chunks.some(c => c.is_ocr)) {
      throw new Error(`FAIL: Document ${docId} là file scan nhưng không kích hoạt cờ is_ocr = true!`);
    }

    console.log(`=> TEST [${item.name}]: PASS! ✅`);
  }

  console.log('\n==================================================');
  console.log('TẤT CẢ 3 LOẠI FILE ĐÃ VƯỢT QUA TEST PIPELINE THÀNH CÔNG! 🎉\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST PIPELINE THẤT BẠI:', err);
  process.exit(1);
});
