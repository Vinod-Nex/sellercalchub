import { describe, it, expect } from 'vitest';
import { lintSeoPages, type SeoPagesData } from '../../../../scripts/lint-seo';
import prodSeoData from '../pages.json';

describe('Phase 32: SEO Metadata Build-Time Linter', () => {
  it('passes cleanly on valid production pages.json', () => {
    const errors = lintSeoPages(prodSeoData as unknown as SeoPagesData);
    expect(errors).toHaveLength(0);
  });

  it('fails when title exceeds 60 characters', () => {
    const brokenData: SeoPagesData = {
      pages: [
        {
          url: '/test-page/',
          primary_keyword: 'test page',
          title: 'This is a deliberately way too long title designed to exceed sixty chars easily',
          metaDescription: 'Valid meta description under 160 characters with soft call to action.',
          h1: 'Valid Distinct H1 Header',
          ogTitle: 'Valid OG Title',
        },
      ],
    };

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'title-max-length')).toBe(true);
    const titleErr = errors.find((e) => e.rule === 'title-max-length');
    expect(titleErr?.message).toContain('Title exceeds 60 characters');
  });

  it('fails when metaDescription exceeds 160 characters', () => {
    const brokenData: SeoPagesData = {
      pages: [
        {
          url: '/test-page/',
          primary_keyword: 'test page',
          title: 'Test Page: Valid Short Title (2026)',
          metaDescription:
            'This is a deliberately over-extended meta description crafted to break past the maximum allowed length of one hundred and sixty characters for search engine result snippets in Google SERPs.',
          h1: 'Valid Distinct H1 Header',
          ogTitle: 'Valid OG Title',
        },
      ],
    };

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'metaDescription-max-length')).toBe(true);
    const metaErr = errors.find((e) => e.rule === 'metaDescription-max-length');
    expect(metaErr?.message).toContain('metaDescription exceeds 160 characters');
  });

  it('fails when H1 matches title word-for-word', () => {
    const brokenData: SeoPagesData = {
      pages: [
        {
          url: '/test-page/',
          primary_keyword: 'test page',
          title: 'Test Page Fee Calculator',
          metaDescription: 'Valid meta description with soft CTA.',
          h1: 'Test Page Fee Calculator', // Deliberately identical to title
          ogTitle: 'Valid OG Title',
        },
      ],
    };

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'h1-matches-title')).toBe(true);
    const h1Err = errors.find((e) => e.rule === 'h1-matches-title');
    expect(h1Err?.message).toContain('H1 must be different word-for-word from title');
  });

  it('fails when required fields are missing', () => {
    const brokenData = {
      pages: [
        {
          url: '/test-page/',
          primary_keyword: 'test page',
          // Missing title, metaDescription, h1, ogTitle
        },
      ],
    } as unknown as SeoPagesData;

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'missing-title')).toBe(true);
    expect(errors.some((e) => e.rule === 'missing-metaDescription')).toBe(true);
    expect(errors.some((e) => e.rule === 'missing-h1')).toBe(true);
    expect(errors.some((e) => e.rule === 'missing-ogTitle')).toBe(true);
  });

  it('fails when duplicate titles or primary keywords exist across pages', () => {
    const brokenData: SeoPagesData = {
      pages: [
        {
          url: '/page-one/',
          primary_keyword: 'shared keyword',
          title: 'Shared Title Across Pages (2026)',
          metaDescription: 'Meta description for page one.',
          h1: 'Header One Distinct',
          ogTitle: 'OG One',
        },
        {
          url: '/page-two/',
          primary_keyword: 'shared keyword', // Duplicate primary keyword
          title: 'Shared Title Across Pages (2026)', // Duplicate title
          metaDescription: 'Meta description for page two.',
          h1: 'Header Two Distinct',
          ogTitle: 'OG Two',
        },
      ],
    };

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'duplicate-title')).toBe(true);
    expect(errors.some((e) => e.rule === 'duplicate-primary-keyword')).toBe(true);
  });

  it('fails when primary keyword is missing or not near front of title', () => {
    const brokenData: SeoPagesData = {
      pages: [
        {
          url: '/test-page/',
          primary_keyword: 'whatnot fee calculator',
          title: 'Everything You Need To Know In Detail About The whatnot fee calculator',
          metaDescription: 'Valid meta description with soft CTA.',
          h1: 'Distinct H1 Heading',
          ogTitle: 'Valid OG Title',
        },
      ],
    };

    const errors = lintSeoPages(brokenData);
    expect(errors.some((e) => e.rule === 'primary-keyword-not-near-front')).toBe(true);
  });
});
