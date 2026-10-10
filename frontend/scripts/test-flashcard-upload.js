const http = require('http');

async function testUrl(url) {
  const boundary = '----WebKitFormBoundaryTest123456';
  const body = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="document"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nHello test content\r\n--' + boundary + '--\r\n')
  ]);

  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          bodySnippet: data.slice(0, 150)
        });
      });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Testing Port 3000 (Next.js proxy):', await testUrl('http://localhost:3000/api/flashcards/generate-from-file'));
  console.log('Testing Port 5000 (Backend direct):', await testUrl('http://localhost:5000/api/flashcards/generate-from-file'));
})();
