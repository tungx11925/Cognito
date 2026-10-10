const fs = require('fs');
const path = require('path');
const http = require('http');

const DOCX_PATH = path.resolve(__dirname, '../../backend/uploads/1780904598556-753157900.docx');

function httpRequest(options, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        const fullBuffer = Buffer.concat(data);
        const text = fullBuffer.toString('utf-8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || text,
          duration,
          isJson: !!json,
          snippet: text.substring(0, 300)
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        duration: Date.now() - start
      });
    });
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
  console.log('=== ĐIỀU TRA ROOT CAUSE NEXT_PUBLIC_API_URL (PROXY 3000 VS TRỰC TIẾP 5000) ===\n');

  // 1. Đăng nhập qua BE để lấy cookie
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
  let cookies = (loginRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
  if (!cookies && token) {
    cookies = `token=${token}`;
  }
  console.log(`[AUTH] Login Status: ${loginRes.statusCode}, Token: ${token ? 'Có token' : 'KHÔNG'}, Cookie: ${cookies}\n`);

  const docxPayload = createMultipartPayload('document', DOCX_PATH, 'test-doc.docx');

  // TEST 1: Gửi qua Backend trực tiếp (Port 5000)
  console.log('--- TEST 1: Gửi trực tiếp tới Backend (http://localhost:5000/api/flashcards/generate-from-file) ---');
  const directRes = await httpRequest({
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

  console.log(`  -> Status: ${directRes.statusCode}`);
  console.log(`  -> Thời gian: ${directRes.duration} ms`);
  console.log(`  -> Content-Type: ${directRes.headers['content-type']}`);
  console.log(`  -> Is JSON: ${directRes.isJson}`);
  if (directRes.isJson && directRes.data?.cards) {
    console.log(`  -> Sinh được: ${directRes.data.cards.length} thẻ`);
  } else {
    console.log(`  -> Snippet: ${directRes.snippet}`);
  }

  // TEST 2: Gửi qua Next.js Dev Server (Port 3000 /api rewrite)
  console.log('\n--- TEST 2: Gửi qua Next.js Proxy (http://localhost:3000/api/flashcards/generate-from-file) ---');
  const proxyRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/flashcards/generate-from-file',
    method: 'POST',
    headers: {
      'Content-Type': docxPayload.contentType,
      'Content-Length': docxPayload.body.length,
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, docxPayload.body);

  console.log(`  -> Status: ${proxyRes.statusCode}`);
  console.log(`  -> Thời gian: ${proxyRes.duration} ms`);
  console.log(`  -> Content-Type: ${proxyRes.headers ? proxyRes.headers['content-type'] : 'N/A'}`);
  console.log(`  -> Is JSON: ${proxyRes.isJson}`);
  if (proxyRes.isJson && proxyRes.data?.cards) {
    console.log(`  -> Sinh được: ${proxyRes.data.cards.length} thẻ`);
  } else {
    console.log(`  -> Snippet: ${proxyRes.snippet}`);
  }

  console.log('\n=== KẾT THÚC ĐIỀU TRA ===');
}

runTest().catch(console.error);
