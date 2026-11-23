import fs from 'node:fs';
import path from 'node:path';

export interface ThinContentPage {
  filePath: string;
  relativePath: string;
  url: string;
  isIndexable: boolean;
  title: string;
  metaDescription: string;
  cleanedBodyText: string;
  wordCount: number;
  shingles: Set<string>;
}

export interface ThinContentViolation {
  url: string;
  filePath: string;
  rule: 'thin-word-count' | 'duplicate-title' | 'duplicate-meta' | 'template-only-copy' | 'template-placeholder';
  message: string;
}

/**
 * Extracts content from an HTML string and cleans out boilerplate
 * (header, footer, nav, scripts, styles, svg, cookie banners).
 */
export function extractPageContent(html: string, filePath: string, distDir: string): ThinContentPage {
  const relativePath = path.relative(distDir, filePath);
  const url = '/' + relativePath.replace(/index\.html$/, '').replace(/\.html$/, '');
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`;

  // Detect noindex or refresh redirects
  const isNoindex = /meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const isRedirect = /meta[^>]*http-equiv=["']refresh["']/i.test(html);
  const isIndexable = !isNoindex && !isRedirect;

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '';

  // Extract meta description
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDescription = metaMatch ? metaMatch[1].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '';

  // Extract body content: prefer <main>, fallback to <body>
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let rawBody = mainMatch ? mainMatch[1] : (bodyMatch ? bodyMatch[1] : html);

  // Remove non-content elements
  rawBody = rawBody.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  rawBody = rawBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  rawBody = rawBody.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  rawBody = rawBody.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ');
  rawBody = rawBody.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ');
  rawBody = rawBody.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  rawBody = rawBody.replace(/<div[^>]*id=["']consent-banner["'][^>]*>[\s\S]*?<\/div>/gi, ' ');
  rawBody = rawBody.replace(/<(?:div|aside)[^>]*id=["']privacy-notice["'][\s\S]*?<\/(?:div|aside)>/gi, ' ');

  // Strip tags and decode entities
  const text = rawBody
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&times;/g, 'x')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Build 3-word shingles for similarity analysis
  const shingles = new Set<string>();
  const lowerWords = words.map((w) => w.toLowerCase());
  for (let i = 0; i <= lowerWords.length - 3; i++) {
    shingles.add(`${lowerWords[i]} ${lowerWords[i + 1]} ${lowerWords[i + 2]}`);
  }

  return {
    filePath,
    relativePath,
    url: normalizedUrl,
    isIndexable,
    title,
    metaDescription,
    cleanedBodyText: text,
    wordCount,
    shingles,
  };
}

/**
 * Computes Jaccard similarity of 3-gram shingles between two pages:
 * J(A, B) = |A ∩ B| / |A ∪ B|
 */
export function computeShingleSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Validates a list of pages against thin content rules:
 * 1. Minimum 300 words of unique body text.
 * 2. Zero duplicated titles or meta descriptions across distinct URLs.
 * 3. Zero template-only copies or near-duplicate bodies (similarity >= 70%).
 * 4. Zero unreplaced template placeholders.
 */
export function checkThinContent(pages: ThinContentPage[]): ThinContentViolation[] {
  const violations: ThinContentViolation[] = [];
  const indexablePages = pages.filter((p) => p.isIndexable);

  const seenTitles = new Map<string, ThinContentPage>();
  const seenMetas = new Map<string, ThinContentPage>();

  for (const page of indexablePages) {
    // Rule 1: Minimum 300 words of unique body text
    if (page.wordCount < 300) {
      violations.push({
        url: page.url,
        filePath: page.filePath,
        rule: 'thin-word-count',
        message: `Page "${page.url}" has only ${page.wordCount} words of body text (minimum required: 300 words).`,
      });
    }

    // Rule 2: Title presence & uniqueness
    if (!page.title) {
      violations.push({
        url: page.url,
        filePath: page.filePath,
        rule: 'duplicate-title',
        message: `Page "${page.url}" is missing a valid <title>.`,
      });
    } else {
      const normalizedTitle = page.title.toLowerCase().trim();
      const existing = seenTitles.get(normalizedTitle);
      if (existing && existing.url !== page.url) {
        violations.push({
          url: page.url,
          filePath: page.filePath,
          rule: 'duplicate-title',
          message: `Duplicated title across distinct indexable pages: "${page.title}" on ${page.url} (already used by ${existing.url}).`,
        });
      } else if (!existing) {
        seenTitles.set(normalizedTitle, page);
      }
    }

    // Rule 2b: Meta description presence & uniqueness
    if (!page.metaDescription) {
      violations.push({
        url: page.url,
        filePath: page.filePath,
        rule: 'duplicate-meta',
        message: `Page "${page.url}" is missing a valid meta description.`,
      });
    } else {
      const normalizedMeta = page.metaDescription.toLowerCase().trim();
      const existing = seenMetas.get(normalizedMeta);
      if (existing && existing.url !== page.url) {
        violations.push({
          url: page.url,
          filePath: page.filePath,
          rule: 'duplicate-meta',
          message: `Duplicated meta description across distinct indexable pages on ${page.url} (already used by ${existing.url}).`,
        });
      } else if (!existing) {
        seenMetas.set(normalizedMeta, page);
      }
    }

    // Rule 4: Template placeholder check (unreplaced development markers or dummy copy)
    if (/\b(lorem ipsum|insert (?:content|text) here|\[todo\]|todo:|\{\{[^}]+\}\})\b/i.test(page.cleanedBodyText)) {
      violations.push({
        url: page.url,
        filePath: page.filePath,
        rule: 'template-placeholder',
        message: `Page "${page.url}" contains unreplaced placeholder text or development TODO markers in body.`,
      });
    }
  }

  // Rule 3: Template-only body / copy of an existing page check
  // Compare every pair of distinct indexable pages
  for (let i = 0; i < indexablePages.length; i++) {
    for (let j = i + 1; j < indexablePages.length; j++) {
      const p1 = indexablePages[i];
      const p2 = indexablePages[j];

      const sim = computeShingleSimilarity(p1.shingles, p2.shingles);
      // If 3-gram phrase overlap is 70% or higher, it is an unauthorized duplicate or template clone
      if (sim >= 0.70) {
        violations.push({
          url: p2.url,
          filePath: p2.filePath,
          rule: 'template-only-copy',
          message: `Page "${p2.url}" is a template-only copy or near-duplicate of "${p1.url}" (${(sim * 100).toFixed(1)}% phrase overlap). Every page must carry unique substance.`,
        });
      }
    }
  }

  return violations;
}

/**
 * Scans a dist directory recursively for HTML files.
 */
export function scanDistHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanDistHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = path.resolve('dist');

  console.log(`\n========================================`);
  console.log(`THIN-CONTENT BUILD-TIME GUARD (Phase 43)`);
  console.log(`Target: ${distDir}`);
  console.log(`========================================\n`);

  if (!fs.existsSync(distDir)) {
    console.error(`❌ FATAL: dist directory does not exist at ${distDir}. Run "npm run build" first.`);
    process.exit(1);
  }

  const htmlFiles = scanDistHtmlFiles(distDir);
  if (htmlFiles.length === 0) {
    console.error(`❌ FATAL: No HTML files found in ${distDir}.`);
    process.exit(1);
  }

  const pages = htmlFiles.map((f) => extractPageContent(fs.readFileSync(f, 'utf-8'), f, distDir));
  const indexableCount = pages.filter((p) => p.isIndexable).length;
  const noindexCount = pages.length - indexableCount;

  console.log(`Discovered ${pages.length} total HTML pages:`);
  console.log(` - ${indexableCount} public indexable pages subjected to thin-content checks.`);
  console.log(` - ${noindexCount} non-indexable or redirect pages excluded.\n`);

  const violations = checkThinContent(pages);

  if (violations.length > 0) {
    console.error(`❌ THIN-CONTENT GUARD FAILED: Found ${violations.length} violation(s):\n`);
    for (const [idx, v] of violations.entries()) {
      console.error(`  ${idx + 1}. [${v.rule}] on ${v.url}:`);
      console.error(`     ${v.message}\n`);
    }
    process.exit(1);
  } else {
    console.log(`✅ THIN-CONTENT GUARD PASSED: All ${indexableCount} public pages verified.`);
    console.log(`   - Every indexable page carries ≥ 300 words of unique body text.`);
    console.log(`   - Zero duplicate titles or meta descriptions across all pages.`);
    console.log(`   - Zero template-only copies or verbatim cloned content (all < 70% shingle overlap).`);
    console.log(`   - Zero placeholder markers or unreplaced boilerplate.\n`);
    process.exit(0);
  }
}
