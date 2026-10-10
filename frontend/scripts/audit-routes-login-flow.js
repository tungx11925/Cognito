const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  '/library',
  '/notes',
  '/mindmap',
  '/flashcards',
  '/quiz',
  '/ai-test',
  '/focus',
  '/study-sessions',
  '/progress',
  '/community',
  '/messages',
  '/search',
  '/profile',
  '/settings',
  '/premium',
  '/viewer/793',
  '/admin', // test 403 behavior
];

async function runAudit() {
  console.log('=== STARTING AUDIT: LOGIN FLOW + LOG-ONLY ACROSS ALL ROUTES ===\n');

  // Step 1: Call real LOGIN endpoint
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test_login_user@cognito.test',
      password: 'Password123!'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`[LOGIN] Status: ${loginRes.status}, token length: ${token ? token.length : 'NONE'}\n`);

  if (!token) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Set cookie in browser context if backend issued it
  await context.addCookies([
    {
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }
  ]);

  const page = await context.newPage();

  const rejectedRequests = [];
  const consoleAuthLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[AUTH_FE_DEBUG]')) {
      consoleAuthLogs.push({ text, timestamp: Date.now() });
    }
  });

  page.on('response', async (res) => {
    const status = res.status();
    const url = res.url();
    if ((status === 401 || status === 403) && !url.includes('/_next/')) {
      let bodySnippet = '';
      try {
        const text = await res.text();
        bodySnippet = text.substring(0, 100);
      } catch (e) {}
      rejectedRequests.push({
        status,
        url: url.replace('http://localhost:3000', '').replace('http://localhost:5000', ''),
        method: res.request().method(),
        body: bodySnippet,
      });
      console.log(`  [HTTP ${status}] ${res.request().method()} ${url} -> ${bodySnippet}`);
    }
  });

  // Seed token in localStorage
  await page.goto('http://localhost:3000/');
  await page.evaluate((tok) => {
    window.localStorage.setItem('token', tok);
  }, token);

  const routeResults = [];

  for (const route of ROUTES) {
    process.stdout.write(`Visiting ${route}... `);
    const beforeCount = rejectedRequests.length;
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500); // Wait for async requests
    const newRejections = rejectedRequests.slice(beforeCount);
    console.log(`Finished (401/403 errors: ${newRejections.length})`);

    routeResults.push({
      route,
      rejections: newRejections,
    });
  }

  // Reload test on /library
  console.log('\nTesting reload on /library...');
  const reloadBefore = rejectedRequests.length;
  await page.goto('http://localhost:3000/library');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const reloadRejections = rejectedRequests.slice(reloadBefore);
  console.log(`Reload finished (401/403 errors: ${reloadRejections.length})`);

  // Tab 2 test
  console.log('\nTesting tab 2 on /library...');
  const page2 = await context.newPage();
  const tab2Before = rejectedRequests.length;
  await page2.goto('http://localhost:3000/library', { waitUntil: 'domcontentloaded' });
  await page2.waitForTimeout(1500);
  const tab2Rejections = rejectedRequests.slice(tab2Before);
  console.log(`Tab 2 finished (401/403 errors: ${tab2Rejections.length})`);
  await page2.close();

  await browser.close();

  const summary = {
    total401or403: rejectedRequests.length,
    rejectedRequests,
    routeResults,
    consoleAuthLogs
  };

  fs.writeFileSync(path.resolve(__dirname, 'login-audit-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nSaved summary to frontend/scripts/login-audit-summary.json');
}

runAudit().catch(console.error);
