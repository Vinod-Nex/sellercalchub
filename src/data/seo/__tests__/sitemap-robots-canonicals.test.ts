import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import seoPagesData from '../pages.json';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const FEES_DIR = path.resolve(process.cwd(), 'src/data/fees');

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

function parseSitemapLocsAndLastmods(xmlContent: string): Array<{ loc: string; lastmod: string }> {
  const urlBlocks = xmlContent.match(/<url>[\s\S]*?<\/url>/g) || [];
  return urlBlocks.map((block) => {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
    return {
      loc: locMatch ? locMatch[1] : '',
      lastmod: lastmodMatch ? lastmodMatch[1] : '',
    };
  });
}

describe('Phase 37: Robots.txt Configuration', () => {
  it('allows public crawling and points directly to sitemaps', () => {
    const robotsPath = path.join(DIST_DIR, 'robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);
    const content = fs.readFileSync(robotsPath, 'utf-8');

    // Allows general crawling
    expect(content).toContain('User-agent: *');
    expect(content).toContain('Allow: /');

    // Sitemaps referenced
    expect(content).toContain('Sitemap: https://sellercalchub.com/sitemap-index.xml');
    expect(content).toContain('Sitemap: https://sellercalchub.com/sitemap.xml');

    // Disallows error, iframe embeds, and internal dev routes
    expect(content).toContain('Disallow: /inputs-demo/');
    expect(content).toContain('Disallow: /design-tokens/');
    expect(content).toContain('Disallow: /social-preview-debugger/');
    expect(content).toContain('Disallow: /embed/');
    expect(content).toContain('Disallow: /404/');
    expect(content).toContain('Disallow: /500/');
  });
});

describe('Phase 37: Sitemap Configuration & Real lastmod Dates', () => {
  it('sitemap lists canonical URLs only (no redirects, no 404, no demos, no query params)', () => {
    const sitemap0Path = path.join(DIST_DIR, 'sitemap-0.xml');
    expect(fs.existsSync(sitemap0Path)).toBe(true);
    const content = fs.readFileSync(sitemap0Path, 'utf-8');
    const items = parseSitemapLocsAndLastmods(content);

    expect(items.length).toBeGreaterThanOrEqual(13);

    for (const item of items) {
      // Must use canonical https scheme and domain
      expect(item.loc.startsWith('https://sellercalchub.com/')).toBe(true);

      // Must end with trailing slash
      expect(item.loc.endsWith('/')).toBe(true);

      // Must never have query parameters or fragment identifiers
      expect(item.loc.includes('?')).toBe(false);
      expect(item.loc.includes('#')).toBe(false);

      // Must not contain error, demo, iframe embed, or redirect URLs
      expect(item.loc).not.toContain('404');
      expect(item.loc).not.toContain('500');
      expect(item.loc).not.toContain('/embed/');
      expect(item.loc).not.toContain('social-preview-debugger');
      expect(item.loc).not.toContain('inputs-demo');
      expect(item.loc).not.toContain('design-tokens');
      expect(item.loc).not.toContain('ebay-uk-fee-calculator'); // Redirect alias
      expect(item.loc).not.toContain('twitch-bits-calculator'); // Redirect alias
    }

    // Must contain all 13 planned calculator pages
    const locUrls = items.map((i) => i.loc);
    for (const page of seoPagesData.pages) {
      const canonical = `https://sellercalchub.com${page.url}`;
      expect(locUrls, `Sitemap must contain canonical URL for ${page.url}`).toContain(canonical);
    }

    // Must contain all core trust and policy pages
    const trustPages = [
      'https://sellercalchub.com/about/',
      'https://sellercalchub.com/contact/',
      'https://sellercalchub.com/privacy/',
      'https://sellercalchub.com/terms/',
      'https://sellercalchub.com/disclaimer/',
      'https://sellercalchub.com/methodology/',
      'https://sellercalchub.com/fee-changes/',
      'https://sellercalchub.com/report-fee/',
    ];
    for (const tp of trustPages) {
      expect(locUrls, `Sitemap must contain ${tp}`).toContain(tp);
    }
  });

  it('populates real lastmod timestamps matching verified fee data dates', () => {
    const sitemap0Path = path.join(DIST_DIR, 'sitemap-0.xml');
    const content = fs.readFileSync(sitemap0Path, 'utf-8');
    const items = parseSitemapLocsAndLastmods(content);

    // Read verified_on date from actual fee files
    const ebayUsFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'ebay-us.json'), 'utf-8'));
    const ebayUkFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'ebay-uk.json'), 'utf-8'));
    const etsyFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'etsy.json'), 'utf-8'));
    const whatnotFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'whatnot.json'), 'utf-8'));
    const tiktokFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'tiktok-shop.json'), 'utf-8'));
    const depopFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'depop.json'), 'utf-8'));
    const twitchFee = JSON.parse(fs.readFileSync(path.join(FEES_DIR, 'twitch-bits.json'), 'utf-8'));

    const expectedDates: Record<string, string> = {
      'https://sellercalchub.com/ebay-fee-calculator/': ebayUsFee.verified_on,
      'https://sellercalchub.com/ebay-fee-calculator-uk/': ebayUkFee.verified_on,
      'https://sellercalchub.com/etsy-fee-calculator/': etsyFee.verified_on,
      'https://sellercalchub.com/whatnot-fee-calculator/': whatnotFee.verified_on,
      'https://sellercalchub.com/tiktok-shop-fee-calculator/': tiktokFee.verified_on,
      'https://sellercalchub.com/depop-fee-calculator/': depopFee.verified_on,
      'https://sellercalchub.com/twitch-bits-to-usd/': twitchFee.verified_on,
    };

    for (const [url, expectedDate] of Object.entries(expectedDates)) {
      const entry = items.find((i) => i.loc === url);
      expect(entry, `Entry for ${url} must exist in sitemap`).toBeDefined();
      expect(entry!.lastmod).toBe(`${expectedDate}T00:00:00.000Z`);
    }
  });

  it('sitemap.xml and sitemap-index.xml exist and point to valid sitemap chunks', () => {
    const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
    const sitemapIndexPath = path.join(DIST_DIR, 'sitemap-index.xml');

    expect(fs.existsSync(sitemapPath)).toBe(true);
    expect(fs.existsSync(sitemapIndexPath)).toBe(true);

    const indexContent = fs.readFileSync(sitemapIndexPath, 'utf-8');
    expect(indexContent).toContain('sitemap-0.xml');
  });
});

