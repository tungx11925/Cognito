const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .scene {
          width: 400px;
          height: 300px;
          perspective: 1000px;
        }
        .card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.5s;
        }
        .card.is-flipped {
          transform: rotateY(180deg);
        }
        .face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .face-front {
          background: lightblue;
        }
        .face-back {
          background: lightgreen;
          transform: rotateY(180deg);
        }
      </style>
    </head>
    <body>
      <div class="scene">
        <div class="card is-flipped">
          <div class="face face-front">FRONT TEXT</div>
          <div class="face face-back">BACK TEXT</div>
        </div>
      </div>
    </body>
    </html>
  `);
  const el = await page.evaluate(() => {
    const rect = document.querySelector('.card').getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit ? hit.textContent : null;
  });
  console.log('HIT IN MINIMAL TEST:', el);

  const screenshot = await page.screenshot();
  require('fs').writeFileSync('C:/Users/lenovo/.gemini/antigravity-ide/brain/00714676-cc7a-4816-b8c4-be5299b2d09c/minimal_flip.png', screenshot);
  console.log('Saved minimal_flip.png');

  await browser.close();
}

test().catch(console.error);
