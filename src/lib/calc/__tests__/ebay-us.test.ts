import { describe, it, expect } from "vitest";
import { calculateEbayUs } from "../ebay-us";

describe("eBay US Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateEbayUs({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
  });

  it("case 2: low price order <= $10 ($8 item gets $0.30 order fee)", () => {
    // Gross: $8.00
    // FVF: 13.25% of 8 = $1.06
    // Per-order fee (gross <= $10): $0.30
    // Total fees: $1.36
    // Net: 8 - 1.36 - 2 = $4.64
    const res = calculateEbayUs({ price: 8, itemCost: 2 });
    expect(res.grossRevenue).toBe(8);
    expect(res.totalFees).toBe(1.36);
    expect(res.netProfit).toBe(4.64);
  });

  it("case 3: standard order > $10 ($50 item with $5 shipping)", () => {
    // Gross: $55.00
    // FVF: 13.25% of 55 = $7.29
    // Per-order fee (gross > $10): $0.40
    // Total fees: $7.69
    // Costs: $15 item + $5 shipping = $20
    // Net: 55 - 7.69 - 20 = $27.31
    const res = calculateEbayUs({
      price: 50,
      shippingCharged: 5,
      itemCost: 15,
      shippingCost: 5,
    });
    expect(res.grossRevenue).toBe(55);
    expect(res.totalFees).toBe(7.69);
    expect(res.netProfit).toBe(27.31);
    expect(res.profitMargin).toBe(49.65);
  });

  it("case 4: high value collector item ($8,000 tiered threshold)", () => {
    // Gross: $8,000.00
    // First $7,500 at 13.25% = $993.75
    // Excess $500 at 2.35% = $11.75
    // Total FVF: $1,005.50
    // Per-order fee: $0.40
    // Total fees: $1,005.90
    // Net: 8000 - 1005.90 - 4500 = $2,494.10
    const res = calculateEbayUs({ price: 8000, itemCost: 4500 });
    expect(res.grossRevenue).toBe(8000);
    expect(res.totalFees).toBe(1005.9);
    expect(res.netProfit).toBe(2494.1);
  });

  it("case 5: Top Rated Seller Plus (10% discount on FVF)", () => {
    // Gross: $100
    // Raw FVF: 13.25% = $13.25
    // 10% discount on FVF: -$1.33 => $11.92
    // Order fee (> $10): $0.40
    // Total fees: $12.32
    // Net: 100 - 12.32 = $87.68
    const res = calculateEbayUs({ price: 100 }, { isTopRatedSeller: true });
    expect(res.totalFees).toBe(12.32);
    expect(res.netProfit).toBe(87.68);
  });

  it("case 6: Basic Store subscription tier (12.35% FVF)", () => {
    // Gross: $100
    // FVF: 12.35% of 100 = $12.35
    // Order fee: $0.40
    // Total fees: $12.75
    const res = calculateEbayUs({ price: 100 }, { hasStoreSubscription: true });
    expect(res.totalFees).toBe(12.75);
    expect(res.netProfit).toBe(87.25);
  });

  it("case 7: with 5% Promoted Listings ad rate", () => {
    // Gross: $100
    // FVF: $13.25 + order fee $0.40 = $13.65
    // Promo fee: 5% of 100 = $5.00
    // Total fees: $18.65
    const res = calculateEbayUs(
      { price: 100 },
      { promotedListingPercent: 5.0 },
    );
    expect(res.totalFees).toBe(18.65);
    expect(res.netProfit).toBe(81.35);
  });

  it("case 8: athletic shoes $150+ waives per-order fee and uses 8%", () => {
    // Gross: $200.00
    // Category: athletic_shoes_150 (8.0% FVF, $0 order fee)
    // FVF: 8% of 200 = $16.00
    // Order fee: $0.00 (waived)
    // Total fees: $16.00
    const res = calculateEbayUs(
      { price: 200, itemCost: 100 },
      { category: "athletic_shoes_150" },
    );
    expect(res.totalFees).toBe(16.0);
    expect(res.netProfit).toBe(84.0);
  });

  it("case 9: guitars category with lower 6.7% rate", () => {
    // Gross: $1,000
    // FVF: 6.7% of 1000 = $67.00
    // Order fee: $0.40
    // Total fees: $67.40
    const res = calculateEbayUs(
      { price: 1000 },
      { category: "musical_instruments" },
    );
    expect(res.totalFees).toBe(67.4);
    expect(res.netProfit).toBe(932.6);
  });

  it("case 10: computers category with store subscription (9.35% vs 13.25%)", () => {
    // Gross: $500
    // FVF: 9.35% of 500 = $46.75
    // Order fee: $0.40
    // Total fees: $47.15
    const res = calculateEbayUs(
      { price: 500 },
      { category: "consumer_electronics", hasStoreSubscription: true },
    );
    expect(res.totalFees).toBe(47.15);
  });

  it("case 11: break-even price calculation", () => {
    const res = calculateEbayUs({ price: 50, itemCost: 20, shippingCost: 5 });
    const breakEven = res.breakEvenPrice;
    const testBe = calculateEbayUs({
      price: breakEven,
      itemCost: 20,
      shippingCost: 5,
    });
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05);
  });
});
