const fs = require('fs');
const path = require('path');
const http = require('http');

const DOCX_PATH = path.resolve(__dirname, '../../backend/uploads/1780904598556-753157900.docx');

function httpRequest(options, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const fullBuffer = Buffer.concat(data);
        const text = fullBuffer.toString('utf-8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || text
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

function createMultipartPayload(fieldName, filePath, fileName) {
  const boundary = '----CognitoBoundary' + Math.random().toString(36).substring(2);
  const fileContent = fs.readFileSync(filePath);
  const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

async function runTest() {
  console.log('=== KIỂM CHỨNG TOÀN VẸN SỐ LƯỢNG THẺ FLASHCARD TỪ FILE .DOCX ===\n');

  // 1. Login
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

  const token = loginRes.data?.token;
  const cookies = `token=${token}`;
  console.log(`[AUTH] Đăng nhập thành công, user ID: ${loginRes.data?.user?.id}`);

  // 2. Upload file .docx
  console.log(`[UPLOAD] Đang tải file .docx: ${DOCX_PATH} (${(fs.statSync(DOCX_PATH).size / 1024).toFixed(1)} KB)...`);
  const docxPayload = createMultipartPayload('document', DOCX_PATH, 'test-doc.docx');
  const genRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/flashcards/generate-from-file',
    method: 'POST',
    headers: {
      'Content-Type': docxPayload.contentType,
      'Content-Length': docxPayload.body.length,
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, docxPayload.body);

  if (genRes.statusCode !== 200 || !genRes.data?.cards) {
    console.error('Lỗi khi sinh thẻ:', genRes.data);
    process.exit(1);
  }

  const aiCards = genRes.data.cards;
  const countAI = aiCards.length;
  console.log(`[BƯỚC 1 - AI TRẢ VỀ] Số thẻ AI sinh ra: ${countAI} thẻ`);

  // 3. Tạo Deck mới
  const deckPayload = JSON.stringify({
    name: `Bộ thẻ Full .DOCX Test (${Date.now()})`,
    description: `Kiểm chứng toàn vẹn ${countAI} thẻ`
  });
  const deckRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/flashcards/decks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(deckPayload),
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, Buffer.from(deckPayload));

  const deckId = deckRes.data?.id;
  console.log(`[BƯỚC 2 - TẠO DECK] Đã tạo deck ID: ${deckId}`);

  // 4. Insert TOÀN BỘ số thẻ vào database (không dùng Math.min)
  console.log(`[BƯỚC 3 - INSERT DB] Đang lưu toàn bộ ${countAI} thẻ vào database...`);
  let insertedCount = 0;
  for (const card of aiCards) {
    const cardPayload = JSON.stringify({
      deck_id: deckId,
      front: card.front,
      back: card.back
    });
    const cardRes = await httpRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/flashcards',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(cardPayload),
        'Cookie': cookies,
        'Authorization': `Bearer ${token}`
      }
    }, Buffer.from(cardPayload));
    if (cardRes.statusCode === 201) {
      insertedCount++;
    }
  }
  console.log(`[BƯỚC 3 - INSERT DB HOÀN TẤT] Số thẻ insert thành công: ${insertedCount} / ${countAI} thẻ`);

  // 5. Đọc lại từ database qua getDeckById
  const getDeckRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/flashcards/decks/${deckId}`,
    method: 'GET',
    headers: {
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  });

  const cardCountDB = getDeckRes.data?.card_count;
  console.log(`[BƯỚC 4 - ĐỌC LẠI TỪ DB] card_count đọc được từ API getDeckById: ${cardCountDB} thẻ`);

  console.log('\n======================================================');
  console.log('              BẢNG ĐỐI CHIẾU SỐ LƯỢNG THẺ             ');
  console.log('======================================================');
  console.log(`1. Số thẻ AI trả về        : ${countAI}`);
  console.log(`2. Số thẻ insert vào DB    : ${insertedCount}`);
  console.log(`3. card_count đọc lại từ DB: ${cardCountDB}`);
  console.log('------------------------------------------------------');
  if (countAI === insertedCount && insertedCount === cardCountDB) {
    console.log('✅ KHẲNG ĐỊNH: TOÀN BỘ THẺ ĐƯỢC LƯU ĐẦY ĐỦ 100%, KHÔNG MẤT THẺ NÀO!');
  } else {
    console.log('❌ CẢNH BÁO: Số lượng thẻ không đồng nhất!');
  }
  console.log('======================================================\n');
}

runTest().catch(console.error);
