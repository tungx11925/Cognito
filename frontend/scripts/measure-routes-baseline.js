const { chromium } = require('playwright');
const jwt = require('../../backend/node_modules/jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read backend .env to get JWT_SECRET_KEY
let jwtSecret = 'supersecretjwtkeyforlocaldevelopment1234567890';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../../backend/.env'), 'utf8');
  const match = envContent.match(/JWT_SECRET_KEY=(.*)/);
  if (match) jwtSecret = match[1].trim();
} catch (e) {}

const userToken = jwt.sign({ id: 1040, email: 'free_user_1790852087603@example.com', role: 'user' }, jwtSecret);
const adminToken = jwt.sign({ id: 1040, email: 'free_user_1790852087603@example.com', role: 'admin' }, jwtSecret);

const ROUTES = [
  { path: '/', name: 'Landing /' },
  { path: '/_not-found', name: '404 /_not-found' },
  { path: '/admin', name: 'Admin Dashboard', isAdmin: true },
  { path: '/ai-test', name: 'AI Test Workspace' },
  { path: '/community', name: 'Community Resource Exchange' },
  { path: '/flashcards', name: 'Flashcard Decks' },
  { path: '/flashcards/2', name: 'Flashcard Study [deckId]' },
  { path: '/focus', name: 'Focus Mode' },
  { path: '/home', name: 'Home Feed' },
  { path: '/leaderboard', name: 'Leaderboard' },
  { path: '/library', name: 'Library Documents' },
  { path: '/messages', name: 'Messages Direct Chat' },
  { path: '/mindmap', name: 'Mindmap Workspace' },
  { path: '/notes', name: 'Notes Workspace' },
  { path: '/premium', name: 'Premium Pricing' },
  { path: '/premium/return', name: 'Payment Return' },
  { path: '/premium/sandbox-checkout', name: 'Sandbox Checkout' },
  { path: '/profile', name: 'User Profile' },
  { path: '/profile/1040', name: 'Public Profile [userId]' },
  { path: '/progress', name: 'Progress Analytics' },
  { path: '/quiz', name: 'Quiz Hub' },
  { path: '/quiz/1', name: 'Quiz Attempt [testSetId]' },
  { path: '/reset-password', name: 'Reset Password' },
  { path: '/search', name: 'Global Search' },
  { path: '/settings', name: 'Settings' },
  { path: '/shared/df88584accad8025a26465cd2b2207d7', name: 'Shared Link [token]' },
  { path: '/study-sessions', name: 'Study Sessions' },
  { path: '/viewer/793', name: 'Document Viewer [id]' },
];

async function measureRoute(browser, route) {
  const context = await browser.newContext();
  const page = await context.newPage();

  const token = route.isAdmin ? adminToken : userToken;

  // Pre-seed token in localStorage before navigation
  await page.addInitScript((tok) => {
    window.localStorage.setItem('token', tok);
  }, token);

  const requests = [];
  const errors = [];

  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 120));
    }
  });

  const startTime = Date.now();
  let status = 0;

  try {
    const response = await page.goto(`http://localhost:3000${route.path}`, {
      waitUntil: 'load',
      timeout: 10000,
    });
    status = response ? response.status() : 0;
    // Wait briefly for hydration & initial fetch cycle
    await page.waitForTimeout(1000);
  } catch (err) {
    errors.push(err.message.substring(0, 100));
  }

  const durationMs = Date.now() - startTime;

  // Analyze requests
  const xhrFetch = requests.filter(r => r.resourceType === 'fetch' || r.resourceType === 'xhr');
  const urlCounts = {};
  for (const r of xhrFetch) {
    const cleanUrl = r.url.split('?')[0];
    urlCounts[cleanUrl] = (urlCounts[cleanUrl] || 0) + 1;
  }

  const duplicateUrls = Object.entries(urlCounts)
    .filter(([_, count]) => count > 1)
    .map(([url, count]) => `${url.replace('http://localhost:3000', '')} (x${count})`);

  await context.close();

  return {
    route: route.path,
    name: route.name,
    status,
    durationMs,
    totalRequests: requests.length,
    xhrFetchCount: xhrFetch.length,
    duplicateCount: duplicateUrls.length,
    duplicateDetails: duplicateUrls.join('; '),
    errorsCount: errors.length,
  };
}

// Measure client-side page transitions for A4
async function measureTransition(browser, fromPath, toPath) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript((tok) => {
    window.localStorage.setItem('token', tok);
  }, userToken);

  await page.goto(`http://localhost:3000${fromPath}`, { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(1000);

  // Measure in-app client navigation
  const navStart = Date.now();
  await page.evaluate((target) => {
    window.location.href = target;
  }, `http://localhost:3000${toPath}`);

  await page.waitForLoadState('domcontentloaded');
  const navDurationMs = Date.now() - navStart;

  await context.close();
  return navDurationMs;
}

async function run() {
  console.log('=== STARTING PLAYWRIGHT ROUTE BASELINE MEASUREMENT (PRODUCTION: NEXT START) ===');
  const browser = await chromium.launch({ headless: true });

  const results = [];
  for (const r of ROUTES) {
    process.stdout.write(`Measuring ${r.path}... `);
    const res = await measureRoute(browser, r);
    console.log(`[${res.status}] ${res.durationMs}ms | Requests: ${res.totalRequests} (XHR: ${res.xhrFetchCount}, Dups: ${res.duplicateCount})`);
    results.push(res);
  }

  console.log('\n=== MEASURING PAGE TRANSITIONS (A4 - PRODUCTION NEXT START) ===');
  const pairs = [
    { from: '/library', to: '/notes' },
    { from: '/notes', to: '/library' },
    { from: '/library', to: '/flashcards' },
    { from: '/flashcards', to: '/library' },
    { from: '/home', to: '/community' },
    { from: '/community', to: '/home' },
    { from: '/viewer/793', to: '/quiz' },
    { from: '/quiz', to: '/viewer/793' },
  ];

  const transitionResults = [];
  for (const pair of pairs) {
    const ms = await measureTransition(browser, pair.from, pair.to);
    console.log(`Transition ${pair.from} -> ${pair.to}: ${ms}ms`);
    transitionResults.push({ ...pair, durationMs: ms });
  }

  await browser.close();

  // Save report JSON
  const output = {
    timestamp: new Date().toISOString(),
    routes: results,
    transitions: transitionResults,
  };
  fs.writeFileSync(path.resolve(__dirname, 'baseline-a3-a4.json'), JSON.stringify(output, null, 2));
  console.log('\nSaved baseline results to frontend/scripts/baseline-a3-a4.json');
}

run().catch(console.error);
