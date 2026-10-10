const http = require('http');

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

async function runTest() {
  console.log('=== KIỂM CHỨNG BATCH DISTRACTION EVENTS (GỘP ĐẾM VÀ GỬI THEO LÔ) ===\n');

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

  // 2. Start Focus Session
  const startPayload = JSON.stringify({
    target_duration_seconds: 1500
  });
  const startRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/focus/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(startPayload),
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, Buffer.from(startPayload));

  const sessionId = startRes.data?.id;
  console.log(`[BƯỚC 1] Khởi tạo phiên tập trung thành công, Session ID: ${sessionId}`);

  // 3. Gửi lô 5 sự kiện xao nhãng cùng lúc (Batch Queue)
  const batchEventsPayload = JSON.stringify({
    events: [
      { event_type: 'PAGE_BLUR', duration_seconds: 2, details: { blurCount: 1 } },
      { event_type: 'TAB_SWITCH', duration_seconds: 5, details: { tab: 'youtube' } },
      { event_type: 'PAGE_HIDDEN', duration_seconds: 10, details: { hidden: true } },
      { event_type: 'IDLE', duration_seconds: 60, details: { idle: true } },
      { event_type: 'RETURNED', duration_seconds: 0, details: { back: true } },
    ]
  });

  console.log('[BƯỚC 2] Gửi 1 request duy nhất chứa lô 5 sự kiện xao nhãng...');
  const batchRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/focus/${sessionId}/distraction`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(batchEventsPayload),
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, Buffer.from(batchEventsPayload));

  console.log(`  -> Status: ${batchRes.statusCode}`);
  console.log(`  -> Kết quả nhận về:`, batchRes.data);

  if (batchRes.statusCode === 200 && batchRes.data?.addedCount === 5 && batchRes.data?.distractionCount === 5) {
    console.log('✅ ĐÃ KIỂM CHỨNG: Ghi nhận trọn vẹn 5/5 sự kiện trong 1 request lô duy nhất, distraction_count = 5!');
  } else {
    throw new Error('Ghi nhận lô sự kiện thất bại!');
  }

  // 4. Kết thúc phiên và xem summary
  const finishPayload = JSON.stringify({
    status: 'COMPLETED',
    actual_duration_seconds: 120
  });
  const finishRes = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/focus/${sessionId}/finish`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(finishPayload),
      'Cookie': cookies,
      'Authorization': `Bearer ${token}`
    }
  }, Buffer.from(finishPayload));

  console.log(`[BƯỚC 3] Kết thúc phiên thành công, Status: ${finishRes.statusCode}`);
  console.log('=== HOÀN TẤT KIỂM CHỨNG BATCH DISTRACTION ===\n');
}

runTest().catch(console.error);
