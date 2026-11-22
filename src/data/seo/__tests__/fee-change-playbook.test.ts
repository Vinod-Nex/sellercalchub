import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { runMockFeeChangeBenchmark } from '../../../../scripts/mock-fee-change';

describe('Phase 49: Fee-Change Playbook & SLA Verification', () => {
  const rootDir = process.cwd();
  const playbookPath = path.join(rootDir, 'FEE-CHANGE.md');

  it('FEE-CHANGE.md must exist and cover all protocol steps', () => {
    expect(fs.existsSync(playbookPath), 'FEE-CHANGE.md must exist at root').toBe(true);
    const content = fs.readFileSync(playbookPath, 'utf8');

    // 1. Update data file
    expect(content).toMatch(/Update (?:the )?Fee (?:Data )?File|src\/data\/fees/i);

    // 2. Run tests
    expect(content).toMatch(/npm test|Run Test/i);

    // 3. Add changelog entry
    expect(content).toMatch(/changelog\.json|Add (?:a )?Changelog Entry/i);

    // 4. Bump verified_on
    expect(content).toMatch(/verified_on/i);

    // 5. Deploy
    expect(content).toMatch(/deploy|Cloudflare Pages/i);

    // 6. Ping IndexNow
    expect(content).toMatch(/indexnow:ping|Ping IndexNow/i);

    // 7. Post update on changed pages
    expect(content).toMatch(/Update On-Page Copy|WorkedExample|changed pages/i);
  });

  it('FEE-CHANGE.md must include official watch URLs for all 7 platforms and seller-news sites', () => {
    const content = fs.readFileSync(playbookPath, 'utf8');

    // All 7 required platforms
    const platforms = ['Amazon', 'eBay', 'Etsy', 'Whatnot', 'TikTok Shop', 'Depop', 'Twitch'];
    for (const platform of platforms) {
      expect(content).toContain(platform);
    }

    // Official announcement feeds & links
    expect(content).toMatch(/sellercentral\.amazon\.com/i);
    expect(content).toMatch(/ebay\.com\/sellercenter/i);
    expect(content).toMatch(/etsy\.com\/seller-handbook/i);
    expect(content).toMatch(/help\.whatnot\.com/i);
    expect(content).toMatch(/seller-us\.tiktok\.com/i);
    expect(content).toMatch(/depophelp\.zendesk\.com|depop\.com/i);
    expect(content).toMatch(/help\.twitch\.tv/i);

    // Seller news sites
    expect(content).toMatch(/EcommerceBytes/i);
    expect(content).toMatch(/Web Retailer/i);
    expect(content).toMatch(/Value Added Resource/i);
  });

  it('Check: a mock change goes from notice to live in under an hour (< 3600s)', async () => {
    const benchmarkResult = await runMockFeeChangeBenchmark();

    expect(benchmarkResult.success).toBe(true);
    expect(benchmarkResult.stepsCompleted.length).toBeGreaterThanOrEqual(5);

    // Verify benchmark executes in < 3600 seconds (in fact < 10 seconds)
    expect(benchmarkResult.elapsedSeconds).toBeLessThan(3600);
    expect(benchmarkResult.elapsedSeconds).toBeLessThan(10);
  });
});
