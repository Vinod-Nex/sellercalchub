import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const PAGES_FILE = path.resolve(ROOT_DIR, 'src/data/seo/pages.json');

const pagesData = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf-8'));

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

describe('Phase 39: On-Page SEO Audits & Dimension Checks', () => {
  it('generates seo-audit-<slug>.md for all mapped pages and home', () => {
    const requiredSlugs = [
      'home',
      'ebay-fee-calculator',
      'ebay-fee-calculator-uk',
      'etsy-fee-calculator',
      'twitch-bits-to-usd',
      'whatnot-fee-calculator',
      'ebay-final-value-fee-calculator',
      'ebay-and-paypal-fee-calculator',
      'ebay-shipping-fee-calculator',
      'tiktok-shop-fee-calculator',
      'ebay-profit-calculator',
      'etsy-offsite-ads-fee-calculator',
      'depop-fee-calculator',
      'marketplace-fee-calculators',
    ];

    for (const slug of requiredSlugs) {
      const auditFile = path.resolve(ROOT_DIR, `seo-audit-${slug}.md`);
      expect(fs.existsSync(auditFile), `Expected ${auditFile} to exist`).toBe(true);

      const content = fs.readFileSync(auditFile, 'utf-8');
      expect(content).toContain('Check: every page scores Pass on title, meta, headers and schema');
      expect(content).toContain('1. Title Tag');
      expect(content).toContain('2. Meta Description');
      expect(content).toContain('3. Header Hierarchy');
      expect(content).toContain('4. Structured Data');
      expect(content).toContain('5. Content & Intent');
      expect(content).toContain('6. Keyword Targeting');
      expect(content).toContain('7. Internal Linking');
      expect(content).toContain('8. Page Experience');
    }
  });

  it('verifies every page in dist/ scores Pass on title (<= 60 chars)', () => {
    for (const p of pagesData.pages) {
      const slug = p.url.replace(/^\/|\/$/g, '');
      const htmlPath = path.join(DIST_DIR, slug, 'index.html');
      expect(fs.existsSync(htmlPath), `HTML must exist for ${p.url}`).toBe(true);

      const html = fs.readFileSync(htmlPath, 'utf-8');
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      expect(titleMatch, `Missing title on ${p.url}`).not.toBeNull();

      const decoded = decodeHtml(titleMatch![1].trim());
      expect(decoded.length, `Title on ${p.url} exceeds 60 chars: "${decoded}" (${decoded.length}c)`).toBeLessThanOrEqual(60);
      expect(decoded.length, `Title on ${p.url} is too short`).toBeGreaterThan(15);
    }

    // Home page check
    const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
    const homeTitleMatch = homeHtml.match(/<title>([^<]+)<\/title>/i);
    const homeDecoded = decodeHtml(homeTitleMatch![1].trim());
    expect(homeDecoded.length, `Home title exceeds 60 chars: "${homeDecoded}"`).toBeLessThanOrEqual(60);
  });

  it('verifies every page in dist/ scores Pass on meta description (<= 160 chars)', () => {
    for (const p of pagesData.pages) {
      const slug = p.url.replace(/^\/|\/$/g, '');
      const htmlPath = path.join(DIST_DIR, slug, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      expect(metaMatch, `Missing meta description on ${p.url}`).not.toBeNull();

      const meta = metaMatch![1].trim();
      expect(meta.length, `Meta description on ${p.url} exceeds 160 chars (${meta.length}c)`).toBeLessThanOrEqual(160);
      expect(meta.length, `Meta description on ${p.url} is too short (${meta.length}c)`).toBeGreaterThan(50);
    }

    // Home page check
    const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
    const homeMetaMatch = homeHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    expect(homeMetaMatch![1].trim().length).toBeLessThanOrEqual(160);
  });

  it('verifies every page in dist/ scores Pass on headers (exactly 1 H1 distinct from title)', () => {
    for (const p of pagesData.pages) {
      const slug = p.url.replace(/^\/|\/$/g, '');
      const htmlPath = path.join(DIST_DIR, slug, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
      expect(h1Matches.length, `Expected exactly 1 H1 on ${p.url}`).toBe(1);

      const h1Text = decodeHtml(h1Matches[0].replace(/<[^>]+>/g, '').trim());
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const titleText = decodeHtml(titleMatch![1].trim());

      expect(h1Text.toLowerCase()).not.toBe(titleText.toLowerCase());
    }

    // Home page check
    const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
    const homeH1Matches = homeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    expect(homeH1Matches.length).toBe(1);
  });

  it('verifies every page in dist/ scores Pass on schema (valid JSON-LD)', () => {
    for (const p of pagesData.pages) {
      const slug = p.url.replace(/^\/|\/$/g, '');
      const htmlPath = path.join(DIST_DIR, slug, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      const scriptMatches = Array.from(
        html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
      );
      expect(scriptMatches.length, `Expected JSON-LD on ${p.url}`).toBeGreaterThan(0);

      const types: string[] = [];
      for (const m of scriptMatches) {
        const parsed = JSON.parse(m[1]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            types.push(item['@type']);
          }
        } else {
          types.push(parsed['@type']);
        }
      }

      expect(types).toContain('WebApplication');
      expect(types).toContain('BreadcrumbList');
    }

    // Home page check
    const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
    expect(homeHtml).toContain('"@type":"Organization"');
    expect(homeHtml).toContain('"@type":"WebSite"');
  });
});
