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
        const clientDuration = Date.now() - start;
        const fullBuffer = Buffer.concat(data);
        const text = fullBuffer.toString('utf-8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || text,
          clientDuration,
          beDuration: json?.beDurationMs || Number(res.headers['x-be-duration-ms']) || 0,
          aiDuration: json?.aiDurationMs || Number(res.headers['x-ai-duration-ms']) || 0,
          isJson: !!json,
          cardCount: json?.cards?.length || 0,
          snippet: text.substring(0, 300)
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        clientDuration: Date.now() - start
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

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function runBenchmark() {
  console.log('========================================================================');
  console.log('     BENCHMARK 5 LẦN: PROXY (PORT 3000) VS DIRECT (PORT 5000)           ');
  console.log('========================================================================\n');

  // Đăng nhập lấy token
  const loginPayload = JSON.stringify({
    email: 'benchmark_user@cognito.test',
    password: 'Password123!'
  });
  const loginRes = await httpRequest({
    hostname: '127.0.0.1',
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
  if (!cookies && token) cookies = `token=${token}`;

  const docxPayload = createMultipartPayload('document', DOCX_PATH, 'test-benchmark.docx');

  const proxyResults = [];
  const directResults = [];

  // 1. CHẠY 5 LẦN TRỰC TIẾP (PORT 5000)
  console.log('--- 1. CHẠY 5 LẦN DIRECT BACKEND (PORT 5000) ---');
  for (let i = 1; i <= 5; i++) {
    const res = await httpRequest({
      hostname: '127.0.0.1',
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

    const overhead = Math.max(0, res.clientDuration - res.beDuration);
    console.log(`  Lần ${i}: Status ${res.statusCode} | Client: ${res.clientDuration} ms | BE: ${res.beDuration} ms | Pure AI: ${res.aiDuration} ms | Cards: ${res.cardCount}`);
    directResults.push({
      client: res.clientDuration,
      be: res.beDuration,
      ai: res.aiDuration,
      overhead
    });
  }

  // 2. CHẠY 5 LẦN QUA PROXY REWRITE (PORT 3000)
  console.log('\n--- 2. CHẠY 5 LẦN NEXT.JS PROXY (PORT 3000) ---');
  for (let i = 1; i <= 5; i++) {
    const res = await httpRequest({
      hostname: '127.0.0.1',
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

    const overhead = Math.max(0, res.clientDuration - res.beDuration);
    console.log(`  Lần ${i}: Status ${res.statusCode} | Client: ${res.clientDuration} ms | BE: ${res.beDuration} ms | Pure AI: ${res.aiDuration} ms | Proxy Overhead: ${overhead} ms | Cards: ${res.cardCount}`);
    proxyResults.push({
      client: res.clientDuration,
      be: res.beDuration,
      ai: res.aiDuration,
      overhead
    });
  }

  // TÍNH TOÁN TRUNG VỊ
  const directClientMedian = median(directResults.map(r => r.client));
  const directBEMedian = median(directResults.map(r => r.be));
  const directAIMedian = median(directResults.map(r => r.ai));

  const proxyClientMedian = median(proxyResults.map(r => r.client));
  const proxyBEMedian = median(proxyResults.map(r => r.be));
  const proxyAIMedian = median(proxyResults.map(r => r.ai));
  const proxyOverheadMedian = median(proxyResults.map(r => r.overhead));

  console.log('\n========================================================================');
  console.log('                       BẢNG TỔNG HỢP TRUNG VỊ (MEDIAN)                  ');
  console.log('========================================================================');
  console.log(`Chỉ số                         | Direct BE (5000) | Next.js Proxy (3000)`);
  console.log('-------------------------------+------------------+---------------------');
  console.log(`Client Total Time (Trung vị)   | ${String(directClientMedian).padEnd(16)} | ${String(proxyClientMedian).padEnd(19)}`);
  console.log(`Backend Total Time (Trung vị)  | ${String(directBEMedian).padEnd(16)} | ${String(proxyBEMedian).padEnd(19)}`);
  console.log(`Backend Pure AI Time (Trung vị)| ${String(directAIMedian).padEnd(16)} | ${String(proxyAIMedian).padEnd(19)}`);
  console.log(`Overhead Proxy (Trung vị)      | ${String(0).padEnd(16)} | ${String(proxyOverheadMedian).padEnd(19)}`);
  console.log('========================================================================\n');

  // 3. KIỂM THỬ XỬ LÝ DÀI HƠN 30 GIÂY VỚI PROXY TIMEOUT 180s
  console.log('--- 3. KIỂM THỬ PROXY VỚI AI CHẠY LÂU (> 30s) (KIỂM CHỨNG proxyTimeout 180s) ---');
  console.log('Tạo file tài liệu lớn với nhiều phần để AI xử lý trên 30 giây...');
  
  const largeTxtPath = path.resolve(__dirname, 'temp-large-doc.txt');
  fs.writeFileSync(largeTxtPath, 'CHỦ ĐỀ: TỔNG QUAN KHOA HỌC MÁY TÍNH VÀ TRÍ TUỆ NHÂN TẠO\n\n' + 'Nội dung kiến thức chuyên sâu về Deep Learning, Transformer, Backpropagation, CNN, RNN, LLM, KV Cache, Flash Attention, LoRA, Quantization, GPU Kernel Optimization...\n'.repeat(300));

  const largeTxtPayload = {
    body: Buffer.from(
      `------BoundaryLarge\r\nContent-Disposition: form-data; name="document"; filename="large-study-doc.txt"\r\nContent-Type: text/plain\r\n\r\n` +
      fs.readFileSync(largeTxtPath, 'utf-8') +
      `\r\n------BoundaryLarge--\r\n`
    ),
    contentType: 'multipart/form-data; boundary=----BoundaryLarge'
  };

  const longStart = Date.now();
  console.log('Đang gửi request qua Proxy port 3000 (chờ xử lý > 30s)...');
  const longRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/flashcards/generate-from-file',
    method: 'POST',
    headers: {
      'Content-Type': largeTxtPayload.contentType,
      'Content-Length': largeTxtPayload.body.length,
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, largeTxtPayload.body);

  const longDuration = Date.now() - longStart;
  console.log(`\n  -> Kết quả kiểm thử > 30s qua Proxy:`);
  console.log(`  -> HTTP Status: ${longRes.statusCode}`);
  console.log(`  -> Client Duration: ${longDuration} ms (${(longDuration / 1000).toFixed(1)}s)`);
  console.log(`  -> Backend Duration: ${longRes.beDuration} ms`);
  console.log(`  -> Pure AI Duration: ${longRes.aiDuration} ms`);
  console.log(`  -> Thẻ sinh ra: ${longRes.cardCount} thẻ`);
  console.log(`  -> Is valid JSON: ${longRes.isJson}`);
  if (longRes.statusCode === 200 && longRes.isJson) {
    console.log('  -> ✅ THÀNH CÔNG RỰC RỠ: Proxy không bị timeout, nhận đầy đủ JSON!');
  } else {
    console.log('  -> ❌ Thất bại:', longRes.snippet);
  }

  // Dọn file tạm
  if (fs.existsSync(largeTxtPath)) fs.unlinkSync(largeTxtPath);
}

runBenchmark().catch(console.error);
