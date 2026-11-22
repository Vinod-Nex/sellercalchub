import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const LLMS_TXT = path.resolve(DIST_DIR, 'llms.txt');
const ROBOTS_TXT = path.resolve(DIST_DIR, 'robots.txt');

const KEY_PAGES = [
  { slug: 'ebay-fee-calculator', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'ebay-fee-calculator-uk', expectedRate: '0%', platform: 'eBay UK' },
  { slug: 'etsy-fee-calculator', expectedRate: '6.5%', platform: 'Etsy' },
  { slug: 'whatnot-fee-calculator', expectedRate: '8.0%', platform: 'Whatnot' },
  { slug: 'tiktok-shop-fee-calculator', expectedRate: '6.0%', platform: 'TikTok Shop' },
  { slug: 'depop-fee-calculator', expectedRate: '0%', platform: 'Depop' },
  { slug: 'twitch-bits-to-usd', expectedRate: '$0.01', platform: 'Twitch' },
  { slug: 'ebay-shipping-fee-calculator', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'ebay-final-value-fee-calculator', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'ebay-profit-calculator', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'ebay-and-paypal-fee-calculator', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'etsy-offsite-ads-fee-calculator', expectedRate: '12.0%', platform: 'Etsy' },
  { slug: 'marketplace-fee-calculators', expectedRate: '13.25%', platform: 'Marketplace' },
  { slug: 'guides/how-ebay-calculates-fees', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'guides/does-ebay-charge-fees-on-shipping', expectedRate: '13.25%', platform: 'eBay' },
  { slug: 'guides/whatnot-fees-explained', expectedRate: '8.0%', platform: 'Whatnot' },
];

describe('Phase 44: AI-Search Readiness & llms.txt Standard', () => {
  it('validates llms.txt exists at root and adheres to llms.txt standard', () => {
    expect(fs.existsSync(LLMS_TXT), 'dist/llms.txt must exist at root').toBe(true);

    const content = fs.readFileSync(LLMS_TXT, 'utf-8');

    // Standard Heading and Summary Blockquote
    expect(content).toContain('# Seller Calc Hub');
    expect(content).toMatch(/^>\s+/m);

    // Section 1: Marketplace Fee Calculators
    expect(content).toContain('## Marketplace Fee Calculators');
    for (const page of KEY_PAGES) {
      if (!page.slug.startsWith('guides/')) {
        expect(content, `llms.txt must list ${page.slug}`).toContain(page.slug);
      }
    }

    // Section 2: Reseller Fee Guides
    expect(content).toContain('## Reseller Fee Guides');
    expect(content).toContain('guides/how-ebay-calculates-fees');
    expect(content).toContain('guides/does-ebay-charge-fees-on-shipping');
    expect(content).toContain('guides/whatnot-fees-explained');

    // Section 3: Verification & Methodology
    expect(content).toContain('## Verification & Trust Signals');
    expect(content).toContain('No Invented Rates');
    expect(content).toContain('SSG Architecture');
  });

  it('verifies robots.txt references llms.txt for AI crawlers', () => {
    expect(fs.existsSync(ROBOTS_TXT), 'dist/robots.txt must exist').toBe(true);

    const content = fs.readFileSync(ROBOTS_TXT, 'utf-8');
    expect(content).toContain('llms.txt');
  });

  it('CHECK: the answer is readable in the raw HTML with JavaScript off', () => {
    for (const item of KEY_PAGES) {
      const htmlFile = path.join(DIST_DIR, item.slug, 'index.html');
      expect(fs.existsSync(htmlFile), `HTML file for ${item.slug} must exist`).toBe(true);

      const rawHtml = fs.readFileSync(htmlFile, 'utf-8');

      // 1. Locate the <h1> in raw static HTML
      const h1Match = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      expect(h1Match, `Page ${item.slug} must render an <h1> in static HTML`).not.toBeNull();

      // 2. Locate the first paragraph following the <h1>
      const afterH1 = rawHtml.slice(h1Match!.index! + h1Match![0].length);
      const pMatch = afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      expect(pMatch, `Page ${item.slug} must contain a paragraph after <h1>`).not.toBeNull();

      const directAnswer = pMatch![1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // The direct answer paragraph must contain the key rate / factual answer
      expect(
        directAnswer.length,
        `Direct answer on ${item.slug} must have substantial text (actual: ${directAnswer.length} chars)`
      ).toBeGreaterThanOrEqual(100);

      expect(
        directAnswer.includes(item.expectedRate),
        `Direct answer on ${item.slug} must contain verified rate "${item.expectedRate}" in raw HTML (actual: "${directAnswer.slice(0, 150)}...")`
      ).toBe(true);

      // 3. Raw HTML must contain the verified date stamp
      const hasVerifiedDate = /verified(?:\s+on|\s*:\s*|.*?2026)/i.test(rawHtml);
      expect(
        hasVerifiedDate,
        `Page ${item.slug} must display verified date in raw HTML without JavaScript`
      ).toBe(true);

      // 4. Raw HTML must name its official data source URL or official source name
      const hasSource =
        /official\s+source|help\.(?:ebay|etsy|whatnot|twitch)|source_url|methodology|seller-us\.tiktok|depophelp/i.test(
          rawHtml
        );
      expect(
        hasSource,
        `Page ${item.slug} must cite its official data source in raw HTML without JavaScript`
      ).toBe(true);

      // 5. Raw HTML must preserve the interactive calculator or converter island
      if (!item.slug.startsWith('guides/')) {
        const hasInteractiveIsland =
          /data-calculator|id=["']calculator["']|<form|class=["'][^"']*calculator|twitch-bits-converter|converter/i.test(
            rawHtml
          );
        expect(
          hasInteractiveIsland,
          `Page ${item.slug} must preserve its interactive calculator/converter island`
        ).toBe(true);
      }
    }
  });
});
