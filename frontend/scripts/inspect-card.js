const { chromium } = require('playwright');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJ0bnQxMTkyNUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc5MTYxNjAzOCwiZXhwIjoxNzkyMjIwODM4fQ.JA78LJCUE__KeY4qMlCDSR37Dm2pbJGYELQHkvu3_ss';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'token', value: token, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/flashcards/15?mode=study', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const card = await page.locator('.flip-card-inner');
  await card.click();
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const inner = document.querySelector('.flip-card-inner');
    const front = document.querySelector('.flip-card-front');
    const back = document.querySelector('.flip-card-back');
    const scene = document.querySelector('.flip-card-scene');

    function getStyle(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        className: el.className,
        transform: s.transform,
        transformStyle: s.transformStyle,
        perspective: s.perspective,
        backfaceVisibility: s.backfaceVisibility,
        webkitBackfaceVisibility: s.webkitBackfaceVisibility,
        zIndex: s.zIndex,
        opacity: s.opacity,
        display: s.display,
        visibility: s.visibility,
        offsetWidth: el.offsetWidth,
        offsetHeight: el.offsetHeight,
        innerHTMLSnippet: el.innerHTML.slice(0, 100)
      };
    }

    // Also check all ancestors for transform or filter or will-change
    const ancestors = [];
    let curr = inner;
    while (curr && curr !== document.body) {
      const cs = window.getComputedStyle(curr);
      ancestors.push({
        tag: curr.tagName,
        className: curr.className,
        transform: cs.transform,
        transformStyle: cs.transformStyle,
        perspective: cs.perspective,
        overflow: cs.overflow,
        filter: cs.filter,
        backdropFilter: cs.backdropFilter,
        opacity: cs.opacity,
        willChange: cs.willChange,
        contain: cs.contain
      });
      curr = curr.parentElement;
    }

    return {
      scene: getStyle(scene),
      inner: getStyle(inner),
      front: getStyle(front),
      back: getStyle(back),
      ancestors
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

inspect().catch(console.error);
