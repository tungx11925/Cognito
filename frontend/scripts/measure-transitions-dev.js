const { chromium } = require('playwright');
const jwt = require('../../backend/node_modules/jsonwebtoken');
const fs = require('fs');
const path = require('path');

let jwtSecret = 'supersecretjwtkeyforlocaldevelopment1234567890';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../../backend/.env'), 'utf8');
  const match = envContent.match(/JWT_SECRET_KEY=(.*)/);
  if (match) jwtSecret = match[1].trim();
} catch (e) {}

const userToken = jwt.sign({ id: 1040, email: 'free_user_1790852087603@example.com', role: 'user' }, jwtSecret);

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

async function measureDevTransitions() {
  console.log('=== MEASURING PAGE TRANSITIONS (A4 - DEVELOPMENT NEXT DEV) ===');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pair of pairs) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.addInitScript((tok) => {
      window.localStorage.setItem('token', tok);
    }, userToken);

    // Initial load on 'from' route
    const fromStart = Date.now();
    await page.goto(`http://localhost:3000${pair.from}`, { waitUntil: 'load', timeout: 30000 });
    const fromLoadMs = Date.now() - fromStart;

    // Transition to 'to' route (triggers on-demand compilation in dev!)
    const navStart = Date.now();
    await page.evaluate((target) => {
      window.location.href = target;
    }, `http://localhost:3000${pair.to}`);

    await page.waitForLoadState('load', { timeout: 30000 });
    const transitionMs = Date.now() - navStart;

    console.log(`DEV Transition ${pair.from} -> ${pair.to}: ${transitionMs}ms (Initial load was ${fromLoadMs}ms)`);
    results.push({
      from: pair.from,
      to: pair.to,
      fromLoadMs,
      transitionMs,
    });

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.resolve(__dirname, 'dev-transitions-a4.json'), JSON.stringify(results, null, 2));
  console.log('Saved DEV transitions to frontend/scripts/dev-transitions-a4.json');
}

measureDevTransitions().catch(console.error);
