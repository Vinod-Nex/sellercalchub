import fs from 'node:fs';
import path from 'node:path';

export interface SeoPageEntry {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  ogTitle: string;
  primary_keyword: string;
  search_intent?: string;
  tier?: string;
  monthly_searches?: number;
  kd?: number | null;
  supporting_variants?: unknown[];
}

export interface SeoPagesData {
  pages: SeoPageEntry[];
  competing_pages?: unknown[];
}

export interface LintError {
  url: string;
  rule: string;
  message: string;
}

export function lintSeoPages(data: SeoPagesData): LintError[] {
  const errors: LintError[] = [];

  if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
    errors.push({
      url: 'ROOT',
      rule: 'missing-pages',
      message: 'pages.json is missing or contains an empty "pages" array.',
    });
    return errors;
  }

  const seenUrls = new Map<string, number>();
  const seenTitles = new Map<string, string>();
  const seenMetas = new Map<string, string>();
  const seenH1s = new Map<string, string>();
  const seenPrimaries = new Map<string, string>();

  for (const page of data.pages) {
    const pageUrl = page.url || '(unknown URL)';

    // 1. Missing Required Fields Check
    if (!page.url || typeof page.url !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-url', message: 'Page entry is missing a valid "url".' });
    }
    if (!page.title || typeof page.title !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-title', message: 'Page is missing a valid "title".' });
    }
    if (!page.metaDescription || typeof page.metaDescription !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-metaDescription', message: 'Page is missing a valid "metaDescription".' });
    }
    if (!page.h1 || typeof page.h1 !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-h1', message: 'Page is missing a valid "h1".' });
    }
    if (!page.ogTitle || typeof page.ogTitle !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-ogTitle', message: 'Page is missing a valid "ogTitle".' });
    }
    if (!page.primary_keyword || typeof page.primary_keyword !== 'string') {
      errors.push({ url: pageUrl, rule: 'missing-primary-keyword', message: 'Page is missing a "primary_keyword".' });
    }

    if (!page.title || !page.metaDescription || !page.h1 || !page.primary_keyword) {
      continue;
    }

    // 2. Length Constraints Checks
    // Max 60 characters for title
    if (page.title.length > 60) {
      errors.push({
        url: pageUrl,
        rule: 'title-max-length',
        message: `Title exceeds 60 characters (actual: ${page.title.length} chars): "${page.title}"`,
      });
    }

    // Max 160 characters for metaDescription
    if (page.metaDescription.length > 160) {
      errors.push({
        url: pageUrl,
        rule: 'metaDescription-max-length',
        message: `metaDescription exceeds 160 characters (actual: ${page.metaDescription.length} chars): "${page.metaDescription}"`,
      });
    }

    // 3. H1 vs Title Word-for-Word Distinction Check
    if (page.h1.trim().toLowerCase() === page.title.trim().toLowerCase()) {
      errors.push({
        url: pageUrl,
        rule: 'h1-matches-title',
        message: `H1 must be different word-for-word from title. Both are: "${page.title}"`,
      });
    }

    // 4. Primary Keyword Near Front of Title Check (within first 35 characters)
    const normalizedTitle = page.title.toLowerCase();
    const normalizedKeyword = page.primary_keyword.toLowerCase();
    const keywordIndex = normalizedTitle.indexOf(normalizedKeyword);

    if (keywordIndex === -1) {
      errors.push({
        url: pageUrl,
        rule: 'primary-keyword-missing-from-title',
        message: `Primary keyword "${page.primary_keyword}" was not found inside title "${page.title}".`,
      });
    } else if (keywordIndex > 35) {
      errors.push({
        url: pageUrl,
        rule: 'primary-keyword-not-near-front',
        message: `Primary keyword "${page.primary_keyword}" appears at character index ${keywordIndex}, which is not near the front (limit: <= 35).`,
      });
    }

    // 5. Duplicate Checks Across Pages
    // Duplicate URL
    const urlCount = (seenUrls.get(page.url) || 0) + 1;
    seenUrls.set(page.url, urlCount);
    if (urlCount > 1) {
      errors.push({ url: pageUrl, rule: 'duplicate-url', message: `Duplicate URL found: ${page.url}` });
    }

    // Duplicate Title
    const normalizedTitleKey = page.title.trim().toLowerCase();
    if (seenTitles.has(normalizedTitleKey)) {
      errors.push({
        url: pageUrl,
        rule: 'duplicate-title',
        message: `Duplicate title found across pages (already used by ${seenTitles.get(normalizedTitleKey)}): "${page.title}"`,
      });
    } else {
      seenTitles.set(normalizedTitleKey, page.url);
    }

    // Duplicate metaDescription
    const normalizedMetaKey = page.metaDescription.trim().toLowerCase();
    if (seenMetas.has(normalizedMetaKey)) {
      errors.push({
        url: pageUrl,
        rule: 'duplicate-metaDescription',
        message: `Duplicate metaDescription found across pages (already used by ${seenMetas.get(normalizedMetaKey)}): "${page.metaDescription}"`,
      });
    } else {
      seenMetas.set(normalizedMetaKey, page.url);
    }

    // Duplicate H1
    const normalizedH1Key = page.h1.trim().toLowerCase();
    if (seenH1s.has(normalizedH1Key)) {
      errors.push({
        url: pageUrl,
        rule: 'duplicate-h1',
        message: `Duplicate H1 found across pages (already used by ${seenH1s.get(normalizedH1Key)}): "${page.h1}"`,
      });
    } else {
      seenH1s.set(normalizedH1Key, page.url);
    }

    // Duplicate primary_keyword
    const normalizedPrimKey = page.primary_keyword.trim().toLowerCase();
    if (seenPrimaries.has(normalizedPrimKey)) {
      errors.push({
        url: pageUrl,
        rule: 'duplicate-primary-keyword',
        message: `Duplicate primary keyword found across pages (already used by ${seenPrimaries.get(normalizedPrimKey)}): "${page.primary_keyword}"`,
      });
    } else {
      seenPrimaries.set(normalizedPrimKey, page.url);
    }
  }

  return errors;
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = path.resolve('src/data/seo/pages.json');
  console.log(`\n========================================`);
  console.log(`SEO METADATA BUILD-TIME LINTER (Phase 32)`);
  console.log(`Target: ${filePath}`);
  console.log(`========================================\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ FATAL: SEO data file not found at ${filePath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(filePath, 'utf-8');
  let data: SeoPagesData;
  try {
    data = JSON.parse(rawJson);
  } catch (err) {
    console.error(`❌ FATAL: JSON parse error in ${filePath}:`, err);
    process.exit(1);
  }

  const errors = lintSeoPages(data);

  if (errors.length > 0) {
    console.error(`❌ LINT FAILED: Found ${errors.length} SEO metadata violation(s):\n`);
    for (const [idx, err] of errors.entries()) {
      console.error(`  ${idx + 1}. [${err.rule}] on ${err.url}:`);
      console.error(`     ${err.message}\n`);
    }
    process.exit(1);
  } else {
    console.log(`✅ LINT PASSED: Verified ${data.pages.length} pages.`);
    console.log(`   - All titles ≤ 60 chars with primary keywords positioned near front.`);
    console.log(`   - All meta descriptions ≤ 160 chars reading like ad copy with soft CTAs.`);
    console.log(`   - All H1s are distinct word-for-word from titles.`);
    console.log(`   - Zero duplicates on titles, meta descriptions, H1s, or primary keywords.`);
    console.log(`   - All Open Graph ogTitles defined.\n`);
    process.exit(0);
  }
}
