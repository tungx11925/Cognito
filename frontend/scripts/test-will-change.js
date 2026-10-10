const { chromium } = require('playwright');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0bnQxMTkyNUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MTYxNjAzOCwiZXhwIjoxNzkyMjIwODM4fQ.JA78LJCUE__KeY4qMlCDSR37Dm2pbJGYELQHkvu3_ss';

async function test() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{ name: 'token', value: token, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/flashcards/15?mode=study', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Override will-change to auto on .flip-card-inner
  await page.addStyleTag({
    content: `
      .flip-card-inner {
        will-change: auto !important;
      }
    `
  });

  const card = await page.locator('.flip-card-inner');
  await card.click();
  await page.waitForTimeout(800);

  const screenshotPath = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/00714676-cc7a-4816-b8c4-be5299b2d09c/test_will_change_fix.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  const textOnCard = await page.evaluate(() => {
    const rect = document.querySelector('.flip-card-inner').getBoundingClientRect();
    const el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      tagName: el ? el.tagName : null,
      className: el ? el.className : null,
      textContent: el ? el.textContent : null,
      closestFace: el ? el.closest('.flip-card-face')?.className : null
    };
  });
  console.log('Center element on card with will-change: auto:', textOnCard);

  await browser.close();
}

test().catch(console.error);
