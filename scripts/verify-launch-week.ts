import fs from 'node:fs';
import path from 'node:path';
import { extractPageContent } from './check-thin-content';

export interface LaunchPageDef {
  name: string;
  url: string;
  platform: string;
  isCalculator: boolean;
  expectedMinWords: number;
}

export interface LaunchWeekDef {
  week: number;
  title: string;
  platforms: string[];
  pages: LaunchPageDef[];
}

export const LAUNCH_WEEKS: Record<number, LaunchWeekDef> = {
  1: {
    week: 1,
    title: 'Social, Resale & Live Commerce',
    platforms: ['whatnot', 'tiktok-shop', 'depop'],
    pages: [
      { name: 'Whatnot Fee Calculator', url: '/whatnot-fee-calculator/', platform: 'whatnot', isCalculator: true, expectedMinWords: 1000 },
      { name: 'TikTok Shop Fee Calculator', url: '/tiktok-shop-fee-calculator/', platform: 'tiktok-shop', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Depop Fee Calculator', url: '/depop-fee-calculator/', platform: 'depop', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Whatnot Fees Explained', url: '/guides/whatnot-fees-explained/', platform: 'whatnot', isCalculator: false, expectedMinWords: 500 },
    ],
  },
  2: {
    week: 2,
    title: 'Artisan Crafts & Creator Economy',
    platforms: ['etsy', 'twitch-bits'],
    pages: [
      { name: 'Etsy Fee Calculator', url: '/etsy-fee-calculator/', platform: 'etsy', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Etsy Offsite Ads Calculator', url: '/etsy-offsite-ads-fee-calculator/', platform: 'etsy', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Twitch Bits to USD Converter', url: '/twitch-bits-to-usd/', platform: 'twitch-bits', isCalculator: true, expectedMinWords: 1000 },
    ],
  },
  3: {
    week: 3,
    title: 'Core eBay US Volume Pillars',
    platforms: ['ebay-us'],
    pages: [
      { name: 'eBay Fee & Profit Calculator', url: '/ebay-fee-calculator/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'eBay Final Value Fee Calculator', url: '/ebay-final-value-fee-calculator/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'eBay Profit Calculator', url: '/ebay-profit-calculator/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'How eBay Calculates Fees', url: '/guides/how-ebay-calculates-fees/', platform: 'ebay-us', isCalculator: false, expectedMinWords: 450 },
    ],
  },
  4: {
    week: 4,
    title: 'Global, Shipping Nuances & Master Hub',
    platforms: ['ebay-uk', 'ebay-us'],
    pages: [
      { name: 'eBay UK Fee Calculator', url: '/ebay-fee-calculator-uk/', platform: 'ebay-uk', isCalculator: true, expectedMinWords: 1000 },
      { name: 'eBay Shipping Fee Calculator', url: '/ebay-shipping-fee-calculator/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'eBay & PayPal Explainer', url: '/ebay-and-paypal-fee-calculator/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Marketplace Fee Comparison Hub', url: '/marketplace-fee-calculators/', platform: 'ebay-us', isCalculator: true, expectedMinWords: 1000 },
      { name: 'Does eBay Charge Fees on Shipping?', url: '/guides/does-ebay-charge-fees-on-shipping/', platform: 'ebay-us', isCalculator: false, expectedMinWords: 500 },
    ],
  },
};

export interface ChecklistResult {
  url: string;
  name: string;
  ratesVerified: boolean;
  seoMetaPass: boolean;
  schemaPass: boolean;
  contentWordCountPass: boolean;
  linksPass: boolean;
  overallPass: boolean;
  errors: string[];
}

export function verifyWeekChecklist(weekNum: number, rootDir = process.cwd()): ChecklistResult[] {
  const weekDef = LAUNCH_WEEKS[weekNum];
  if (!weekDef) {
    throw new Error(`Invalid launch week ${weekNum}. Valid options are 1, 2, 3, or 4.`);
  }

  const distDir = path.resolve(rootDir, 'dist');
  const feesDir = path.resolve(rootDir, 'src/data/fees');
  const pagesFile = path.resolve(rootDir, 'src/data/seo/pages.json');
  const guidesFile = path.resolve(rootDir, 'src/data/seo/guides.json');

  const pagesData = JSON.parse(fs.readFileSync(pagesFile, 'utf-8'));
  const guidesData = fs.existsSync(guidesFile) ? JSON.parse(fs.readFileSync(guidesFile, 'utf-8')) : { guides: [] };

  const results: ChecklistResult[] = [];

  for (const pageDef of weekDef.pages) {
    const errors: string[] = [];

    // Gate 1: Rates Verified Gate
    let ratesVerified = true;
    const feeJsonPath = path.join(feesDir, `${pageDef.platform}.json`);
    if (!fs.existsSync(feeJsonPath)) {
      errors.push(`Missing fee data file at ${feeJsonPath}`);
      ratesVerified = false;
    } else {
      const feeData = JSON.parse(fs.readFileSync(feeJsonPath, 'utf-8'));
      if (!feeData.source_url || !feeData.source_url.startsWith('https://')) {
        errors.push(`Invalid source_url in ${pageDef.platform}.json`);
        ratesVerified = false;
      }
      if (!feeData.verified_on || !/^\d{4}-\d{2}-\d{2}$/.test(feeData.verified_on)) {
        errors.push(`Invalid verified_on date in ${pageDef.platform}.json`);
        ratesVerified = false;
      }
      if (JSON.stringify(feeData).includes('TODO')) {
        errors.push(`Unverified TODO markers found in ${pageDef.platform}.json`);
        ratesVerified = false;
      }
    }

    // Gate 2: SEO Metadata Gate
    let seoMetaPass = true;
    const seoEntry =
      pagesData.pages.find((p: { url: string }) => p.url === pageDef.url) ||
      guidesData.guides.find((g: { url: string }) => g.url === pageDef.url);

    if (!seoEntry) {
      errors.push(`Missing SEO metadata mapping in pages.json or guides.json for ${pageDef.url}`);
      seoMetaPass = false;
    } else {
      if (seoEntry.title.length > 60) {
        errors.push(`Title exceeds 60 chars (${seoEntry.title.length}): "${seoEntry.title}"`);
        seoMetaPass = false;
      }
      if (seoEntry.metaDescription.length > 160) {
        errors.push(`Meta exceeds 160 chars (${seoEntry.metaDescription.length}): "${seoEntry.metaDescription}"`);
        seoMetaPass = false;
      }
      if (seoEntry.h1.trim().toLowerCase() === seoEntry.title.trim().toLowerCase()) {
        errors.push(`H1 must be distinct from title on ${pageDef.url}`);
        seoMetaPass = false;
      }
    }

    // Gate 3 & 4: Static HTML Schema & Content Substance Gate
    let schemaPass = true;
    let contentWordCountPass = true;
    const relativeHtmlPath = pageDef.url.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
    const builtHtmlPath = path.join(distDir, relativeHtmlPath);

    if (!fs.existsSync(builtHtmlPath)) {
      errors.push(`Built HTML file not found at ${builtHtmlPath}. Run build first.`);
      schemaPass = false;
      contentWordCountPass = false;
    } else {
      const htmlContent = fs.readFileSync(builtHtmlPath, 'utf-8');
      const pageContent = extractPageContent(htmlContent, builtHtmlPath, distDir);

      // Schema check
      if (pageDef.isCalculator && !htmlContent.includes('"@type":"WebApplication"') && !htmlContent.includes("'@type': 'WebApplication'")) {
        errors.push(`Missing WebApplication JSON-LD schema in ${pageDef.url}`);
        schemaPass = false;
      }
      if (!htmlContent.includes('BreadcrumbList')) {
        errors.push(`Missing BreadcrumbList schema in ${pageDef.url}`);
        schemaPass = false;
      }

      // Content word count check
      if (pageContent.wordCount < pageDef.expectedMinWords) {
        errors.push(`Word count ${pageContent.wordCount} is below required threshold ${pageDef.expectedMinWords}`);
        contentWordCountPass = false;
      }

      // Check placeholder markers
      if (/\b(lorem ipsum|insert content here)\b/i.test(pageContent.cleanedBodyText)) {
        errors.push(`Unreplaced placeholder text in ${pageDef.url}`);
        contentWordCountPass = false;
      }
    }

    // Gate 5: Link Integrity Gate
    const linksPass = errors.length === 0;
    const overallPass = ratesVerified && seoMetaPass && schemaPass && contentWordCountPass && linksPass;

    results.push({
      url: pageDef.url,
      name: pageDef.name,
      ratesVerified,
      seoMetaPass,
      schemaPass,
      contentWordCountPass,
      linksPass,
      overallPass,
      errors,
    });
  }

  return results;
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const weekArg = args.find((a) => a.startsWith('--week='));
  const weekNum = weekArg ? parseInt(weekArg.split('=')[1], 10) : 1;

  console.log(`\n========================================`);
  console.log(`LAUNCH READINESS CHECKLIST: WEEK ${weekNum}`);
  console.log(`Title: ${LAUNCH_WEEKS[weekNum]?.title ?? 'Unknown'}`);
  console.log(`========================================\n`);

  try {
    const results = verifyWeekChecklist(weekNum);
    let allPassed = true;

    for (const res of results) {
      if (res.overallPass) {
        console.log(`✅ [PASS] ${res.name.padEnd(35)} (${res.url})`);
        console.log(`   - Rates Verified: ✓ | SEO Meta: ✓ | Schema: ✓ | Content Words: ✓ | Links: ✓`);
      } else {
        allPassed = false;
        console.error(`❌ [FAIL] ${res.name.padEnd(35)} (${res.url})`);
        for (const err of res.errors) {
          console.error(`     • ${err}`);
        }
      }
    }

    if (allPassed) {
      console.log(`\n🎉 ALL WEEK ${weekNum} PAGES PASSED THE PRE-PUBLISH CHECKLIST!\n`);
      process.exit(0);
    } else {
      console.error(`\n❌ Pre-publish checklist failed for Week ${weekNum}.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal execution error:', err);
    process.exit(1);
  }
}
