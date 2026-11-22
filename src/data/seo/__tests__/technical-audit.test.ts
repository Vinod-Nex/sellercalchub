import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const AUDIT_FILE = path.resolve(process.cwd(), 'seo-technical-audit.md');

function findHtmlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Phase 38: Technical SEO Audit & Critical Check', () => {
  it('seo-technical-audit.md exists and documents 0 open critical items', () => {
    expect(fs.existsSync(AUDIT_FILE), 'seo-technical-audit.md must exist at root').toBe(true);
    const auditContent = fs.readFileSync(AUDIT_FILE, 'utf-8');

    // Asserts zero open critical items
    expect(auditContent).toContain('Critical Items (P0): `0 Open`');
    expect(auditContent).toContain('Check: no critical items open');
    expect(auditContent).toContain('Explicit Statement of Pre-Launch Unverifiable Items');
  });

  it('audits dist/ to ensure zero critical crawlability or indexability blockers', () => {
    const allFiles = findHtmlFiles(DIST_DIR);
    const contentFiles = allFiles.filter((f) => {
      const content = fs.readFileSync(f, 'utf-8');
      return !content.includes('<meta http-equiv="refresh"') && !f.includes('/embed/');
    });

    const criticalViolations: string[] = [];

    for (const f of contentFiles) {
      const relPath = f.replace(DIST_DIR, '');
      const is404 = relPath.includes('404');
      const html = fs.readFileSync(f, 'utf-8');

      // 1. Viewport tag
      if (!html.includes('name="viewport"')) {
        criticalViolations.push(`${relPath}: missing viewport meta tag`);
      }

      // 2. Title tag
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (!titleMatch || !titleMatch[1].trim()) {
        criticalViolations.push(`${relPath}: missing or empty <title> tag`);
      }

      // 3. Meta description
      const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (!metaDesc || !metaDesc[1].trim()) {
        criticalViolations.push(`${relPath}: missing or empty meta description`);
      }

      // 4. H1 tag (exactly 1 per page)
      const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
      if (h1Matches.length === 0) {
        criticalViolations.push(`${relPath}: missing <h1> tag`);
      } else if (h1Matches.length > 1) {
        criticalViolations.push(`${relPath}: multiple (${h1Matches.length}) <h1> tags detected`);
      }

      // 5. Canonical tag on indexable pages
      if (!is404) {
        const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        if (!canonicalMatch) {
          criticalViolations.push(`${relPath}: missing canonical tag`);
        } else {
          let pagePath = relPath.replace(/index\.html$/, '');
          if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`;
          const expected = `https://sellercalchub.com${pagePath}`;
          if (canonicalMatch[1] !== expected) {
            criticalViolations.push(`${relPath}: non-self-referencing canonical (expected ${expected}, got ${canonicalMatch[1]})`);
          }
        }
      }

      // 6. Robots tag
      const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
      if (!robotsMatch) {
        criticalViolations.push(`${relPath}: missing meta robots tag`);
      } else if (is404 && robotsMatch[1] !== 'noindex, nofollow') {
        criticalViolations.push(`${relPath}: 404 page must be noindex, nofollow`);
      }

      // 7. Images without alt attribute
      const imgTags = html.match(/<img[^>]*>/gi) || [];
      for (const img of imgTags) {
        if (!img.includes('alt=')) {
          criticalViolations.push(`${relPath}: image missing alt attribute (${img})`);
        }
      }
    }

    // Success condition: No critical items open
    expect(criticalViolations, `Critical SEO violations found: ${criticalViolations.join('; ')}`).toEqual([]);
  });

  it('confirms robots.txt and sitemap are strictly aligned with zero non-canonical URLs', () => {
    const robotsContent = fs.readFileSync(path.join(DIST_DIR, 'robots.txt'), 'utf-8');
    expect(robotsContent).toContain('Allow: /');
    expect(robotsContent).toContain('Sitemap: https://sellercalchub.com/sitemap-index.xml');

    const sitemapContent = fs.readFileSync(path.join(DIST_DIR, 'sitemap-0.xml'), 'utf-8');
    const locs = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    // Check no non-canonical URLs in sitemap
    const invalidLocs = locs.filter(
      (loc) => !loc.startsWith('https://sellercalchub.com/') || !loc.endsWith('/') || loc.includes('?') || loc.includes('404')
    );
    expect(invalidLocs).toEqual([]);
  });
});
