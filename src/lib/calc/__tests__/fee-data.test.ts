import { describe, it, expect } from 'vitest';
import {
  ALL_PLATFORM_FEES,
  getPlatformFeeData,
  formatFeeSummary,
  formatVerifiedDate,
  getAllCalculatorsMeta,
} from '../fee-data';

describe('Fee Data System & Content Components Integration', () => {
  it('loads verified fee data for all supported platforms without TODOs', () => {
    const platforms = ['whatnot', 'tiktok-shop', 'depop', 'etsy', 'ebay-us', 'ebay-uk', 'twitch-bits'];

    for (const p of platforms) {
      const data = getPlatformFeeData(p);
      expect(data, `Fee data for platform ${p} should exist`).toBeDefined();
      expect(data?.verified_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data?.source_url).toMatch(/^https?:\/\//);
      expect(Array.isArray(data?.rates)).toBe(true);
      expect(data?.rates.length).toBeGreaterThan(0);
    }
  });

  it('formats verified dates into accessible US English strings', () => {
    expect(formatVerifiedDate('2026-11-22')).toBe('November 22, 2026');
    expect(formatVerifiedDate('2024-10-01')).toBe('October 1, 2024');
    expect(formatVerifiedDate(undefined)).toBe('November 22, 2026');
  });

  it('dynamically formats fee summaries from JSON rate structures', () => {
    expect(formatFeeSummary('whatnot')).toBe('8.0% + 2.9% + $0.30');
    expect(formatFeeSummary('tiktok-shop')).toBe('6.0% referral fee');
    expect(formatFeeSummary('depop')).toBe('0% selling + 3.3% + $0.45');
    expect(formatFeeSummary('etsy')).toBe('6.5% + $0.20 + 3.0% + $0.25');
    expect(formatFeeSummary('ebay-us')).toContain('13.25% + $0.40');
    expect(formatFeeSummary('ebay-uk')).toContain('0% Private / 12.8% Business + VAT');
    expect(formatFeeSummary('twitch-bits')).toBe('$0.01 / Bit Payout');
  });

  it('verifies that changing a rate in JSON updates related calculator meta immediately', () => {
    const metaList = getAllCalculatorsMeta();
    expect(metaList.length).toBe(7);

    const whatnotMeta = metaList.find((m) => m.id === 'whatnot');
    expect(whatnotMeta?.rate).toBe('8.0% + 2.9% + $0.30');

    // Simulate rate change in memory to verify reactivity contract
    const originalRate = ALL_PLATFORM_FEES.whatnot.rates[0].percentage;
    try {
      ALL_PLATFORM_FEES.whatnot.rates[0].percentage = 8.5;
      expect(formatFeeSummary('whatnot')).toBe('8.5% + 2.9% + $0.30');
      const updatedMeta = getAllCalculatorsMeta().find((m) => m.id === 'whatnot');
      expect(updatedMeta?.rate).toBe('8.5% + 2.9% + $0.30');
    } finally {
      ALL_PLATFORM_FEES.whatnot.rates[0].percentage = originalRate;
    }
  });

  it('provides all calculators with valid URLs and non-empty descriptions', () => {
    const meta = getAllCalculatorsMeta();
    for (const item of meta) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.desc.length).toBeGreaterThan(0);
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.rate.length).toBeGreaterThan(0);
    }
  });
});
