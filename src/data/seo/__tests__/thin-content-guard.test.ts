import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractPageContent,
  checkThinContent,
  scanDistHtmlFiles,
  computeShingleSimilarity,
  type ThinContentPage,
} from '../../../../scripts/check-thin-content';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

describe('Phase 43: Thin-Content Guard & Anti-Cannibalization Verification', () => {
  it('verifies all built production indexable pages pass thin-content standards', () => {
    expect(fs.existsSync(DIST_DIR), 'dist directory must exist').toBe(true);

    const htmlFiles = scanDistHtmlFiles(DIST_DIR);
    expect(htmlFiles.length, 'Must have built HTML files').toBeGreaterThanOrEqual(25);

    const pages = htmlFiles.map((f) => extractPageContent(fs.readFileSync(f, 'utf-8'), f, DIST_DIR));
    const indexablePages = pages.filter((p) => p.isIndexable);

    expect(indexablePages.length, 'Must have at least 25 public indexable pages').toBeGreaterThanOrEqual(25);

    // Run guard check
    const violations = checkThinContent(pages);
    expect(
      violations,
      `Found thin content violations in dist: ${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);

    // Explicitly verify word counts
    for (const page of indexablePages) {
      expect(
        page.wordCount,
        `Page ${page.url} must have at least 300 words of body text (actual: ${page.wordCount})`
      ).toBeGreaterThanOrEqual(300);
      expect(page.title.length, `Page ${page.url} must have a non-empty title`).toBeGreaterThan(10);
      expect(page.metaDescription.length, `Page ${page.url} must have a non-empty meta description`).toBeGreaterThan(20);
    }
  });

  it('reviews Twitch Bits pages: only keep programmatic pages carrying unique data', () => {
    const twitchToUsdFile = path.join(DIST_DIR, 'twitch-bits-to-usd', 'index.html');
    const twitchCalcRedirect = path.join(DIST_DIR, 'twitch-bits-calculator', 'index.html');

    expect(fs.existsSync(twitchToUsdFile), 'twitch-bits-to-usd/index.html must exist').toBe(true);
    expect(fs.existsSync(twitchCalcRedirect), 'twitch-bits-calculator/index.html must exist').toBe(true);

    // 1. Primary Twitch Bits page must carry robust unique content (>1,000 words) and unique conversion tables
    const twitchPage = extractPageContent(fs.readFileSync(twitchToUsdFile, 'utf-8'), twitchToUsdFile, DIST_DIR);
    expect(twitchPage.isIndexable, 'twitch-bits-to-usd must be indexable').toBe(true);
    expect(twitchPage.wordCount, 'twitch-bits-to-usd must have >1,000 words of unique content').toBeGreaterThanOrEqual(1000);
    const lowerTwitch = twitchPage.cleanedBodyText.toLowerCase();
    expect(lowerTwitch).toContain('$0.01');
    expect(lowerTwitch).toContain('100 bits');
    expect(lowerTwitch).toContain('1,000 bits');

    // 2. Redirect page /twitch-bits-calculator/ must carry noindex to avoid thin programmatic duplicate
    const redirectPage = extractPageContent(fs.readFileSync(twitchCalcRedirect, 'utf-8'), twitchCalcRedirect, DIST_DIR);
    expect(redirectPage.isIndexable, 'twitch-bits-calculator redirect must NOT be indexable').toBe(false);
  });

  it('reviews category-rate pages: verify every category calculator carries >= 1,500 words of unique data', () => {
    const categoryUrls = [
      'ebay-final-value-fee-calculator',
      'ebay-shipping-fee-calculator',
      'ebay-fee-calculator-uk',
      'ebay-and-paypal-fee-calculator',
      'ebay-profit-calculator',
      'etsy-offsite-ads-fee-calculator',
    ];

    for (const slug of categoryUrls) {
      const filePath = path.join(DIST_DIR, slug, 'index.html');
      expect(fs.existsSync(filePath), `${slug}/index.html must exist in dist`).toBe(true);

      const page = extractPageContent(fs.readFileSync(filePath, 'utf-8'), filePath, DIST_DIR);
      expect(page.isIndexable, `${slug} must be indexable`).toBe(true);
      expect(
        page.wordCount,
        `Category page ${slug} must carry >= 1,500 words of unique content (actual: ${page.wordCount})`
      ).toBeGreaterThanOrEqual(1500);

      // Verify each carries unique domain-specific rate data
      const lowerBody = page.cleanedBodyText.toLowerCase();
      if (slug === 'ebay-final-value-fee-calculator') {
        expect(lowerBody).toContain('musical instruments');
        expect(lowerBody).toContain('6.7');
      } else if (slug === 'ebay-shipping-fee-calculator') {
        expect(lowerBody).toContain('usps');
        expect(lowerBody).toContain('commercial base');
      } else if (slug === 'ebay-fee-calculator-uk') {
        expect(lowerBody).toContain('vat');
        expect(lowerBody).toContain('private seller');
        expect(lowerBody).toContain('12.8%');
      } else if (slug === 'etsy-offsite-ads-fee-calculator') {
        expect(lowerBody).toContain('offsite ads');
        expect(lowerBody).toContain('$10,000');
      }
    }
  });

  it('CHECK: the guard fails on a copy of an existing page', () => {
    const sourceHtmlFile = path.join(DIST_DIR, 'ebay-fee-calculator', 'index.html');
    expect(fs.existsSync(sourceHtmlFile)).toBe(true);

    const originalHtml = fs.readFileSync(sourceHtmlFile, 'utf-8');
    const originalPage = extractPageContent(originalHtml, sourceHtmlFile, DIST_DIR);

    // Create a copy page: different URL and title, but identical / copied body text
    const clonedHtml = originalHtml
      .replace(/<title>[\s\S]*?<\/title>/i, '<title>Cloned Copy Page Title</title>')
      .replace(
        /<meta name="description" content="[^"]*"/i,
        '<meta name="description" content="Distinct meta description for the cloned test page."'
      )
      .replace(/<link rel="canonical" href="[^"]*"/i, '<link rel="canonical" href="https://sellercalchub.com/cloned-page/"');

    const clonedPage = extractPageContent(clonedHtml, path.join(DIST_DIR, 'cloned-page', 'index.html'), DIST_DIR);

    // Run thin-content check on the pair
    const violations = checkThinContent([originalPage, clonedPage]);

    // The guard MUST detect that the cloned page is a template-only copy / near duplicate
    const copyViolations = violations.filter((v) => v.rule === 'template-only-copy');
    expect(
      copyViolations.length,
      'The guard MUST fail when an indexable page is a copy or template-only clone of another page'
    ).toBeGreaterThanOrEqual(1);

    expect(copyViolations[0].url).toBe('/cloned-page/');
    expect(copyViolations[0].message).toContain('phrase overlap');
  });

  it('CHECK: the guard fails on a page with under 300 words of body text', () => {
    const thinHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <title>Thin Test Page Title (60 chars)</title>
          <meta name="description" content="Thin test page meta description with soft call to action." />
        </head>
        <body>
          <main>
            <h1>Thin Test Page</h1>
            <p>This is a short paragraph that contains very few words. It lacks depth and substance.</p>
            <p>Another short sentence here to test the thin content word counter.</p>
          </main>
        </body>
      </html>
    `;

    const thinPage = extractPageContent(thinHtml, path.join(DIST_DIR, 'thin-page', 'index.html'), DIST_DIR);
    expect(thinPage.wordCount).toBeLessThan(300);

    const violations = checkThinContent([thinPage]);
    const thinViolations = violations.filter((v) => v.rule === 'thin-word-count');

    expect(thinViolations.length).toBe(1);
    expect(thinViolations[0].url).toBe('/thin-page/');
    expect(thinViolations[0].message).toContain('minimum required: 300 words');
  });

  it('CHECK: the guard fails on duplicated titles or meta descriptions across distinct URLs', () => {
    const bodyA = 'Valid unique body paragraph. '.repeat(50); // ~200 words
    const bodyB = 'Completely different content about seller fees. '.repeat(50); // ~300 words

    const pageAHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Identical Duplicate Page Title</title>
          <meta name="description" content="Identical duplicate meta description across two pages." />
        </head>
        <body><main><h1>Page A</h1><p>${bodyA}</p><p>${bodyA}</p></main></body>
      </html>
    `;

    const pageBHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Identical Duplicate Page Title</title>
          <meta name="description" content="Identical duplicate meta description across two pages." />
        </head>
        <body><main><h1>Page B</h1><p>${bodyB}</p><p>${bodyB}</p></main></body>
      </html>
    `;

    const pageA = extractPageContent(pageAHtml, path.join(DIST_DIR, 'page-a', 'index.html'), DIST_DIR);
    const pageB = extractPageContent(pageBHtml, path.join(DIST_DIR, 'page-b', 'index.html'), DIST_DIR);

    const violations = checkThinContent([pageA, pageB]);

    const titleViolations = violations.filter((v) => v.rule === 'duplicate-title');
    const metaViolations = violations.filter((v) => v.rule === 'duplicate-meta');

    expect(titleViolations.length, 'Must fail on duplicated title').toBeGreaterThanOrEqual(1);
    expect(metaViolations.length, 'Must fail on duplicated meta').toBeGreaterThanOrEqual(1);
  });
});
