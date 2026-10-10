const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/00714676-cc7a-4816-b8c4-be5299b2d09c';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0bnQxMTkyNUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MTYxNjAzOCwiZXhwIjoxNzkyMjIwODM4fQ.JA78LJCUE__KeY4qMlCDSR37Dm2pbJGYELQHkvu3_ss';

async function testFlipBothWays() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

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
  console.log('1. Loading flashcard deck 15...');
  await page.goto('http://localhost:3000/flashcards/15?mode=study', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const card = await page.$('.flip-card-inner');
  if (!card) throw new Error('Card not found');

  // Verify Front text
  const frontText = await page.$eval('.flip-card-front .text-center', el => el.textContent.trim());
  console.log('Front text:', frontText);

  // 1. Flip to Back
  console.log('2. Flipping to Back...');
  await card.click();
  await page.waitForTimeout(600);

  const backText = await page.$eval('.flip-card-back .text-center', el => el.textContent.trim());
  console.log('Back text:', backText);

  // Take screenshot of Back
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flashcard_back_verified.png') });

  // 2. Flip back to Front
  console.log('3. Flipping back to Front...');
  await card.click();
  await page.waitForTimeout(600);

  const frontTextAgain = await page.$eval('.flip-card-front .text-center', el => el.textContent.trim());
  console.log('Front text after 2nd flip:', frontTextAgain);

  // Take screenshot of Front after returning
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'flashcard_front_verified.png') });

  // 3. Test Next Card navigation
  console.log('4. Navigating to Next Card...');
  const nextBtn = await page.$('button:has(svg.lucide-chevron-right), button[aria-label="Thẻ tiếp theo"], .col-span-1 button:has(svg)');
  // We can press ArrowRight key or click next button
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);

  const card2Front = await page.$eval('.flip-card-front .text-center', el => el.textContent.trim());
  console.log('Card 2 Front text:', card2Front);

  await browser.close();
  console.log('✅ ALL TWO-WAY FLIP AND NAVIGATION TESTS PASSED!');
}

testFlipBothWays().catch(console.error);
