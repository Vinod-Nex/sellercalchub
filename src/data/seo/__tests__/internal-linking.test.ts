import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import linksMapData from '../links-map.json';
import seoPagesData from '../pages.json';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

const FORBIDDEN_ANCHORS = [
  'click here',
  'click',
  'here',
  'learn more',
  'read more',
  'more',
  'link',
  'page',
];

const SUPPORTING_EBAY_PAGES = [
  '/ebay-final-value-fee-calculator/',
  '/ebay-profit-calculator/',
  '/ebay-shipping-fee-calculator/',
  '/ebay-and-paypal-fee-calculator/',
  '/ebay-fee-calculator-uk/',
];

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

describe('Phase 36: Internal Links Map Integrity (links-map.json)', () => {
  it('covers all 13 planned calculator pages', () => {
    const mapUrls = linksMapData.pages.map((p) => p.url);
    const plannedUrls = seoPagesData.pages.map((p) => p.url);

    expect(mapUrls.sort()).toEqual(plannedUrls.sort());
  });

  it('every page links up to the hub with descriptive anchor', () => {
    for (const page of linksMapData.pages) {
      expect(page.hubLink, `Page ${page.url} must define hubLink`).toBeDefined();
      if (page.url === '/marketplace-fee-calculators/') {
        expect(page.hubLink.url).toBe('/');
      } else {
        expect(page.hubLink.url).toBe('/marketplace-fee-calculators/');
      }
      expect(page.hubLink.anchor.length).toBeGreaterThan(10);

      // Enforce descriptive anchor (never 'click here')
      const lowerAnchor = page.hubLink.anchor.toLowerCase();
      for (const forbidden of FORBIDDEN_ANCHORS) {
        expect(lowerAnchor).not.toBe(forbidden);
      }
    }
  });

  it('every page links across to at least two nearest siblings', () => {
    for (const page of linksMapData.pages) {
      expect(page.siblings.length, `Page ${page.url} must have at least 2 siblings`).toBeGreaterThanOrEqual(2);

      for (const sibling of page.siblings) {
        expect(sibling.url).not.toBe(page.url); // No self loops
        expect(sibling.name.length).toBeGreaterThan(3);
        expect(sibling.anchor.length).toBeGreaterThan(10);
        expect(sibling.rate.length).toBeGreaterThan(1);

        // Enforce descriptive anchor
        const lowerAnchor = sibling.anchor.toLowerCase();
        for (const forbidden of FORBIDDEN_ANCHORS) {
          expect(lowerAnchor).not.toBe(forbidden);
        }
      }
    }
  });

  it('every supporting eBay page links to the US pillar with descriptive anchors (never click here)', () => {
    for (const pageUrl of SUPPORTING_EBAY_PAGES) {
      const pageEntry = linksMapData.pages.find((p) => p.url === pageUrl);
      expect(pageEntry, `Entry for ${pageUrl} must exist in links-map.json`).toBeDefined();
      expect(pageEntry!.pillarLink, `Page ${pageUrl} must have pillarLink`).toBeDefined();
      expect(pageEntry!.pillarLink!.url).toBe('/ebay-fee-calculator/');
      expect(pageEntry!.pillarLink!.anchor.length).toBeGreaterThan(15);

      const lowerAnchor = pageEntry!.pillarLink!.anchor.toLowerCase();
      for (const forbidden of FORBIDDEN_ANCHORS) {
        expect(lowerAnchor).not.toBe(forbidden);
      }
      expect(lowerAnchor).not.toContain('click here');
    }
  });
});

