const { chromium } = require('playwright');

async function checkHydration() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  const res = await page.goto('http://localhost:3000/', { waitUntil: 'load' });
  console.log('Navigated with status:', res.status());
  const html = await page.content();
  console.log('HTML SNIPPET:', html.substring(0, 1000));
  await browser.close();
}

checkHydration();
