const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/lenovo/.gemini/antigravity-ide/brain/00714676-cc7a-4816-b8c4-be5299b2d09c';

async function run() {
  console.log('--- CAPTURING PHASE 40 VISUAL EVIDENCE ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    // 1. Footer Light Mode
    console.log('1. Navigating to landing page http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footerElement = await page.$('footer');
    if (footerElement) {
      const footerLightPath = path.join(ARTIFACT_DIR, 'phase40_footer_light.png');
      await footerElement.screenshot({ path: footerLightPath });
      console.log(`✅ Saved Footer Light Mode screenshot: ${footerLightPath}`);
    } else {
      console.warn('⚠️ Footer element not found!');
    }

    // 2. Footer Dark Mode
    console.log('2. Switching to Dark Mode and capturing Footer...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(600);
    if (footerElement) {
      const footerDarkPath = path.join(ARTIFACT_DIR, 'phase40_footer_dark.png');
      await footerElement.screenshot({ path: footerDarkPath });
      console.log(`✅ Saved Footer Dark Mode screenshot: ${footerDarkPath}`);
    }

    // Reset dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    // 3. Community Feed (OER Documents from Thư viện mở Cognito)
    console.log('3. Navigating to Community Feed http://localhost:3000/community...');
    await page.goto('http://localhost:3000/community', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const communityPath = path.join(ARTIFACT_DIR, 'phase40_community_feed.png');
    await page.screenshot({ path: communityPath, fullPage: false });
    console.log(`✅ Saved Community Feed screenshot: ${communityPath}`);

    // Check presence of "Thư viện mở Cognito"
    const pageText = await page.textContent('body');
    const hasOER = pageText.includes('Thư viện mở Cognito') || pageText.includes('Nguồn mở') || pageText.includes('OpenStax') || pageText.includes('Kinh tế lượng');
    console.log(`- Community Feed OER verification: ${hasOER ? 'PRESENT' : 'NOT FOUND'}`);

    // 4. Search Page (Verifying No Test Data)
    console.log('4. Navigating to Search Page http://localhost:3000/search?q=Kinh+tế...');
    await page.goto('http://localhost:3000/search?q=Kinh+tế', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const searchPath = path.join(ARTIFACT_DIR, 'phase40_search_clean.png');
    await page.screenshot({ path: searchPath, fullPage: false });
    console.log(`✅ Saved Search Clean screenshot: ${searchPath}`);

    const searchText = await page.textContent('body');
    const hasP30Test = searchText.includes('P30 Student') || searchText.includes('Người dùng 260');
    console.log(`- Search page test user presence: ${hasP30Test ? 'FAILED (found test user)' : 'PASSED (no test users)'}`);

    // 5. Mobile 375px Footer Audit
    console.log('5. Auditing Mobile 375px layout...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const mobileFooterPath = path.join(ARTIFACT_DIR, 'phase40_footer_mobile_375.png');
    if (footerElement) {
      const mobileFooterEl = await page.$('footer');
      await mobileFooterEl.screenshot({ path: mobileFooterPath });
      console.log(`✅ Saved Mobile 375px Footer screenshot: ${mobileFooterPath}`);
    }

    console.log('\n--- ALL VISUAL AUDIT SCREENSHOTS CAPTURED SUCCESSFULLY ---');

  } catch (err) {
    console.error('❌ Error during visual evidence capture:', err);
  } finally {
    await browser.close();
  }
}

run();
