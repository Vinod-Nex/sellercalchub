import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 48: Monitoring and Decision Rules Verification', () => {
  const rootDir = process.cwd();
  const monitoringPath = path.join(rootDir, 'MONITORING.md');

  it('MONITORING.md must exist and fit on one page with a named owner (me)', () => {
    expect(fs.existsSync(monitoringPath), 'MONITORING.md must exist at root').toBe(true);
    const content = fs.readFileSync(monitoringPath, 'utf8');

    // Named owner check: must explicitly name the user as owner
    expect(content).toMatch(/Owner(?:\*\*)?:\s*Vinod Kumar \(me\)/i);

    // One-page physical constraint checks
    const lines = content.split('\n');
    const wordCount = content.trim().split(/\s+/).length;

    expect(lines.length).toBeLessThanOrEqual(80);
    expect(wordCount).toBeLessThanOrEqual(750);
  });

  it('must include the weekly checklist covering all required Search Console dimensions', () => {
    const content = fs.readFileSync(monitoringPath, 'utf8');

    // Search Console impressions, clicks, average position, and indexed pages per URL
    expect(content).toMatch(/impressions/i);
    expect(content).toMatch(/clicks/i);
    expect(content).toMatch(/average position/i);
    expect(content).toMatch(/indexed/i);

    // Top queries
    expect(content).toMatch(/top queries/i);

    // Low CTR pages: rewrite title and meta
    expect(content).toMatch(/low ctr/i);
    expect(content).toMatch(/rewrite\s+[`<]*title/i);
    expect(content).toMatch(/meta/i);

    // Pages not indexed: inspect and fix
    expect(content).toMatch(/unindexed pages|not indexed/i);
    expect(content).toMatch(/inspect/i);
    expect(content).toMatch(/fix/i);
  });

  it('must define week 6 decision rules (expand 8-20, rewrite 30+, cut 8-week 0-impressions)', () => {
    const content = fs.readFileSync(monitoringPath, 'utf8');

    // Expand pages ranking 8 to 20
    expect(content).toMatch(/expand/i);
    expect(content).toMatch(/8\s*(?:to|-)\s*20/i);

    // Rewrite pages stuck beyond position 30
    expect(content).toMatch(/rewrite/i);
    expect(content).toMatch(/(?:position|rank)\s*>\s*30|beyond position 30/i);

    // Cut pages with no impressions after 8 weeks
    expect(content).toMatch(/cut/i);
    expect(content).toMatch(/0 impressions|no impressions/i);
    expect(content).toMatch(/8 weeks/i);
  });
});