describe('Phase 36: Built HTML Internal Linking Checks (dist/)', () => {
  it('home page links to every single calculator', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const html = fs.readFileSync(indexPath, 'utf-8');

    for (const page of seoPagesData.pages) {
      const hasLink =
        html.includes(`href="${page.url}"`) || html.includes(`href='${page.url}'`);
      expect(hasLink, `Home page must link to ${page.url}`).toBe(true);
    }
  });

  it('every calculator page links up to the hub', () => {
    for (const page of seoPagesData.pages) {
      if (page.url === '/marketplace-fee-calculators/') continue;
      const urlPath = page.url.replace(/^\//, '').replace(/\/$/, '');
      const filePath = path.join(DIST_DIR, urlPath, 'index.html');
      const html = fs.readFileSync(filePath, 'utf-8');

      const linksToHub =
        html.includes('href="/marketplace-fee-calculators/"') ||
        html.includes("href='/marketplace-fee-calculators/'");
      expect(linksToHub, `Page ${page.url} must link up to /marketplace-fee-calculators/`).toBe(true);
    }
  });

  it('every supporting eBay page links to the pillar with descriptive anchor (never click here)', () => {
    for (const pageUrl of SUPPORTING_EBAY_PAGES) {
      const urlPath = pageUrl.replace(/^\//, '').replace(/\/$/, '');
      const filePath = path.join(DIST_DIR, urlPath, 'index.html');
      const html = fs.readFileSync(filePath, 'utf-8');

      const linksToPillar =
        html.includes('href="/ebay-fee-calculator/"') ||
        html.includes("href='/ebay-fee-calculator/'");
      expect(linksToPillar, `Supporting eBay page ${pageUrl} must link to pillar /ebay-fee-calculator/`).toBe(true);

      // Verify anchor tags pointing to pillar do not have forbidden anchor text
      const anchorRegex = /<a[^>]*href=["']\/ebay-fee-calculator\/["'][^>]*>([\s\S]*?)<\/a>/gi;
      const matches = [...html.matchAll(anchorRegex)];
      expect(matches.length).toBeGreaterThan(0);

      for (const m of matches) {
        const text = m[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
        for (const forbidden of FORBIDDEN_ANCHORS) {
          expect(text).not.toBe(forbidden);
        }
        expect(text).not.toContain('click here');
      }
    }
  });

  it('every calculator page links across to its two nearest siblings', () => {
    for (const page of linksMapData.pages) {
      const urlPath = page.url.replace(/^\//, '').replace(/\/$/, '');
      const filePath = path.join(DIST_DIR, urlPath, 'index.html');
      const html = fs.readFileSync(filePath, 'utf-8');

      for (const sibling of page.siblings) {
        const hasSiblingLink =
          html.includes(`href="${sibling.url}"`) || html.includes(`href='${sibling.url}'`);
        expect(hasSiblingLink, `Page ${page.url} must link to sibling ${sibling.url}`).toBe(true);
      }
    }
  });
});

describe('Phase 36: Site Graph, Orphan Pages & Click Distance (dist/)', () => {
  it('reports zero orphan pages and verifies every page is within three clicks of home', () => {
    const allFiles = findHtmlFiles(DIST_DIR);

    // Filter out static redirect stubs, error pages (404.html), and standalone iframe embeds
    const contentFiles = allFiles.filter((f) => {
      if (f.endsWith('404.html') || f.includes('/404/') || f.includes('/embed/')) return false;
      const content = fs.readFileSync(f, 'utf-8');
      return !content.includes('<meta http-equiv="refresh"');
    });

    const pages = contentFiles.map((f) => {
      let rel = f.replace(DIST_DIR, '').replace(/index\.html$/, '');
      if (!rel.startsWith('/')) rel = `/${rel}`;
      return rel;
    });

    const adj: Record<string, Set<string>> = {};
    const inDegree: Record<string, number> = {};
    for (const p of pages) {
      adj[p] = new Set();
      inDegree[p] = 0;
    }

    for (const f of contentFiles) {
      let source = f.replace(DIST_DIR, '').replace(/index\.html$/, '');
      if (!source.startsWith('/')) source = `/${source}`;
      const html = fs.readFileSync(f, 'utf-8');
      const matches = html.matchAll(/href=["']([^"'#?]+)["']/g);
      for (const m of matches) {
        let target = m[1];
        if (target.startsWith('/') && !target.startsWith('//')) {
          if (!target.endsWith('/')) target = `${target}/`;
          if (adj[target] !== undefined && target !== source) {
            adj[source].add(target);
          }
        }
      }
    }

    for (const source of Object.keys(adj)) {
      for (const target of adj[source]) {
        inDegree[target]++;
      }
    }

    // Check 1: Zero orphan pages
    const orphans = pages.filter((p) => p !== '/' && inDegree[p] === 0);
    expect(orphans, `Found orphan pages with zero incoming links: ${orphans.join(', ')}`).toEqual([]);

    // Check 2: BFS from Home ('/') to compute shortest click path
    const distance: Record<string, number> = {};
    for (const p of pages) {
      distance[p] = Infinity;
    }
    distance['/'] = 0;
    const queue = ['/'];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of adj[curr]) {
        if (distance[next] === Infinity) {
          distance[next] = distance[curr] + 1;
          queue.push(next);
        }
      }
    }

    // Assert every page is reachable and within 3 clicks of home
    const unreachable: string[] = [];
    const tooFar: Array<{ page: string; clicks: number }> = [];

    for (const p of pages) {
      const clicks = distance[p];
      if (clicks === Infinity) {
        unreachable.push(p);
      } else if (clicks > 3) {
        tooFar.push({ page: p, clicks });
      }
    }

    expect(unreachable, `Pages unreachable from Home: ${unreachable.join(', ')}`).toEqual([]);
    expect(tooFar, `Pages exceeding 3 clicks from Home: ${JSON.stringify(tooFar)}`).toEqual([]);

    // Check: all 13 calculators must be 1 click from home
    for (const page of seoPagesData.pages) {
      expect(distance[page.url], `${page.url} must be within 1 click of home`).toBe(1);
    }
  });
});
