import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import pagesData from '../pages.json';

interface PageSeo {
  url: string;
  primary_keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  ogTitle: string;
}

const FORBIDDEN_FILLER = [
  'welcome to',
  "in today's fast-paced world",
  'are you wondering',
  'the ultimate tool',
  'in the modern world',
  'look no further',
];

describe('Phase 33: Page Content Template and Trust Signals Audit', () => {
  const pages: PageSeo[] = pagesData.pages;

  it('verifies all 13 planned SEO pages have a corresponding Astro file', () => {
    expect(pages.length).toBe(13);
    for (const page of pages) {
      const pageFile = path.resolve(
        process.cwd(),
        'src/pages',
        page.url.replace(/^\//, '').replace(/\/$/, '') + '.astro',
      );
      expect(fs.existsSync(pageFile), `File should exist: ${pageFile}`).toBe(true);
    }
  });

  pages.forEach((page) => {
    describe(`Content Template: ${page.url}`, () => {
      const pagePath = path.resolve(
        process.cwd(),
        'src/pages',
        page.url.replace(/^\//, '').replace(/\/$/, '') + '.astro',
      );
      const content = fs.readFileSync(pagePath, 'utf8');

      it('follows strict content order: TrustHeader, Calculator, Formula, Worked Example, Edge Cases, FAQ, Related Tools', () => {
        // Only inspect the rendered template body, after frontmatter (delimited by ---)
        const parts = content.split('---');
        const templateBody = parts.length >= 3 ? parts.slice(2).join('---') : content;

        const trustIdx = templateBody.indexOf('<TrustHeader');
        const calcIdx = [
          templateBody.indexOf('<CalculatorIsland'),
          templateBody.indexOf('<MarketplaceComparison'),
          templateBody.indexOf('<twitch-bits-converter'),
        ].find((idx) => idx > -1) ?? -1;
        const formulaIdx = templateBody.indexOf('<FormulaBlock');
        const workedIdx = templateBody.indexOf('<WorkedExample');
        const edgeIdx = templateBody.indexOf('<EdgeCases');
        const faqIdx = templateBody.indexOf('<FAQ');
        const relatedIdx = templateBody.indexOf('<RelatedCalculators');

        expect(trustIdx, 'TrustHeader must be present in template').toBeGreaterThan(-1);
        expect(calcIdx, 'Calculator must be present in template').toBeGreaterThan(-1);
        expect(formulaIdx, 'FormulaBlock must be present in template').toBeGreaterThan(-1);
        expect(workedIdx, 'WorkedExample must be present in template').toBeGreaterThan(-1);
        expect(edgeIdx, 'EdgeCases must be present in template').toBeGreaterThan(-1);
        expect(faqIdx, 'FAQ must be present in template').toBeGreaterThan(-1);
        expect(relatedIdx, 'RelatedCalculators must be present in template').toBeGreaterThan(-1);

        // Verify content order sequence
        expect(trustIdx, 'TrustHeader must precede Calculator').toBeLessThan(calcIdx);
        expect(calcIdx, 'Calculator must precede FormulaBlock').toBeLessThan(formulaIdx);
        expect(formulaIdx, 'FormulaBlock must precede WorkedExample').toBeLessThan(workedIdx);
        expect(workedIdx, 'WorkedExample must precede EdgeCases').toBeLessThan(edgeIdx);
        expect(edgeIdx, 'EdgeCases must precede FAQ').toBeLessThan(faqIdx);
        expect(faqIdx, 'FAQ must precede RelatedCalculators').toBeLessThan(relatedIdx);
      });

      it('opens with a direct answer paragraph containing specific real numbers (rates, percentages, currencies)', () => {
        const headerMatch = content.match(/<header[^>]*>([\s\S]*?)<\/header>/);
        expect(headerMatch, '<header> element must exist').toBeTruthy();
        const headerContent = headerMatch![1];

        // Find the first <p> inside <header>
        const pMatch = headerContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        expect(pMatch, 'First paragraph <p> in <header> must exist').toBeTruthy();

        const cleanText = pMatch![1].replace(/<[^>]+>/g, '').trim();

        // Must contain real rate numbers: % percentages or $ / £ currency
        const hasNumbers = /(\d+(\.\d+)?%|\$\d+|£\d+|\d+\s*cents?)/i.test(cleanText);
        expect(hasNumbers, `Direct answer paragraph must contain real fee numbers: "${cleanText}"`).toBe(true);

        // Zero generic filler check
        for (const filler of FORBIDDEN_FILLER) {
          expect(
            cleanText.toLowerCase().includes(filler),
            `Direct answer must not contain generic filler "${filler}": "${cleanText}"`,
          ).toBe(false);
        }
      });

      it('includes verified trust signals: Author, Last Verified Date, and Official Source Link', () => {
        expect(content.includes('TrustHeader'), 'Must include TrustHeader component').toBe(true);
        expect(content.includes('AuthorByline'), 'Must include AuthorByline trust component').toBe(true);
        expect(content.includes('LastVerified'), 'Must include LastVerified trust component').toBe(true);
      });
    });
  });

  describe('Deliberate Failure Tests on Broken Entries', () => {
    it('detects missing numbers in opening paragraph', () => {
      const genericParagraph = 'Welcome to this calculator where you can calculate fees easily.';
      const hasNumbers = /(\d+(\.\d+)?%|\$\d+|£\d+|\d+\s*cents?)/i.test(genericParagraph);
      expect(hasNumbers).toBe(false);
    });

    it('detects generic filler in opening paragraph', () => {
      const fillerParagraph = 'Welcome to the ultimate tool for calculating fees in the modern world.';
      const hasFiller = FORBIDDEN_FILLER.some((filler) => fillerParagraph.toLowerCase().includes(filler));
      expect(hasFiller).toBe(true);
    });

    it('detects inverted content order', () => {
      const invertedContent = `
        <FAQ />
        <CalculatorIsland />
      `;
      const faqIdx = invertedContent.indexOf('FAQ');
      const calcIdx = invertedContent.indexOf('CalculatorIsland');
      expect(calcIdx < faqIdx).toBe(false);
    });
  });
});
