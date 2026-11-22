import puppeteer from 'puppeteer-core';
import path from 'node:path';

async function generateOgImage() {
  const outputPath = path.resolve('public/og-default.png');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: #0c120f;
      color: #f0fdf4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 80px;
      overflow: hidden;
      position: relative;
    }
    .grid-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image:
        radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(5, 150, 105, 0.15) 0%, transparent 40%);
      z-index: 0;
    }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-square {
      width: 48px;
      height: 48px;
      background: #a3e635;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(163, 230, 53, 0.3);
    }
    .brand-name {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #10b981;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      width: fit-content;
    }
    .headline {
      font-size: 54px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: #ffffff;
      max-width: 980px;
    }
    .subtext {
      font-size: 24px;
      color: #94a3b8;
      line-height: 1.4;
      max-width: 860px;
    }
    .footer-row {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
    }
    .tags {
      display: flex;
      gap: 12px;
    }
    .tag {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .domain {
      font-size: 20px;
      font-weight: 700;
      color: #10b981;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="content">
    <div class="brand-row">
      <div class="logo-square">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0c120f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
          <line x1="16" y1="14" x2="16" y2="18" />
        </svg>
      </div>
      <span class="brand-name">Seller Calc Hub</span>
      <div class="badge">100% Verified Fee Rates</div>
    </div>

    <div class="headline">
      Free, Fast Marketplace Fee &amp; Profit Calculators
    </div>

    <div class="subtext">
      Accurate forward &amp; reverse profit calculations for online resellers. Know your exact fees, net margins, and break-even price before you list.
    </div>
  </div>

  <div class="footer-row">
    <div class="tags">
      <div class="tag">Whatnot</div>
      <div class="tag">TikTok Shop</div>
      <div class="tag">Depop</div>
      <div class="tag">Etsy</div>
      <div class="tag">eBay</div>
      <div class="tag">Twitch Bits</div>
    </div>
    <div class="domain">SellerCalcHub.com</div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`[OG Image Generator] Created ${outputPath} (1200x630)`);
  } finally {
    await browser.close();
  }
}

generateOgImage().catch((err) => {
  console.error('[OG Image Generator] Error:', err);
  process.exit(1);
});
