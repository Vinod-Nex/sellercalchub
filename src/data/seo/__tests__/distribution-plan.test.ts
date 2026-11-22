import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 47: Distribution and Links Plan Verification', () => {
  const rootDir = process.cwd();
  const distributionPath = path.join(rootDir, 'DISTRIBUTION.md');

  it('DISTRIBUTION.md must exist and contain zero-paid-links guarantee', () => {
    expect(fs.existsSync(distributionPath), 'DISTRIBUTION.md should exist at project root').toBe(true);
    const content = fs.readFileSync(distributionPath, 'utf8');

    // Guarantee & non-paid validation
    expect(content).toMatch(/Zero-Paid-Links Guarantee/i);
    expect(content).toMatch(/without paying for links/i);
    expect(content).toMatch(/Google Search Essentials/i);
    expect(content).not.toMatch(/sponsored link fee|buy backlinks|pbn network/i);
  });

  it('DISTRIBUTION.md must cover all five mandatory organic distribution tactics', () => {
    const content = fs.readFileSync(distributionPath, 'utf8');

    // 1. Embeddable calculator widget with attribution link
    expect(content).toMatch(/Embeddable Calculator Widget/i);
    expect(content).toMatch(/attribution/i);
    expect(content).toMatch(/<iframe/i);

    // 2. Honest community posts following self-promotion rules
    expect(content).toMatch(/Honest Community Engagement/i);
    expect(content).toMatch(/self-promotion/i);
    expect(content).toMatch(/r\/Flipping/i);
    expect(content).toMatch(/r\/eBaySellerAdvice/i);
    expect(content).toMatch(/r\/EtsySellers/i);
    expect(content).toMatch(/r\/whatnotapp/i);

    // 3. Free seller-tool directories
    expect(content).toMatch(/Free Seller-Tool & Software Directories|Seller-Tool Directories/i);
    expect(content).toMatch(/AlternativeTo/i);
    expect(content).toMatch(/SaaSHub/i);

    // 4. Product Hunt launch
    expect(content).toMatch(/Product Hunt Launch/i);
    expect(content).toMatch(/Maker Comment Script/i);

    // 5. YouTuber and blogger outreach
    expect(content).toMatch(/Outreach to Reseller YouTubers & Blogger|YouTubers & Blogger Outreach/i);
    expect(content).toMatch(/outdated/i);
  });

  it('DISTRIBUTION.md must list exactly 20 specific targets for manual research', () => {
    const content = fs.readFileSync(distributionPath, 'utf8');

    // Check specific required targets
    const specificTargets = [
      'Daily Refinement',
      'Cincinnati Picker',
      'Rallioro',
      'Crappy to Happy',
      'Hustle at Home Mom',
      'EcommerceBytes',
      'Web Retailer',
      'Craftybase',
      'My Reseller Genie',
      'Sellerplex',
      'r/Flipping',
      'r/eBaySellerAdvice',
      'r/EtsySellers',
      'r/whatnotapp',
      'eBay Community',
      'AlternativeTo',
      'SaaSHub',
      'Product Hunt',
      'Launching Next',
      'Indie Hackers',
    ];

    for (const target of specificTargets) {
      expect(content).toContain(target);
    }

    // Check numbering 1 through 20 in the targets section
    for (let i = 1; i <= 20; i++) {
      const targetRegex = new RegExp(`(?:^|\\n)\\s*${i}\\.\\s+\\*\\*`, 'm');
      expect(targetRegex.test(content), `Target #${i} should be enumerated in 20 specific targets list`).toBe(true);
    }
  });

  it('EmbedModal component and embed dynamic route must exist with SEO protections', () => {
    const modalPath = path.join(rootDir, 'src/components/EmbedModal.astro');
    const embedPagePath = path.join(rootDir, 'src/pages/embed/[calculator].astro');

    expect(fs.existsSync(modalPath), 'EmbedModal.astro component must exist').toBe(true);
    expect(fs.existsSync(embedPagePath), 'Embed dynamic route page must exist').toBe(true);

    const embedPageContent = fs.readFileSync(embedPagePath, 'utf8');
    // Verify noindex and canonical to prevent thin content indexing
    expect(embedPageContent).toMatch(/<meta name="robots" content="noindex, follow" \/>/);
    expect(embedPageContent).toMatch(/<link rel="canonical" href=\{`https:\/\/sellercalchub\.com\$\{parentUrl\}`\} \/>/);

    // Verify attribution link
    expect(embedPageContent).toMatch(/Calculate on Seller Calc Hub/);
  });

  it('Core calculator pages must include EmbedModal component', () => {
    const ebayPage = fs.readFileSync(path.join(rootDir, 'src/pages/ebay-fee-calculator.astro'), 'utf8');
    const whatnotPage = fs.readFileSync(path.join(rootDir, 'src/pages/whatnot-fee-calculator.astro'), 'utf8');
    const etsyPage = fs.readFileSync(path.join(rootDir, 'src/pages/etsy-fee-calculator.astro'), 'utf8');

    expect(ebayPage).toContain('<EmbedModal');
    expect(whatnotPage).toContain('<EmbedModal');
    expect(etsyPage).toContain('<EmbedModal');
  });
});
