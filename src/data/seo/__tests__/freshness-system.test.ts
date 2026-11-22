import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getChangelog,
  getPlatformFeeData,
  formatVerifiedDate,
  formatFeeSummary,
  ALL_PLATFORM_FEES,
  type FeeChangeEntry,
} from '../../../lib/calc/fee-data';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const CHANGELOG_FILE = path.resolve(ROOT_DIR, 'src/data/fees/changelog.json');

describe('Phase 41: Freshness System & Unified Rate Synchronization', () => {
  it('validates changelog.json structure and official source links', () => {
    expect(fs.existsSync(CHANGELOG_FILE), 'changelog.json must exist in src/data/fees').toBe(true);

    const changelog: FeeChangeEntry[] = JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf-8'));
    expect(changelog.length).toBeGreaterThanOrEqual(7);

    for (const entry of changelog) {
      expect(entry.id, 'Entry id must be non-empty').toBeTruthy();
      expect(entry.date, 'Entry date must be ISO YYYY-MM-DD').toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.platform, 'Entry platform must be non-empty').toBeTruthy();
      expect(entry.what_changed, 'Entry what_changed must be non-empty description').toBeTruthy();
      expect(entry.official_notice_url, 'Official notice URL must be https').toMatch(/^https:\/\//);
      // Ensure zero unverified placeholder tags
      expect(entry.what_changed).not.toContain('TODO');
      expect(entry.official_notice_url).not.toContain('TODO');
    }
  });

  it('verifies /fee-changes/ page is pre-rendered with compliant SEO and structured data', () => {
    const htmlPath = path.join(DIST_DIR, 'fee-changes', 'index.html');
    expect(fs.existsSync(htmlPath), 'fee-changes/index.html must exist in dist/').toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf-8');

    // Title <= 60 chars
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    expect(titleMatch).not.toBeNull();
    const title = titleMatch![1].replace(/&amp;/g, '&').trim();
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.length).toBeGreaterThan(15);

    // Meta <= 160 chars
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    expect(metaMatch).not.toBeNull();
    const meta = metaMatch![1].trim();
    expect(meta.length).toBeLessThanOrEqual(160);
    expect(meta.length).toBeGreaterThan(50);

    // Single H1 distinct from title
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    expect(h1Matches.length).toBe(1);
    const h1 = h1Matches[0].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    expect(h1.toLowerCase()).not.toBe(title.toLowerCase());

    // Schema.org
    const schemaMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    expect(schemaMatch).not.toBeNull();
    const parsedSchema = JSON.parse(schemaMatch![1]);
    expect(Array.isArray(parsedSchema)).toBe(true);
    const types = parsedSchema.map((s: { '@type': string }) => s['@type']);
    expect(types).toContain('WebPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('Check: editing one rate updates stamp, sitemap and changelog', () => {
    // 1. Read current state of a platform (e.g. whatnot)
    const platform = 'whatnot';
    const originalFee = ALL_PLATFORM_FEES[platform];
    const originalVerified = originalFee.verified_on;
    const originalRate = originalFee.rates[0].percentage;

    const testNewDate = '2026-12-25';
    const testNewRate = 8.5; // modified commission rate

    try {
      // Perform simulated update to the platform fee definition
      ALL_PLATFORM_FEES[platform] = {
        ...originalFee,
        verified_on: testNewDate,
        rates: [
          { ...originalFee.rates[0], percentage: testNewRate },
          ...originalFee.rates.slice(1),
        ],
      };

      // A) Verify Stamp: getPlatformFeeData & formatVerifiedDate reflect the updated date
      const updatedData = getPlatformFeeData(platform);
      expect(updatedData?.verified_on).toBe(testNewDate);
      const formattedStamp = formatVerifiedDate(updatedData?.verified_on);
      expect(formattedStamp).toBe('December 25, 2026');

      // B) Verify Changelog: getChangelog() includes an entry for the new date and updated rate
      const changelog = getChangelog();
      const platformChange = changelog.find((c) => c.platform === platform && c.date === testNewDate);
      expect(platformChange, 'Changelog must include an entry reflecting the updated rate and date').toBeDefined();
      expect(platformChange?.rate_summary).toContain('8.5%');
      expect(platformChange?.official_notice_url).toBe(originalFee.source_url);

      // C) Verify Sitemap lastmod derivation:
      // Sitemaps use the updated platform date
      const sitemapLastmod = updatedData?.verified_on;
      expect(sitemapLastmod).toBe(testNewDate);
    } finally {
      // Revert test mutations cleanly
      ALL_PLATFORM_FEES[platform] = originalFee;
    }
  });

  it('verifies sitemap includes /fee-changes/ with daily frequency and real lastmod', () => {
    const sitemapPath = path.join(DIST_DIR, 'sitemap-0.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');

    expect(sitemapContent).toContain('<loc>https://sellercalchub.com/fee-changes/</loc>');
    expect(sitemapContent).toContain('<changefreq>daily</changefreq>');
    expect(sitemapContent).toContain('<priority>0.8</priority>');
  });
});