describe('Phase 37: Self-Referencing Canonicals & Robots Directives', () => {
  it('every indexable page has a self-referencing canonical URL', () => {
    const allFiles = findHtmlFiles(DIST_DIR);

    // Filter out redirect stubs, error pages (404, 500), and standalone iframe widgets
    const indexableFiles = allFiles.filter((f) => {
      if (
        f.endsWith('404.html') ||
        f.includes('/404/') ||
        f.endsWith('500.html') ||
        f.includes('/500/') ||
        f.includes('/embed/')
      )
        return false;
      const content = fs.readFileSync(f, 'utf-8');
      return !content.includes('<meta http-equiv="refresh"');
    });

    for (const f of indexableFiles) {
      let pagePath = f.replace(DIST_DIR, '').replace(/index\.html$/, '');
      if (!pagePath.startsWith('/')) pagePath = `/${pagePath}`;

      const html = fs.readFileSync(f, 'utf-8');
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      expect(canonicalMatch, `Page ${pagePath} must contain canonical link tag`).not.toBeNull();

      const expectedCanonical = `https://sellercalchub.com${pagePath}`;
      expect(canonicalMatch![1], `Page ${pagePath} must have self-referencing canonical`).toBe(expectedCanonical);

      // Verify robots tag on clean indexable pages allows indexing
      const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
      expect(robotsMatch, `Page ${pagePath} must contain robots tag`).not.toBeNull();
      if (!pagePath.includes('inputs-demo') && !pagePath.includes('design-tokens')) {
        expect(robotsMatch![1]).toContain('index');
        expect(robotsMatch![1]).toContain('follow');
      }
    }
  });

  it('404 error page has noindex, nofollow directives and proper static 404 output', () => {
    const errorPagePath = path.join(DIST_DIR, '404.html');
    expect(fs.existsSync(errorPagePath), 'dist/404.html must exist').toBe(true);

    const html = fs.readFileSync(errorPagePath, 'utf-8');
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    expect(robotsMatch, '404 page must have robots tag').not.toBeNull();
    expect(robotsMatch![1]).toBe('noindex, nofollow');

    // Contains friendly recovery navigation
    expect(html).toContain('href="/marketplace-fee-calculators/"');
    expect(html).toContain('href="/"');
  });

  it('500 error page has noindex, nofollow directives and proper static 500 output', () => {
    const errorPagePath = path.join(DIST_DIR, '500.html');
    expect(fs.existsSync(errorPagePath), 'dist/500.html must exist').toBe(true);

    const html = fs.readFileSync(errorPagePath, 'utf-8');
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    expect(robotsMatch, '500 page must have robots tag').not.toBeNull();
    expect(robotsMatch![1]).toBe('noindex, nofollow');

    // Contains friendly recovery navigation
    expect(html).toContain('href="/marketplace-fee-calculators/"');
    expect(html).toContain('href="/"');
    expect(html).toContain('id="reload-page-btn"');
  });

  it('query-parameter states have client-side and server-side noindex handling', () => {
    const headPath = path.resolve(process.cwd(), 'src/components/Head.astro');
    const headSource = fs.readFileSync(headPath, 'utf-8');

    // Server-side check
    expect(headSource).toContain("hasQueryParams");
    expect(headSource).toContain('<meta name="robots" content="noindex, follow" />');

    // Client-side synchronous flash prevention and query param enforcement
    expect(headSource).toContain("robots.setAttribute('content', 'noindex, follow')");
    expect(headSource).toContain("canonical.setAttribute('href'");
  });
});
