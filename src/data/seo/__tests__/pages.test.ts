import { describe, it, expect } from 'vitest';
import seoPagesData from '../pages.json';

describe('Phase 31: SEO Keyword-to-Page Architecture Map', () => {
  it('loads valid pages.json with required metadata', () => {
    expect(seoPagesData).toBeDefined();
    expect(seoPagesData.pages).toBeInstanceOf(Array);
    expect(seoPagesData.pages.length).toBeGreaterThanOrEqual(12);
  });

  it('enforces that no keyword is the primary for two pages', () => {
    const primaryKeywords = seoPagesData.pages.map((p) => p.primary_keyword.trim().toLowerCase());
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const kw of primaryKeywords) {
      if (seen.has(kw)) {
        duplicates.push(kw);
      }
      seen.add(kw);
    }

    expect(duplicates).toEqual([]);
    expect(seoPagesData.audit_checks.no_duplicate_primary_keywords).toBe(true);
    expect(seoPagesData.audit_checks.single_primary_keyword_per_page_enforced).toBe(true);
  });

  it('verifies every planned page has primary_keyword, search_intent, and tier', () => {
    for (const page of seoPagesData.pages) {
      expect(page.url).toMatch(/^\/[a-z0-9-]+\/$/);
      expect(page.primary_keyword).toBeTruthy();
      expect(page.search_intent).toMatch(/^(Commercial|Informational|Transactional|Navigational)$/);
      expect(page.tier).toBeTruthy();
      expect(Array.isArray(page.supporting_variants)).toBe(true);
    }
  });

  it('ensures competitor-brand keywords marked Skip are dropped', () => {
    const competitorBrands = ['autods', 'zik', 'alura'];
    
    for (const page of seoPagesData.pages) {
      // Check primary keyword
      for (const brand of competitorBrands) {
        expect(page.primary_keyword.toLowerCase()).not.toContain(brand);
      }

      // Check all supporting variants
      for (const variant of page.supporting_variants) {
        for (const brand of competitorBrands) {
          expect(variant.keyword.toLowerCase()).not.toContain(brand);
        }
      }
    }

    expect(seoPagesData.audit_checks.competitor_brands_dropped).toBe(true);
    expect(seoPagesData.dropped_skip_keywords.length).toBeGreaterThan(0);
  });

  it('lists competing pages with cannibalization analysis and resolution', () => {
    expect(seoPagesData.competing_pages).toBeInstanceOf(Array);
    expect(seoPagesData.competing_pages.length).toBeGreaterThanOrEqual(5);

    for (const comp of seoPagesData.competing_pages) {
      expect(comp.query).toBeTruthy();
      expect(comp.competing_urls.length).toBeGreaterThanOrEqual(2);
      expect(comp.overlap_nature).toBeTruthy();
      expect(comp.resolution_strategy).toBeTruthy();
    }
  });
});
