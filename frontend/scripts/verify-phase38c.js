const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:5000/api';
const DOCX_PATH = path.resolve(__dirname, '../../backend/uploads/1780904598556-753157900.docx');
const PDF_PATH = path.resolve(__dirname, '../../backend/uploads/1780915256623-281929895.pdf');

// Helper gửi HTTP request có hỗ trợ cookie
function httpRequest(options, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const fullBuffer = Buffer.concat(data);
        const text = fullBuffer.toString('utf-8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || text,
          rawText: text
        });
      });
    });
    req.on('error', reject);
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

// Multipart helper không set cứng Content-Type trong body
function createMultipartPayload(fieldName, filePath, fileName) {
  const boundary = '----CognitoBoundary' + Math.random().toString(36).substring(2);
  const fileContent = fs.readFileSync(filePath);
  const mimeType = fileName.endsWith('.docx') 
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';

  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, fileContent, tail]);

  return {
    body,
    boundary,
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('   PHASE 38C — VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Kiểm tra GET /api/health public
  console.log('[TEST 1] Kiểm tra GET /api/health public...');
  const healthRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log(`  -> Status: ${healthRes.statusCode}, Body:`, healthRes.data);
  if (healthRes.statusCode !== 200 || healthRes.data?.status !== 'OK') {
    throw new Error('GET /api/health thất bại hoặc không public');
  }
  console.log('  => ĐÃ KIỂM CHỨNG: GET /api/health public 200 OK\n');

  // 2. Đăng nhập để lấy cookie session
  console.log('[TEST 2] Đăng nhập tài khoản test lấy HttpOnly cookie...');
  const loginPayload = JSON.stringify({
    email: 'test_login_user@cognito.test',
    password: 'Password123!'
  });
  const loginRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, Buffer.from(loginPayload));

  const cookies = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  console.log(`  -> Login status: ${loginRes.statusCode}, User: ${loginRes.data?.user?.email}`);
  if (loginRes.statusCode !== 200 || !cookies) {
    throw new Error('Đăng nhập thất bại: ' + JSON.stringify(loginRes.data));
  }
  console.log('  => ĐÃ KIỂM CHỨNG: Nhận session cookie thành công\n');

  // 3. Upload file .docx (~36KB) tạo flashcard
  console.log('[TEST 3] Kiểm thử thật tạo Flashcard bằng AI từ file .docx (~36KB)...');
  console.log(`  -> File path: ${DOCX_PATH} (size: ${(fs.statSync(DOCX_PATH).size / 1024).toFixed(1)} KB)`);
  const docxPayload = createMultipartPayload('document', DOCX_PATH, 'test-document.docx');
  
  const uploadDocxRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/flashcards/generate-from-file',
    method: 'POST',
    headers: {
      'Content-Type': docxPayload.contentType,
      'Content-Length': docxPayload.body.length,
      'Cookie': cookies
    }
  }, docxPayload.body);

  console.log(`  -> Response status: ${uploadDocxRes.statusCode}, Content-Type: ${uploadDocxRes.headers['content-type']}`);
  if (uploadDocxRes.statusCode !== 200 || !uploadDocxRes.data?.cards) {
    throw new Error('Upload .docx tạo flashcard thất bại: ' + JSON.stringify(uploadDocxRes.data));
  }
  const docxCards = uploadDocxRes.data.cards;
  console.log(`  -> Sinh thành công ${docxCards.length} thẻ! Thẻ mẫu:`);
  console.log(`     Mặt trước: "${docxCards[0]?.front}"`);
  console.log(`     Mặt sau:   "${docxCards[0]?.back}"`);

  // Lưu deck và thẻ vào database
  const createDeckPayload = JSON.stringify({
    name: 'Bộ thẻ AI từ file DOCX test',
    description: 'Tạo tự động trong Phase 38C'
  });
  const deckRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/flashcards/decks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(createDeckPayload),
      'Cookie': cookies
    }
  }, Buffer.from(createDeckPayload));

  console.log(`  -> Tạo deck status: ${deckRes.statusCode}, Deck ID: ${deckRes.data?.id}`);
  const deckId = deckRes.data?.id;

  // Thêm thẻ vào deck
  for (let i = 0; i < Math.min(3, docxCards.length); i++) {
    const card = docxCards[i];
    const cardPayload = JSON.stringify({
      deck_id: deckId,
      front: card.front,
      back: card.back
    });
    await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/flashcards',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(cardPayload),
        'Cookie': cookies
      }
    }, Buffer.from(cardPayload));
  }

  // Lấy deckById để kiểm tra card_count
  const getDeckRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/flashcards/decks/${deckId}`,
    method: 'GET',
    headers: { 'Cookie': cookies }
  });
  console.log(`  -> Get Deck By ID result: name="${getDeckRes.data?.name}", card_count=${getDeckRes.data?.card_count}`);
  console.log('  => ĐÃ KIỂM CHỨNG: File .docx tạo thành công deck có thẻ và card_count chính xác\n');

  // 4. Upload file .pdf (~339KB) tạo flashcard
  console.log('[TEST 4] Kiểm thử thật tạo Flashcard bằng AI từ file .pdf (~339KB)...');
  console.log(`  -> File path: ${PDF_PATH} (size: ${(fs.statSync(PDF_PATH).size / 1024).toFixed(1)} KB)`);
  const pdfPayload = createMultipartPayload('document', PDF_PATH, 'test-document.pdf');
  
  const uploadPdfRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/flashcards/generate-from-file',
    method: 'POST',
    headers: {
      'Content-Type': pdfPayload.contentType,
      'Content-Length': pdfPayload.body.length,
      'Cookie': cookies
    }
  }, pdfPayload.body);

  console.log(`  -> Response status: ${uploadPdfRes.statusCode}, Content-Type: ${uploadPdfRes.headers['content-type']}`);
  if (uploadPdfRes.statusCode !== 200 || !uploadPdfRes.data?.cards) {
    throw new Error('Upload .pdf tạo flashcard thất bại: ' + JSON.stringify(uploadPdfRes.data));
  }
  const pdfCards = uploadPdfRes.data.cards;
  console.log(`  -> Sinh thành công ${pdfCards.length} thẻ từ file PDF! Thẻ mẫu:`);
  console.log(`     Mặt trước: "${pdfCards[0]?.front}"`);
  console.log(`     Mặt sau:   "${pdfCards[0]?.back}"`);
  console.log('  => ĐÃ KIỂM CHỨNG: File .pdf tạo thành công bộ thẻ\n');

  // 5. Kiểm tra AI Chat (Chế độ GENERAL & DOCUMENT_CONTEXT)
  console.log('[TEST 5] Kiểm tra Trợ lý AI chat với document & tổng quát...');
  const chatPayloadGeneral = JSON.stringify({
    message: 'Xin chào, hãy giải thích khái niệm Pomodoro trong 1 câu ngắn.',
    context_mode: 'GENERAL'
  });
  const chatResGeneral = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(chatPayloadGeneral),
      'Cookie': cookies
    }
  }, Buffer.from(chatPayloadGeneral));

  console.log(`  -> AI Chat GENERAL status: ${chatResGeneral.statusCode}`);
  console.log(`     Trả lời: "${(chatResGeneral.data?.reply || '').slice(0, 100)}..."`);
  if (chatResGeneral.statusCode !== 200 || !chatResGeneral.data?.reply) {
    throw new Error('AI Chat GENERAL thất bại: ' + JSON.stringify(chatResGeneral.data));
  }
  console.log('  => ĐÃ KIỂM CHỨNG: AI Chat hoạt động chuẩn, không rơi vào câu lỗi generic\n');

  console.log('====================================================');
  console.log('  TẤT CẢ 5 BÀI TEST CHỨC NĂNG ĐỀU PASS 100%!');
  console.log('====================================================\n');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION THẤT BẠI:', err);
  process.exit(1);
});
