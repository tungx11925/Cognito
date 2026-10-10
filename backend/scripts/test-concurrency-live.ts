import { db } from '../src/db';
import { documentProcessingService } from '../src/services/document-processing.service';

async function run() {
  console.log('========================================================================');
  console.log('   CONCURRENCY VALIDATION TEST: DOCUMENT PROCESSING QUEUE (P32 / GAP-08)');
  console.log('========================================================================\n');

  // 1. Create a dedicated test user
  const email = `concurrency_test_${Date.now()}@test.local`;
  const userRes = await db.query(
    `INSERT INTO users (email, password, name, role) 
     VALUES ($1, 'hash_placeholder', 'Concurrency Test User', 'user') 
     RETURNING id`,
    [email]
  );
  const userId = userRes.rows[0].id;
  console.log(`[Setup] Created test user id: ${userId} (${email})`);

  // 2. Insert 4 documents referencing the sample text file
  const docUrl = 'test_concurrency_sample.txt';

  const docIds: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const docRes = await db.query(
      `INSERT INTO documents (user_id, title, doc_url, file_type, file_size, status, processing_status) 
       VALUES ($1, $2, $3, 'text/plain', 500, 'PROCESSING', 'PENDING') 
       RETURNING id`,
      [userId, `Tài liệu Kiểm tra Đồng thời #${i}.txt`, docUrl]
    );
    docIds.push(docRes.rows[0].id);
  }
  console.log(`[Setup] Created 4 test documents: [${docIds.join(', ')}]\n`);

  // 3. Monitor active concurrency
  // Access private activeJobs and queue via reflection for metric assertion
  const serviceAny = documentProcessingService as any;
  const maxAllowedConcurrency = serviceAny.maxConcurrency || 2;
  console.log(`[Queue Config] Max Concurrency configured: ${maxAllowedConcurrency}`);

  let peakConcurrency = 0;
  let violation = false;

  const monitorInterval = setInterval(() => {
    const active = serviceAny.activeJobs || 0;
    const queued = serviceAny.queue?.length || 0;
    if (active > peakConcurrency) peakConcurrency = active;
    if (active > maxAllowedConcurrency) {
      violation = true;
      console.error(`[VIOLATION] Active jobs (${active}) exceeded maxConcurrency (${maxAllowedConcurrency})!`);
    }
  }, 10);

  // 4. Trigger processing for all 4 simultaneously
  console.log('[Test Execution] Enqueuing all 4 documents at the exact same millisecond...');
  const startTime = Date.now();
  await Promise.all(docIds.map(id => documentProcessingService.processDocument(id)));

  // Wait until all 4 documents reach READY or FAILED
  let allDone = false;
  let attempts = 0;
  while (!allDone && attempts < 100) {
    await new Promise(r => setTimeout(r, 200));
    attempts++;
    const checkRes = await db.query(
      `SELECT id, status, processing_status FROM documents WHERE id = ANY($1::int[])`,
      [docIds]
    );
    const statuses = checkRes.rows.map((r: any) => r.processing_status || r.status);
    allDone = statuses.every((s: string) => s === 'READY' || s === 'FAILED');
  }

  clearInterval(monitorInterval);
  const elapsedMs = Date.now() - startTime;

  // 5. Check results
  const finalRes = await db.query(
    `SELECT id, status, processing_status, page_count FROM documents WHERE id = ANY($1::int[]) ORDER BY id`,
    [docIds]
  );
  console.log('\n--- KẾT QUẢ XỬ LÝ 4 TÀI LIỆU ---');
  finalRes.rows.forEach((r: any) => {
    console.log(`Document ID ${r.id}: status=${r.status}, processing_status=${r.processing_status}, page_count=${r.page_count}`);
  });

  console.log('\n--- CHỈ SỐ CONCURRENCY ---');
  console.log(`Peak Concurrent Active Jobs: ${peakConcurrency} (Giới hạn tối đa cho phép: ${maxAllowedConcurrency})`);
  console.log(`Concurrency Guard Violated: ${violation ? 'YES (LỖI)' : 'NO (HOÀN TOÀN TUÂN THỦ)'}`);
  console.log(`Total Time Elapsed: ${elapsedMs}ms`);

  // 6. Assertions
  const allReady = finalRes.rows.every((r: any) => r.status === 'READY' || r.processing_status === 'READY');
  const concurrencySafe = peakConcurrency <= maxAllowedConcurrency && !violation;

  console.log('\n========================================================================');
  if (allReady && concurrencySafe) {
    console.log('🎉 TEST THÀNH CÔNG 100%: Concurrency limit (max=2) hoạt động chuẩn xác!');
    console.log('   Tất cả 4 tài liệu được xử lý tuần tự theo batch 2 mà không nghẽn tài nguyên.');
  } else {
    console.error('❌ TEST THẤT BẠI: Có lỗi về trạng thái tài liệu hoặc vi phạm concurrency limit.');
  }
  console.log('========================================================================\n');

  // 7. Cleanup test records
  console.log('[Cleanup] Cleaning up test documents, chunks and user...');
  await db.query(`DELETE FROM document_chunks WHERE document_id = ANY($1::int[])`, [docIds]);
  await db.query(`DELETE FROM documents WHERE id = ANY($1::int[])`, [docIds]);
  await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
  console.log('[Cleanup] Completed cleanly.');

  if (!allReady || !concurrencySafe) {
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[Error]', err);
    process.exit(1);
  });
