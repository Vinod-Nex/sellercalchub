import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  useTranslations,
  registerDictionary,
  getHreflangTags,
  LOCALIZED_SLUG_MAP,
  SUPPORTED_LOCALES,
  type UiDictionary,
} from '../../../i18n';
import { calculateEbayUs } from '../../../lib/calc/ebay-us';
import { getPlatformFeeData } from '../../../lib/calc/fee-data';

describe('Phase 50: Language Readiness & Monetisation Verification', () => {
  const rootDir = process.cwd();
  const i18nPlanPath = path.join(rootDir, 'I18N-PLAN.md');
  const monetisePath = path.join(rootDir, 'MONETISE.md');
  const astroConfigPath = path.join(rootDir, 'astro.config.mjs');

  it('UI dictionary system exists with complete English strings', () => {
    const { t, dict } = useTranslations('en');

    // Verify all key sections exist
    expect(dict.nav.home).toBe('Home');
    expect(dict.calculator.soldPrice).toBe('Item Sold Price');
    expect(dict.results.netProfit).toBe('Net Profit');
    expect(dict.trust.verifiedBadge).toContain('2026 Verified');
    expect(dict.embed.copyCode).toBe('Copy Embed Code');
    expect(dict.footer.allRightsReserved).toBe('All rights reserved.');

    // Verify translation helper returns correct strings
    expect(t('calculator', 'soldPrice')).toBe('Item Sold Price');
    expect(t('results', 'netProfit')).toBe('Net Profit');
  });

  it('localized slug mapping covers all 13 calculators and hub across en, pt, es, fr', () => {
    const requiredCanonicalUrls = [
      '/',
      '/marketplace-fee-calculators/',
      '/ebay-fee-calculator/',
      '/ebay-final-value-fee-calculator/',
      '/ebay-profit-calculator/',
      '/ebay-and-paypal-fee-calculator/',
      '/ebay-shipping-fee-calculator/',
      '/ebay-fee-calculator-uk/',
      '/etsy-fee-calculator/',
      '/etsy-offsite-ads-fee-calculator/',
      '/whatnot-fee-calculator/',
      '/tiktok-shop-fee-calculator/',
      '/depop-fee-calculator/',
      '/twitch-bits-to-usd/',
    ];

    for (const url of requiredCanonicalUrls) {
      const mapping = LOCALIZED_SLUG_MAP[url];
      expect(mapping, `Slug mapping must exist for ${url}`).toBeDefined();
      expect(mapping.en).toBe(url);
      expect(mapping.pt, `PT slug must exist for ${url}`).toBeDefined();
      expect(mapping.es, `ES slug must exist for ${url}`).toBeDefined();
      expect(mapping.fr, `FR slug must exist for ${url}`).toBeDefined();
    }
  });

  it('hreflang generator outputs reciprocal tags plus x-default', () => {
    // 1. Single locale default behavior
    const singleTags = getHreflangTags('/ebay-fee-calculator/', {
      siteUrl: 'https://sellercalchub.com',
      locales: ['en'],
    });

    const xDefault = singleTags.find((t) => t.hreflang === 'x-default');
    const enTag = singleTags.find((t) => t.hreflang === 'en');

    expect(xDefault).toBeDefined();
    expect(xDefault!.href).toBe('https://sellercalchub.com/ebay-fee-calculator/');
    expect(enTag).toBeDefined();
    expect(enTag!.href).toBe('https://sellercalchub.com/ebay-fee-calculator/');

    // 2. Multi-locale reciprocal tags when international routes are active
    const multiTags = getHreflangTags('/ebay-fee-calculator/', {
      siteUrl: 'https://sellercalchub.com',
      locales: ['en', 'pt', 'es', 'fr'],
    });

    expect(multiTags.length).toBe(5); // x-default, en, pt, es, fr
    expect(multiTags.find((t) => t.hreflang === 'pt')!.href).toBe(
      'https://sellercalchub.com/pt/calculadora-taxas-ebay/'
    );
    expect(multiTags.find((t) => t.hreflang === 'es')!.href).toBe(
      'https://sellercalchub.com/es/calculadora-comisiones-ebay/'
    );
    expect(multiTags.find((t) => t.hreflang === 'fr')!.href).toBe(
      'https://sellercalchub.com/fr/calculateur-frais-ebay/'
    );
  });

  it('Astro config configures i18n behind ENABLE_I18N flag', () => {
    expect(fs.existsSync(astroConfigPath)).toBe(true);
    const astroConfig = fs.readFileSync(astroConfigPath, 'utf8');

    expect(astroConfig).toMatch(/enableI18n\s*=/);
    expect(astroConfig).toMatch(/process\.env\.ENABLE_I18N/);
    expect(astroConfig).toMatch(/locales:\s*enableI18n\s*\?\s*\["en",\s*"pt",\s*"es",\s*"fr"\]\s*:\s*\["en"\]/);
  });

  it('I18N-PLAN.md contains Semrush PT, ES, FR keyword tables and volume verification decision rules', () => {
    expect(fs.existsSync(i18nPlanPath), 'I18N-PLAN.md must exist').toBe(true);
    const content = fs.readFileSync(i18nPlanPath, 'utf8');

    // Contains all three languages
    expect(content).toMatch(/Portuguese/i);
    expect(content).toMatch(/Spanish/i);
    expect(content).toMatch(/French/i);

    // References local Semrush database
    expect(content).toMatch(/keyword-plan-ranked\.xlsx/i);

    // Decision rules
    expect(content).toMatch(/build only.*verified|Volume Threshold Rule/i);
    expect(content).toMatch(/250/); // 250 monthly search threshold

    // Zero refactor architecture statement
    expect(content).toMatch(/data and strings only|zero.*refactor/i);
  });

  it('MONETISE.md covers display ads and affiliate options starting after traffic exists', () => {
    expect(fs.existsSync(monetisePath), 'MONETISE.md must exist').toBe(true);
    const content = fs.readFileSync(monetisePath, 'utf8');

    // Rule: Starts after traffic exists
    expect(content).toMatch(/after.*traffic exists|Phase 0: Launch & Growth \(0 – 10k sessions\)/i);

    // Affiliate options
    expect(content).toMatch(/affiliate/i);
    expect(content).toMatch(/Pirate Ship|shipping/i);
    expect(content).toMatch(/rel="sponsored/i);

    // Display ads
    expect(content).toMatch(/display ad|Mediavine|Raptive/i);
    expect(content).toMatch(/Google AdSense.*strictly forbidden|Prohibited Networks/i);
    expect(content).toMatch(/Cumulative Layout Shift|CLS/i);
    expect(content).toMatch(/zero popups|interstitials/i);
  });

  it('Check: adding a language needs data and strings only, no refactor', () => {
    // Simulate adding German ('de') without touching ANY component code or calculation code
    const mockDeDict: Partial<UiDictionary> = {
      calculator: {
        // @ts-expect-error partial dictionary
        soldPrice: 'Verkaufspreis',
      },
      results: {
        // @ts-expect-error partial dictionary
        netProfit: 'Nettogewinn',
      },
    };

    // 1. Register dictionary
    registerDictionary('de', mockDeDict);
    const deTranslations = useTranslations('de');

    expect(deTranslations.t('calculator', 'soldPrice')).toBe('Verkaufspreis');
    expect(deTranslations.t('results', 'netProfit')).toBe('Nettogewinn');
    // Fallback works for un-translated keys
    expect(deTranslations.t('trust', 'verifiedBadge')).toContain('2026 Verified');

    // 2. Underlying calculation logic executes universally without refactoring
    const calcResult = calculateEbayUs({
      price: 100,
      itemCost: 20,
      shippingCharged: 10,
      shippingCost: 8,
    });

    expect(calcResult.netProfit).toBeGreaterThan(0);
    expect(calcResult.totalFees).toBeGreaterThan(0);

    // 3. Hreflang mapping handles custom locales seamlessly
    const customHreflang = getHreflangTags('/ebay-fee-calculator/', {
      siteUrl: 'https://sellercalchub.com',
      locales: ['en', 'de' as any],
    });

    const deTag = customHreflang.find((t) => t.hreflang === 'de');
    expect(deTag).toBeDefined();
    expect(deTag!.href).toBe('https://sellercalchub.com/de/ebay-fee-calculator/');
  });
});
