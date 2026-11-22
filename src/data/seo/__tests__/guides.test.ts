import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const GUIDES_FILE = path.resolve(ROOT_DIR, 'src/data/seo/guides.json');
const PAGES_FILE = path.resolve(ROOT_DIR, 'src/data/seo/pages.json');
const GUIDES_DIR = path.resolve(ROOT_DIR, 'src/pages/guides');

interface GuideEntry {
  id: string;
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  primary_keyword: string;
  search_intent: string;
  cluster: string;
  monthly_searches: number;
  target_calculator_url: string;
  target_calculator_anchor: string;
  verified_fee_facts: string[];
  status: 'published' | 'planned';
}

interface GuidesData {
  title: string;
  editorial_policy: string;
  guides: GuideEntry[];
}

interface PageEntry {
  url: string;
  title: string;
  primary_keyword: string;
  supporting_variants?: string[];
}

interface PagesData {
  pages: PageEntry[];
}

describe('Phase 42: Supporting SEO Guides & Cannibalization Prevention', () => {
  it('loads guides.json and verifies 10 proposed guides with complete metadata', () => {
    expect(fs.existsSync(GUIDES_FILE), 'guides.json must exist in src/data/seo/').toBe(true);

    const guidesData: GuidesData = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf-8'));
    expect(guidesData.guides.length, 'Must propose exactly 10 supporting guides').toBe(10);

    const publishedGuides = guidesData.guides.filter((g) => g.status === 'published');
    const plannedGuides = guidesData.guides.filter((g) => g.status === 'planned');

    expect(publishedGuides.length, 'Must have exactly 3 published guides for review').toBe(3);
    expect(plannedGuides.length, 'Must have 7 planned guides awaiting review').toBe(7);

    for (const guide of guidesData.guides) {
      expect(guide.id, 'Guide id must be non-empty').toBeTruthy();
      expect(guide.url, 'Guide url must start and end with slash').toMatch(/^\/guides\/[a-z0-9-]+\/$/);
      expect(guide.title.length, `Title "${guide.title}" must be <= 60 chars`).toBeLessThanOrEqual(60);
      expect(guide.metaDescription.length, `Meta description for "${guide.id}" must be <= 160 chars`).toBeLessThanOrEqual(160);
      expect(guide.h1.trim().toLowerCase(), 'H1 must be distinct from title').not.toBe(guide.title.trim().toLowerCase());
      expect(guide.primary_keyword, 'Guide must have primary keyword').toBeTruthy();
      expect(guide.search_intent, 'Search intent must be Informational').toBe('Informational');
      expect(guide.target_calculator_url, 'Target calculator URL must be specified').toMatch(/^\/[a-z0-9-]+\/$/);
      expect(guide.target_calculator_anchor, 'Target anchor must be descriptive').toBeTruthy();
      expect(guide.verified_fee_facts.length, 'Must have verified fee facts').toBeGreaterThanOrEqual(3);
    }
  });

  it('CHECK: no guide competes with a calculator page (zero keyword or intent cannibalization)', () => {
    const guidesData: GuidesData = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf-8'));
    const pagesData: PagesData = JSON.parse(fs.readFileSync(PAGES_FILE, 'utf-8'));

    const calculatorUrls = new Set(pagesData.pages.map((p) => p.url));
    const calculatorKeywords = new Set(pagesData.pages.map((p) => p.primary_keyword.trim().toLowerCase()));
    const calculatorTitles = new Set(pagesData.pages.map((p) => p.title.trim().toLowerCase()));

    const allCalculatorKeywords: string[] = [];
    for (const page of pagesData.pages) {
      allCalculatorKeywords.push(page.primary_keyword.trim().toLowerCase());
      if (Array.isArray(page.supporting_variants)) {
        for (const variant of page.supporting_variants) {
          allCalculatorKeywords.push(String(variant).trim().toLowerCase());
        }
      }
    }
    const allCalculatorKeywordsSet = new Set(allCalculatorKeywords);

    for (const guide of guidesData.guides) {
      const guideKw = guide.primary_keyword.trim().toLowerCase();
      const guideTitle = guide.title.trim().toLowerCase();

      // 1. Guide primary keyword cannot match any calculator primary keyword
      expect(
        calculatorKeywords.has(guideKw),
        `Guide keyword "${guide.primary_keyword}" collides with a calculator page primary keyword!`
      ).toBe(false);

      // 2. Guide primary keyword must not contain the word "calculator" (which represents transactional tool intent)
      expect(
        guideKw.includes('calculator'),
        `Guide primary keyword "${guide.primary_keyword}" must not contain "calculator" (calculators own tool intent)`
      ).toBe(false);

      // 3. Guide URL must not collide with any calculator URL
      expect(
        calculatorUrls.has(guide.url),
        `Guide URL "${guide.url}" collides with calculator URL!`
      ).toBe(false);

      // 4. Guide title must not collide with any calculator title
      expect(
        calculatorTitles.has(guideTitle),
        `Guide title "${guide.title}" collides with calculator title!`
      ).toBe(false);

      // 5. Target calculator URL must exist in the calculator catalog
      expect(
        calculatorUrls.has(guide.target_calculator_url),
        `Guide target calculator "${guide.target_calculator_url}" must exist in pages.json`
      ).toBe(true);

      // 6. Anchor text must be descriptive (never 'click here' or generic)
      expect(guide.target_calculator_anchor.toLowerCase()).not.toContain('click here');
      expect(guide.target_calculator_anchor.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('validates the first 3 published guide files exist with correct on-page SEO', () => {
    const guidesData: GuidesData = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf-8'));
    const published = guidesData.guides.filter((g) => g.status === 'published');

    expect(published.length).toBe(3);

    for (const guide of published) {
      const filePath = path.join(GUIDES_DIR, `${guide.id}.astro`);
      expect(fs.existsSync(filePath), `Guide component ${filePath} must exist`).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check title length in code
      const titleMatch = content.match(/title=["']([^"']+)["']/);
      expect(titleMatch, `File ${guide.id}.astro must declare title attribute`).not.toBeNull();
      const declaredTitle = titleMatch![1];
      expect(declaredTitle.length, `Title in ${guide.id}.astro must be <= 60 chars`).toBeLessThanOrEqual(60);

      // Check description length in code
      const descMatch = content.match(/description=["']([^"']+)["']/);
      expect(descMatch, `File ${guide.id}.astro must declare description attribute`).not.toBeNull();
      const declaredDesc = descMatch![1];
      expect(declaredDesc.length, `Description in ${guide.id}.astro must be <= 160 chars`).toBeLessThanOrEqual(160);

      // Check canonicalPath
      expect(content).toContain(`canonicalPath="${guide.url}"`);

      // Check H1 is present and matches guide.h1
      expect(content).toContain(guide.h1);

      // Check target calculator link exists
      expect(content).toContain(`href="${guide.target_calculator_url}"`);

      // Check structured data schema: Article & BreadcrumbList
      expect(content).toContain("'@type': 'Article'");
      expect(content).toContain('buildBreadcrumbSchema');

      // Check Trust signals: AuthorByline, SourceLink, LastVerified
      expect(content).toContain('<AuthorByline');
      expect(content).toContain('<SourceLink');
      expect(content).toContain('<LastVerified');

      // Check worked example exists
      expect(content).toContain('Worked Example');
    }
  });
});
