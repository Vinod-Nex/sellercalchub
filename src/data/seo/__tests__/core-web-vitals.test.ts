import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const CWV_PROOF_FILE = path.resolve(ROOT_DIR, 'core-web-vitals-proof.md');
const LHCI_DIR = path.resolve(ROOT_DIR, '.lighthouseci');

describe('Phase 40: Core Web Vitals Proof & Mobile Performance', () => {
  it('core-web-vitals-proof.md exists and documents good vitals across all targets', () => {
    expect(fs.existsSync(CWV_PROOF_FILE), 'core-web-vitals-proof.md must exist at root').toBe(true);
    const content = fs.readFileSync(CWV_PROOF_FILE, 'utf-8');

    expect(content).toContain("Check: all three vitals are in the 'good' range on mobile");
    expect(content).toContain('/ebay-fee-calculator/');
    expect(content).toContain('/marketplace-fee-calculators/');
    expect(content).toContain('Cloudflare Web Analytics Real-User Monitoring');
    expect(content).toContain('WebPageTest');
    expect(content).toContain('Regressions Identified & Remediations Applied');
  });

  it('asserts latest mobile Lighthouse reports achieve "Good" thresholds on all target pages', () => {
    expect(fs.existsSync(LHCI_DIR), '.lighthouseci directory must exist').toBe(true);

    const reportFiles = fs
      .readdirSync(LHCI_DIR)
      .filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
      .map((f) => {
        const full = path.join(LHCI_DIR, f);
        return {
          file: f,
          mtime: fs.statSync(full).mtimeMs,
          data: JSON.parse(fs.readFileSync(full, 'utf-8')),
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    // Group by URL to find the latest run for each target
    const latestByTarget: Record<string, typeof reportFiles[0]['data']> = {};
    for (const r of reportFiles) {
      const url = r.data.requestedUrl || r.data.finalUrl;
      if (url.includes('/marketplace-fee-calculators/') && !latestByTarget['hub']) {
        latestByTarget['hub'] = r.data;
      } else if (url.includes('/ebay-fee-calculator/') && !latestByTarget['calculator']) {
        latestByTarget['calculator'] = r.data;
      } else if ((url.endsWith('/index.html') || url.endsWith('/')) && !latestByTarget['home']) {
        latestByTarget['home'] = r.data;
      }
    }

    expect(latestByTarget['home'], 'Missing Lighthouse report for home').toBeDefined();
    expect(latestByTarget['calculator'], 'Missing Lighthouse report for calculator').toBeDefined();
    expect(latestByTarget['hub'], 'Missing Lighthouse report for hub').toBeDefined();

    for (const [key, report] of Object.entries(latestByTarget)) {
      const url = report.requestedUrl || report.finalUrl;
      const perfScore = report.categories.performance.score * 100;
      const lcp = report.audits['largest-contentful-paint'].numericValue;
      const cls = report.audits['cumulative-layout-shift'].numericValue;
      const tbt = report.audits['total-blocking-time'].numericValue;

      // 1. Performance Category >= 90
      expect(perfScore, `Performance on ${url} is below 90: ${perfScore}`).toBeGreaterThanOrEqual(90);

      // 2. LCP <= 2500ms ("Good" threshold)
      expect(lcp, `LCP on ${url} is outside good range: ${lcp}ms`).toBeLessThanOrEqual(2500);

      // 3. CLS <= 0.10 ("Good" threshold)
      expect(cls, `CLS on ${url} is outside good range: ${cls}`).toBeLessThanOrEqual(0.1);

      // 4. TBT <= 200ms ("Good" threshold proxy for INP)
      expect(tbt, `TBT on ${url} is outside good range: ${tbt}ms`).toBeLessThanOrEqual(200);
    }
  });

  it('confirms privacy banner and analytics defer non-critical work to idle time', () => {
    const bannerCode = fs.readFileSync(path.resolve(ROOT_DIR, 'src/components/ConsentBanner.astro'), 'utf-8');
    expect(bannerCode).toContain('requestIdleCallback');

    const analyticsCode = fs.readFileSync(path.resolve(ROOT_DIR, 'src/components/CloudflareAnalytics.astro'), 'utf-8');
    expect(analyticsCode).toContain('static.cloudflareinsights.com/beacon.min.js');
  });
});
