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
];

async function reproduce() {
  console.log('=== STARTING LOGOUT REPRODUCTION TEST WITH PLAYWRIGHT ===\n');

  // Step 1: Register or Login a fresh test user via backend directly
  const testUser = {
    email: `repro_${Date.now()}@test.cognito`,
    password: 'Password123!',
    name: 'Repro Tester',
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`
  };

  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  const token = regData.token;
  console.log(`Created test user: ${testUser.email}, initial token length: ${token ? token.length : 'NONE'}\n`);

  if (!token) {
    console.error('Failed to create test user:', regData);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const authEvents = [];
  const unauthorizedResponses = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[AUTH_FE_DEBUG]')) {
      console.log(`>>> BROWSER CONSOLE:`, text);
      authEvents.push({ type: 'CONSOLE', text, timestamp: Date.now() });
    }
  });

  page.on('response', (res) => {
    if (res.status() === 401 || res.status() === 403) {
      const url = res.url();
      // Ignore static files
      if (!url.includes('/_next/')) {
        console.log(`>>> NETWORK ${res.status()}: ${url}`);
        unauthorizedResponses.push({ status: res.status(), url, timestamp: Date.now() });
      }
    }
  });

  // Set token in localStorage
  await page.goto('http://localhost:3000/');
  await page.evaluate((tok) => {
    window.localStorage.setItem('token', tok);
  }, token);

  console.log('--- Initial token set in localStorage ---');

  const routeResults = [];

  for (const route of ROUTES) {
    console.log(`\n>>> Navigating to: ${route}...`);
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500); // Wait for useEffects and API calls

      const tokenState = await page.evaluate(() => window.localStorage.getItem('token'));
      const isStillLoggedIn = !!tokenState;

      console.log(`Route ${route}: Token present? ${isStillLoggedIn ? 'YES' : 'NO (LOGGED OUT!)'}`);

      routeResults.push({
        route,
        isStillLoggedIn,
        tokenPresent: !!tokenState,
        unauthorizedCount: unauthorizedResponses.length,
        authEventsCount: authEvents.length
      });

      if (!isStillLoggedIn) {
        console.log(`🚨 USER WAS LOGGED OUT AT ROUTE: ${route} !`);
        break;
      }
    } catch (err) {
      console.error(`Error navigating to ${route}:`, err.message);
    }
  }

  // Also test refresh and 2nd tab if still logged in
  const currentToken = await page.evaluate(() => window.localStorage.getItem('token'));
  if (currentToken) {
    console.log('\n>>> Testing page reload on /library...');
    await page.goto('http://localhost:3000/library');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const afterReloadToken = await page.evaluate(() => window.localStorage.getItem('token'));
    console.log(`After reload: Token present? ${!!afterReloadToken ? 'YES' : 'NO (LOGGED OUT ON RELOAD!)'}`);

    console.log('\n>>> Testing 2nd tab...');
    const page2 = await context.newPage();
    await page2.goto('http://localhost:3000/library', { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(1500);
    const tab2Token = await page2.evaluate(() => window.localStorage.getItem('token'));
    console.log(`Tab 2: Token present? ${!!tab2Token ? 'YES' : 'NO (LOGGED OUT IN TAB 2!)'}`);
    await page2.close();
  }

  await browser.close();

  const report = {
    testUser: testUser.email,
    routeResults,
    unauthorizedResponses,
    authEvents
  };

  fs.writeFileSync(path.resolve(__dirname, 'reproduction-report.json'), JSON.stringify(report, null, 2));
  console.log('\nSaved reproduction report to frontend/scripts/reproduction-report.json');
}

reproduce().catch(console.error);
