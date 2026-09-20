import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db';
import { questionGenerationService } from '../src/services/question-generation.service';
import { aiProviderService } from '../src/services/ai-provider.service';
import { documentProcessingService } from '../src/services/document-processing.service';

async function testEndpoints() {
  console.log('=== TEST QUESTION GENERATION LOGIC & ENDPOINTS ===\n');

  // 1. Test AI Models & Templates
  console.log('1. Test listAIModels & listAITemplates...');
  const models = await aiProviderService.listActiveModels();
  console.log(`- Active AI Models count: ${models.length}`);
  for (const m of models) {
    console.log(`  * [${m.tier.toUpperCase()}] ${m.display_name} (${m.provider}/${m.model_name})`);
  }
  if (models.length === 0) throw new Error('Không có active model nào!');

  const templates = questionGenerationService.listTemplates();
  console.log(`- AI Templates count: ${templates.length}`);
  for (const t of templates) {
    console.log(`  * [${t.id}] ${t.name}: ${t.description}`);
  }

  // 2. Tìm document đã READY từ test trước
  const docRes = await db.query(
    `SELECT id, title, user_id, processing_status 
     FROM documents 
     WHERE processing_status = 'READY' 
     ORDER BY id DESC LIMIT 1`
  );
  if (docRes.rows.length === 0) {
    throw new Error('Chưa có tài liệu nào ở trạng thái READY để test');
  }
  const testDoc = docRes.rows[0];
  console.log(`\n2. Test Document Chunks & Status cho Doc ID ${testDoc.id} (${testDoc.title})...`);

  const docChunks = await documentProcessingService.getDocumentChunks(testDoc.id, testDoc.user_id);
  console.log(`- Status: ${docChunks?.processing_status}`);
  console.log(`- Page count: ${docChunks?.page_count}`);
  console.log(`- Total chunks: ${docChunks?.chunk_count}`);
  console.log(`- Keywords count: ${docChunks?.keywords.length}`);

  // 3. Test Generate Questions (DRAFT)
  console.log(`\n3. Test POST /api/questions/generate (DRAFT)...`);
  const topKeywords = docChunks?.keywords.slice(0, 3).map(k => k.keyword) || [];
  console.log(`- Selected Focus Keywords: ${topKeywords.join(', ')}`);

  const genResult = await questionGenerationService.generate({
    userId: testDoc.user_id,
    sourceIds: [testDoc.id],
    focusKeywords: topKeywords.length > 0 ? topKeywords : undefined,
    audienceLevel: 'medium',
    questionType: 'MULTIPLE_CHOICE',
    difficulty: 'medium',
    quantity: 3,
    templateId: 'basic_quiz',
    mode: 'practice',
    name: 'Bộ đề kiểm tra End-to-End',
  });

  if (genResult.status !== 'SUCCESS' || !genResult.testSet || !genResult.questions) {
    throw new Error('Sinh câu hỏi thất bại!');
  }

  const testSet = genResult.testSet;
  const questions = genResult.questions;

  console.log(`=> Tạo thành công TestSet ID: ${testSet.id}, Status: ${testSet.status} (DRAFT)`);
  console.log(`=> Số lượng câu hỏi: ${questions.length}`);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`  [Câu ${i + 1}] (${q.type}, ${q.difficulty}): ${q.content}`);
    console.log(`    - Đáp án: ${JSON.stringify(q.correct_answer)}`);
    console.log(`    - Giải thích: ${q.explanation}`);
    console.log(`    - Status: ${q.status} (DRAFT)`);
  }

  if (testSet.status !== 'DRAFT') throw new Error('TestSet ban đầu phải ở trạng thái DRAFT');
  if (questions[0].status !== 'DRAFT') throw new Error('Questions ban đầu phải ở trạng thái DRAFT');

  // 4. Test PATCH /api/questions/:id (chỉnh sửa preview)
  console.log(`\n4. Test PATCH /api/questions/:id (chỉnh sửa lúc Preview)...`);
  const firstQ = questions[0];
  const updatedQ = await questionGenerationService.updateQuestion(testDoc.user_id, firstQ.id, {
    content: `${firstQ.content} (Đã chỉnh sửa bởi Giáo viên)`,
    score: 2.0,
    explanation: 'Giải thích đã được cập nhật chuẩn mực hơn.',
  });
  console.log(`=> Cập nhật câu hỏi ID ${updatedQ.id}:`);
  console.log(`   - Nội dung mới: ${updatedQ.content}`);
  console.log(`   - Điểm số mới: ${updatedQ.score}`);

  // 5. Test POST /api/test-sets/:id/approve (duyệt & lưu chính thức)
  console.log(`\n5. Test POST /api/test-sets/:id/approve (DRAFT -> APPROVED)...`);
  const approvedSet = await questionGenerationService.approveTestSet(testDoc.user_id, testSet.id);
  console.log(`=> Trạng thái bộ đề sau khi duyệt: ${approvedSet.status}`);

  // Kiểm tra trạng thái câu hỏi sau duyệt
  const verifyQ = await db.query('SELECT id, status FROM questions WHERE test_set_id = $1', [testSet.id]);
  console.log(`=> Trạng thái các câu hỏi sau duyệt: ${verifyQ.rows.map(r => r.status).join(', ')}`);

  if (approvedSet.status !== 'APPROVED' || verifyQ.rows.some(r => r.status !== 'APPROVED')) {
    throw new Error('Bộ đề hoặc câu hỏi chưa chuyển sang APPROVED sau khi duyệt!');
  }

  console.log('\n==================================================');
  console.log('TẤT CẢ CÁC BƯỚC QUESTION GENERATION VÀ APPROVAL ĐÃ THÀNH CÔNG! 🎉\n');
  await db.end();
}

testEndpoints().catch(async err => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  await db.end().catch(() => {});
  process.exit(1);
});
