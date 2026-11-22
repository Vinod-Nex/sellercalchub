import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildWebApplicationSchema,
  buildFaqSchema,
  buildCalculatorStructuredData,
} from '../../../lib/schema';
import seoPagesData from '../pages.json';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

interface SchemaObject {
  '@context'?: string;
  '@type'?: string;
  [key: string]: unknown;
}

function extractJsonLd(html: string): SchemaObject[] {
  const matches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const schemas: SchemaObject[] = [];
  for (const match of matches) {
    const rawContent = match[1].trim();
    if (rawContent) {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    }
  }
  return schemas;
}

describe('Phase 34: Structured Data Schema Library (src/lib/schema.ts)', () => {
  it('buildOrganizationSchema generates valid Schema.org Organization for home', () => {
    const org = buildOrganizationSchema();
    expect(org['@context']).toBe('https://schema.org');
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('Seller Calc Hub');
    expect(org.url).toBe('https://sellercalchub.com/');
    expect(typeof org.logo).toBe('string');
    expect(org.logo).toMatch(/^https:\/\/sellercalchub\.com\/.+\.(png|svg|webp)$/);
    expect(typeof org.description).toBe('string');
    expect((org.description as string).length).toBeGreaterThan(20);
  });

  it('buildWebSiteSchema generates valid Schema.org WebSite with SearchAction', () => {
    const site = buildWebSiteSchema();
    expect(site['@context']).toBe('https://schema.org');
    expect(site['@type']).toBe('WebSite');
    expect(site.name).toBe('Seller Calc Hub');
    expect(site.url).toBe('https://sellercalchub.com/');
    expect(site.potentialAction).toBeDefined();
    const action = site.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
    expect(action.target).toContain('{search_term_string}');
  });

  it('buildBreadcrumbSchema creates 1-indexed ListItems with absolute URLs for all items', () => {
    const items = [
      { name: 'Home', href: '/' },
      { name: 'All Calculators', href: '/marketplace-fee-calculators/' },
      { name: 'Whatnot Fee Calculator' },
    ];
    const breadcrumbs = buildBreadcrumbSchema(items, '/whatnot-fee-calculator/');
    expect(breadcrumbs['@context']).toBe('https://schema.org');
    expect(breadcrumbs['@type']).toBe('BreadcrumbList');

    const elements = breadcrumbs.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);

    // 1-indexed positions
    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe('Home');
    expect(elements[0].item).toBe('https://sellercalchub.com/');

    expect(elements[1].position).toBe(2);
    expect(elements[1].name).toBe('All Calculators');
    expect(elements[1].item).toBe('https://sellercalchub.com/marketplace-fee-calculators/');

    // Leaf item correctly maps to canonical URL
    expect(elements[2].position).toBe(3);
    expect(elements[2].name).toBe('Whatnot Fee Calculator');
    expect(elements[2].item).toBe('https://sellercalchub.com/whatnot-fee-calculator/');
  });

  it('buildWebApplicationSchema generates valid WebApplication with free offers and requirements', () => {
    const app = buildWebApplicationSchema({
      name: 'eBay Fee Calculator',
      url: '/ebay-fee-calculator/',
      description: 'Calculate eBay selling fees and net profit.',
      currency: 'USD',
    });

    expect(app['@context']).toBe('https://schema.org');
    expect(app['@type']).toBe('WebApplication');
    expect(app.name).toBe('eBay Fee Calculator');
    expect(app.url).toBe('https://sellercalchub.com/ebay-fee-calculator/');
    expect(app.applicationCategory).toBe('BusinessApplication');
    expect(app.operatingSystem).toBe('All');
    expect(app.browserRequirements).toBe('Requires JavaScript. Requires HTML5.');

    const offers = app.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.price).toBe('0');
    expect(offers.priceCurrency).toBe('USD');

    const publisher = app.publisher as Record<string, unknown>;
    expect(publisher['@type']).toBe('Organization');
    expect(publisher.name).toBe('Seller Calc Hub');
  });

  it('buildWebApplicationSchema supports GBP currency for UK calculators', () => {
    const app = buildWebApplicationSchema({
      name: 'eBay UK Fee Calculator',
      url: '/ebay-fee-calculator-uk/',
      description: 'Calculate UK eBay fees.',
      currency: 'GBP',
    });
    const offers = app.offers as Record<string, unknown>;
    expect(offers.priceCurrency).toBe('GBP');
  });

  it('buildFaqSchema returns null on empty array and valid FAQPage with matching questions and answers', () => {
    expect(buildFaqSchema([])).toBeNull();

    const faqs = [
      { question: 'What is fee rate?', answer: 'It is 8%.' },
      { question: 'Who pays shipping?', answer: 'Buyer pays.' },
    ];
    const faqSchema = buildFaqSchema(faqs);
    expect(faqSchema).not.toBeNull();
    expect(faqSchema!['@context']).toBe('https://schema.org');
    expect(faqSchema!['@type']).toBe('FAQPage');

    const entities = faqSchema!.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    expect(entities[0]['@type']).toBe('Question');
    expect(entities[0].name).toBe('What is fee rate?');
    expect((entities[0].acceptedAnswer as Record<string, unknown>)['@type']).toBe('Answer');
    expect((entities[0].acceptedAnswer as Record<string, unknown>).text).toBe('It is 8%.');
  });

  it('buildCalculatorStructuredData bundles WebApplication, BreadcrumbList, and FAQPage', () => {
    const schemas = buildCalculatorStructuredData({
      name: 'Whatnot Fee Calculator',
      url: '/whatnot-fee-calculator/',
      description: 'Calculate Whatnot live selling fees.',
      breadcrumbs: [
        { name: 'Home', href: '/' },
        { name: 'Whatnot Fee Calculator' },
      ],
      faqs: [{ question: 'Is Whatnot free?', answer: 'Listing is free.' }],
    });

    expect(schemas).toHaveLength(3);
    expect(schemas.some((s) => s['@type'] === 'WebApplication')).toBe(true);
    expect(schemas.some((s) => s['@type'] === 'BreadcrumbList')).toBe(true);
    expect(schemas.some((s) => s['@type'] === 'FAQPage')).toBe(true);
  });
});

