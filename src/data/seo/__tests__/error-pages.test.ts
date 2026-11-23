import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getOgImagePath } from '../../../lib/seo';

describe('Error Pages: 404 (Not Found) & 500 (Server Error)', () => {
  const rootDir = process.cwd();
  const pagesDir = path.join(rootDir, 'src/pages');

  it('verifies both 404.astro and 500.astro exist', () => {
    expect(fs.existsSync(path.join(pagesDir, '404.astro'))).toBe(true);
    expect(fs.existsSync(path.join(pagesDir, '500.astro'))).toBe(true);
  });

  it('verifies 404.astro is configured with noindex and helpful calculator shortcuts', () => {
    const content = fs.readFileSync(path.join(pagesDir, '404.astro'), 'utf8');

    expect(content).toContain('noindex={true}');
    expect(content).toContain('canonicalPath="/404/"');
    expect(content).toContain('HTTP 404 · Resource Not Found');
    expect(content).toContain('Looking for a Fee Calculator?');

    // Calculator shortcuts
    expect(content).toContain('eBay Fee Calculator (US)');
    expect(content).toContain('eBay Fee Calculator (UK)');
    expect(content).toContain('Whatnot Fee Calculator');
    expect(content).toContain('TikTok Shop Fee Calculator');
    expect(content).toContain('Depop Fee Calculator');
    expect(content).toContain('Etsy Fee Calculator');
    expect(content).toContain('Twitch Bits to USD Converter');
    expect(content).toContain('Marketplace Comparison Hub');

    // Recovery links
    expect(content).toContain('href="/marketplace-fee-calculators/"');
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/contact/"');
  });

  it('verifies 500.astro is configured with noindex, SSG client-side architecture explanation, and reload handler', () => {
    const content = fs.readFileSync(path.join(pagesDir, '500.astro'), 'utf8');

    expect(content).toContain('noindex={true}');
    expect(content).toContain('canonicalPath="/500/"');
    expect(content).toContain('HTTP 500 · Internal Server Error');
    expect(content).toContain('Temporary System Interruption');

    // Architectural clarity
    expect(content).toContain('Static Site Generation (SSG)');
    expect(content).toContain('client-side calculations');

    // Recovery controls
    expect(content).toContain('id="reload-page-btn"');
    expect(content).toContain('window.location.reload()');
    expect(content).toContain('href="/"');
    expect(content).toContain('href="/marketplace-fee-calculators/"');
    expect(content).toContain('mailto:hello@sellercalchub.com?subject=HTTP%20500%20Error%20Report');
  });

  it('verifies astro.config.mjs excludes 404 and 500 from sitemap', () => {
    const astroConfig = fs.readFileSync(path.join(rootDir, 'astro.config.mjs'), 'utf8');
    expect(astroConfig).toMatch(/404\|500/);
  });

  it('verifies getOgImagePath maps 404 and 500 safely to og-default.png', () => {
    expect(getOgImagePath('/404/')).toBe('/og/og-default.png');
    expect(getOgImagePath('404')).toBe('/og/og-default.png');
    expect(getOgImagePath('/500/')).toBe('/og/og-default.png');
    expect(getOgImagePath('500')).toBe('/og/og-default.png');
  });
});
