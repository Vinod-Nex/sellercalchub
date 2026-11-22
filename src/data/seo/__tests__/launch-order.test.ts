import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { verifyWeekChecklist, LAUNCH_WEEKS } from '../../../../scripts/verify-launch-week';

const ROOT_DIR = process.cwd();
const LAUNCH_MD = path.resolve(ROOT_DIR, 'LAUNCH.md');

describe('Phase 46: Launch Order & Pre-Publish Checklist Verification', () => {
  it('validates LAUNCH.md exists and documents the 4-week rollout sequence from the keyword plan', () => {
    expect(fs.existsSync(LAUNCH_MD), 'LAUNCH.md must exist in root').toBe(true);

    const content = fs.readFileSync(LAUNCH_MD, 'utf-8');

    // Week 1 requirements: Whatnot, TikTok Shop, Depop
    expect(content).toContain('Week 1: Social, Resale & Livestream Commerce');
    expect(content).toContain('/whatnot-fee-calculator/');
    expect(content).toContain('/tiktok-shop-fee-calculator/');
    expect(content).toContain('/depop-fee-calculator/');

    // Week 2 requirements: Etsy, Etsy Offsite Ads, Twitch Bits
    expect(content).toContain('Week 2: Artisan Crafts & Creator Economy');
    expect(content).toContain('/etsy-fee-calculator/');
    expect(content).toContain('/etsy-offsite-ads-fee-calculator/');
    expect(content).toContain('/twitch-bits-to-usd/');

    // Week 3 requirements: eBay pillar, final value fee, profit after fees
    expect(content).toContain('Week 3: Core eBay US Volume Pillars');
    expect(content).toContain('/ebay-fee-calculator/');
    expect(content).toContain('/ebay-final-value-fee-calculator/');
    expect(content).toContain('/ebay-profit-calculator/');

    // Week 4 requirements: eBay UK, eBay and PayPal explainer, shipping, hub
    expect(content).toContain('Week 4: Global Cross-Border, Shipping & Master Hub');
    expect(content).toContain('/ebay-fee-calculator-uk/');
    expect(content).toContain('/ebay-shipping-fee-calculator/');
    expect(content).toContain('/ebay-and-paypal-fee-calculator/');
    expect(content).toContain('/marketplace-fee-calculators/');

    // Pre-publish checklist verification
    expect(content).toContain('The 6-Point Pre-Publish Checklist per Page');
    expect(content).toContain('1. RATE VERIFICATION GATE');
    expect(content).toContain('2. SEO METADATA & INTENT GATE');
    expect(content).toContain('3. STRUCTURED DATA (JSON-LD) GATE');
    expect(content).toContain('4. CONTENT SUBSTANCE & THIN-CONTENT GUARD');
    expect(content).toContain('5. INTERNAL LINKING & INTEGRITY GATE');
    expect(content).toContain('6. ACCESSIBILITY, MOBILE & CORE WEB VITALS GATE');
  });

  it('CHECK: Week 1 pages (Whatnot, TikTok Shop, Depop) pass the pre-publish checklist', () => {
    const results = verifyWeekChecklist(1);
    expect(results.length).toBe(4);

    for (const res of results) {
      expect(
        res.overallPass,
        `Page ${res.url} failed pre-publish checklist in Week 1: ${res.errors.join(', ')}`
      ).toBe(true);
      expect(res.ratesVerified).toBe(true);
      expect(res.seoMetaPass).toBe(true);
      expect(res.schemaPass).toBe(true);
      expect(res.contentWordCountPass).toBe(true);
      expect(res.linksPass).toBe(true);
    }
  });

  it('CHECK: Week 2 pages (Etsy, Etsy Offsite Ads, Twitch Bits) pass the pre-publish checklist', () => {
    const results = verifyWeekChecklist(2);
    expect(results.length).toBe(3);

    for (const res of results) {
      expect(
        res.overallPass,
        `Page ${res.url} failed pre-publish checklist in Week 2: ${res.errors.join(', ')}`
      ).toBe(true);
      expect(res.ratesVerified).toBe(true);
      expect(res.seoMetaPass).toBe(true);
      expect(res.schemaPass).toBe(true);
      expect(res.contentWordCountPass).toBe(true);
      expect(res.linksPass).toBe(true);
    }
  });

  it('CHECK: Week 3 pages (eBay pillar, final value fee, profit after fees) pass the pre-publish checklist', () => {
    const results = verifyWeekChecklist(3);
    expect(results.length).toBe(4);

    for (const res of results) {
      expect(
        res.overallPass,
        `Page ${res.url} failed pre-publish checklist in Week 3: ${res.errors.join(', ')}`
      ).toBe(true);
      expect(res.ratesVerified).toBe(true);
      expect(res.seoMetaPass).toBe(true);
      expect(res.schemaPass).toBe(true);
      expect(res.contentWordCountPass).toBe(true);
      expect(res.linksPass).toBe(true);
    }
  });

  it('CHECK: Week 4 pages (eBay UK, eBay and PayPal, shipping, hub) pass the pre-publish checklist', () => {
    const results = verifyWeekChecklist(4);
    expect(results.length).toBe(5);

    for (const res of results) {
      expect(
        res.overallPass,
        `Page ${res.url} failed pre-publish checklist in Week 4: ${res.errors.join(', ')}`
      ).toBe(true);
      expect(res.ratesVerified).toBe(true);
      expect(res.seoMetaPass).toBe(true);
      expect(res.schemaPass).toBe(true);
      expect(res.contentWordCountPass).toBe(true);
      expect(res.linksPass).toBe(true);
    }
  });
});