describe('Phase 34: Built HTML Validation (dist/)', () => {
  it('home page (dist/index.html) contains Organization, WebSite, and WebApplication schemas', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);
    const html = fs.readFileSync(indexPath, 'utf-8');
    const schemas = extractJsonLd(html);

    const orgSchema = schemas.find((s) => s['@type'] === 'Organization');
    expect(orgSchema).toBeDefined();
    expect(orgSchema!.name).toBe('Seller Calc Hub');
    expect(orgSchema!.url).toBe('https://sellercalchub.com/');

    const siteSchema = schemas.find((s) => s['@type'] === 'WebSite');
    expect(siteSchema).toBeDefined();
    expect(siteSchema!.name).toBe('Seller Calc Hub');

    const appSchema = schemas.find((s) => s['@type'] === 'WebApplication');
    expect(appSchema).toBeDefined();
    expect((appSchema!.offers as Record<string, unknown>).price).toBe('0');
  });

  it('all 13 calculator pages contain WebApplication, BreadcrumbList, and FAQPage matching visible content', () => {
    for (const pageEntry of seoPagesData.pages) {
      const urlPath = pageEntry.url.replace(/^\//, '').replace(/\/$/, '');
      const filePath = path.join(DIST_DIR, urlPath, 'index.html');

      expect(fs.existsSync(filePath), `HTML file for ${pageEntry.url} must exist`).toBe(true);
      const html = fs.readFileSync(filePath, 'utf-8');
      const schemas = extractJsonLd(html);

      // 1. WebApplication Schema validation
      const webApp = schemas.find((s) => s['@type'] === 'WebApplication');
      expect(webApp, `${pageEntry.url} must contain WebApplication schema`).toBeDefined();
      expect(typeof webApp!.name).toBe('string');
      expect(webApp!.name).toBeTruthy();
      expect(webApp!.url).toBe(`https://sellercalchub.com${pageEntry.url}`);
      expect(webApp!.applicationCategory).toBeDefined();
      expect(webApp!.operatingSystem).toBe('All');
      expect(webApp!.browserRequirements).toBe('Requires JavaScript. Requires HTML5.');
      const offers = webApp!.offers as Record<string, unknown>;
      expect(offers['@type']).toBe('Offer');
      expect(offers.price).toBe('0');
      if (pageEntry.url === '/ebay-fee-calculator-uk/') {
        expect(offers.priceCurrency).toBe('GBP');
      } else {
        expect(offers.priceCurrency).toBe('USD');
      }

      // 2. BreadcrumbList Schema validation
      const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumb, `${pageEntry.url} must contain BreadcrumbList schema`).toBeDefined();
      const listElements = breadcrumb!.itemListElement as Array<Record<string, unknown>>;
      expect(listElements.length).toBeGreaterThanOrEqual(2);
      listElements.forEach((el, idx) => {
        expect(el['@type']).toBe('ListItem');
        expect(el.position).toBe(idx + 1);
        expect(typeof el.name).toBe('string');
        expect(typeof el.item).toBe('string');
        expect(el.item as string).toMatch(/^https:\/\/sellercalchub\.com\//);
      });
      // Leaf item must point to canonical URL
      const leafItem = listElements[listElements.length - 1];
      expect(leafItem.item).toBe(`https://sellercalchub.com${pageEntry.url}`);

      // 3. FAQPage Schema validation & visible content match
      const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage');
      expect(faqSchema, `${pageEntry.url} must contain FAQPage schema`).toBeDefined();
      const faqEntities = faqSchema!.mainEntity as Array<Record<string, unknown>>;
      expect(faqEntities.length).toBeGreaterThan(0);

      // Verify each FAQ Question and Answer matches visible text on the page
      for (const entity of faqEntities) {
        expect(entity['@type']).toBe('Question');
        const qName = entity.name as string;
        expect(qName).toBeTruthy();
        expect(html.includes(qName), `Visible HTML on ${pageEntry.url} must contain exact question: "${qName}"`).toBe(true);

        const acceptedAnswer = entity.acceptedAnswer as Record<string, unknown>;
        expect(acceptedAnswer['@type']).toBe('Answer');
        const aText = acceptedAnswer.text as string;
        expect(aText).toBeTruthy();
        // Visible HTML might have HTML entities encoded (e.g. &amp;, &quot;, &#39;), verify substring or presence
        const normalizedAnswer = aText.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const found = html.includes(aText) || html.includes(normalizedAnswer) || html.includes(aText.slice(0, 50));
        expect(found, `Visible HTML on ${pageEntry.url} must contain answer snippet for: "${qName}"`).toBe(true);
      }
    }
  });

  it('nested informational pages contain BreadcrumbList schema and DO NOT contain FAQPage', () => {
    const infoPages = [
      'about',
      'contact',
      'methodology',
      'privacy',
      'terms',
      'disclaimer',
      'report-fee',
      'analytics-dashboard',
    ];

    for (const pageName of infoPages) {
      const filePath = path.join(DIST_DIR, pageName, 'index.html');
      expect(fs.existsSync(filePath), `HTML file for /${pageName}/ must exist`).toBe(true);
      const html = fs.readFileSync(filePath, 'utf-8');
      const schemas = extractJsonLd(html);

      // Must contain BreadcrumbList
      const breadcrumb = schemas.find((s) => s['@type'] === 'BreadcrumbList');
      expect(breadcrumb, `/${pageName}/ must contain BreadcrumbList schema`).toBeDefined();
      const listElements = breadcrumb!.itemListElement as Array<Record<string, unknown>>;
      expect(listElements.length).toBeGreaterThanOrEqual(2);
      listElements.forEach((el, idx) => {
        expect(el.position).toBe(idx + 1);
        expect(el.item as string).toMatch(/^https:\/\/sellercalchub\.com\//);
      });
      const leafItem = listElements[listElements.length - 1];
      expect(leafItem.item).toBe(`https://sellercalchub.com/${pageName}/`);

      // Must NOT contain FAQPage (no visible FAQ exists on info pages)
      const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage');
      expect(faqSchema, `/${pageName}/ must not have FAQPage schema`).toBeUndefined();
    }
  });
});
