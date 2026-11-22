import { describe, it, expect } from "vitest";
import {
  runCalculator,
  PLATFORM_CONFIGS,
  type PlatformId,
} from "../dispatcher";

describe("runCalculator & PLATFORM_CONFIGS", () => {
  const platforms: PlatformId[] = [
    "whatnot",
    "tiktok-shop",
    "depop",
    "etsy",
    "ebay-us",
    "ebay-uk",
    "twitch-bits",
  ];

  it("provides valid configuration for all platforms", () => {
    for (const p of platforms) {
      const cfg = PLATFORM_CONFIGS[p];
      expect(cfg).toBeDefined();
      expect(cfg.id).toBe(p);
      expect(cfg.name).toBeTruthy();
      expect(cfg.defaultCurrency).toMatch(/^(USD|GBP)$/);
      expect(cfg.defaultPrice).toBeGreaterThan(0);
      expect(cfg.defaultQuantity).toBe(1);
    }
  });

  it("runs Whatnot calculation with positive profit for defaults", () => {
    const res = runCalculator("whatnot", {
      price: 50,
      shippingCharged: 0,
      itemCost: 15,
      shippingCost: 0,
      quantity: 1,
    });
    expect(res.netProfit).toBeGreaterThan(0);
    expect(res.fees.length).toBeGreaterThan(0);
    expect(res.profitMargin).toBeGreaterThan(0);
    expect(res.breakEvenPrice).toBeGreaterThan(15);
  });

  it("runs eBay UK calculation with GBP currency", () => {
    const res = runCalculator("ebay-uk", {
      price: 40,
      shippingCharged: 4,
      itemCost: 10,
      shippingCost: 4,
      quantity: 1,
    });
    expect(res.currency).toBe("GBP");
    expect(res.netProfit).toBe(30); // 0% selling fee for private sellers
  });

  it("runs Twitch Bits calculation with Bits conversion", () => {
    const res = runCalculator("twitch-bits", {
      price: 1000,
      shippingCharged: 0,
      itemCost: 0,
      shippingCost: 0,
      quantity: 1,
    });
    expect(res.grossRevenue).toBe(10.0);
    expect(res.netProfit).toBe(10.0);
  });
});
