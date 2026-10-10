const { chromium } = require('playwright');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0bnQxMTkyNUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MTYxNjAzOCwiZXhwIjoxNzkyMjIwODM4fQ.JA78LJCUE__KeY4qMlCDSR37Dm2pbJGYELQHkvu3_ss';

async function test() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{ name: 'token', value: token, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/flashcards/15?mode=study', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const cssDump = await page.evaluate(() => {
    const el = document.querySelector('.flip-card-inner');
    const front = document.querySelector('.flip-card-front');
    const back = document.querySelector('.flip-card-back');

    function getMatchedRules(node) {
      const matched = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && node.matches(rule.selectorText)) {
              matched.push({ selector: rule.selectorText, cssText: rule.cssText });
            }
          }
        } catch (e) {}
      }
      return matched;
    }

    return {
      innerRules: getMatchedRules(el),
      frontRules: getMatchedRules(front),
      backRules: getMatchedRules(back)
    };
  });

  console.log('CSS DUMP:', JSON.stringify(cssDump, null, 2));
  await browser.close();
}

test().catch(console.error);
