import { describe, it, expect } from "vitest";
import { calculateEbayUs } from "../ebay-us";

describe("eBay US Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateEbayUs({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
  });

  it("case 2: low price order <= $10 ($8 item gets $0.40 order fee)", () => {
    // Gross: $8.00
    // FVF: 13.25% of 8 = $1.06
    // Per-order fee (gross <= $10): $0.40
    // Total fees: $1.46
    const res = calculateEbayUs({ price: 8, itemCost: 2 });
    expect(res.grossRevenue).toBe(8);
    expect(res.totalFees).toBe(1.46);
    expect(res.netProfit).toBe(4.54); // 8 - 1.46 - 2
  });

  it("case 3: standard order > $10 ($50 item with $5 shipping)", () => {
    // Gross: $55.00
    // FVF: 13.25% of 55 = $7.29
    // Per-order fee (gross > $10): $0.30
    // Total fees: $7.59
    // Costs: $15 item + $5 shipping = $20
    // Net: 55 - 7.59 - 20 = $27.41
    const res = calculateEbayUs({
      price: 50,
      shippingCharged: 5,
      itemCost: 15,
      shippingCost: 5,
    });
    expect(res.grossRevenue).toBe(55);
    expect(res.totalFees).toBe(7.59);
    expect(res.netProfit).toBe(27.41);
    expect(res.profitMargin).toBe(49.84);
  });

  it("case 4: high value collector item ($8,000)", () => {
    const res = calculateEbayUs({ price: 8000, itemCost: 4500 });
    expect(res.grossRevenue).toBe(8000);
    expect(res.totalFees).toBe(1060.3); // 13.25% ($1060.00) + $0.30
    expect(res.netProfit).toBe(2439.7);
  });

  it("case 5: Top Rated Seller Plus (10% discount on FVF)", () => {
    // Gross: $100
    // Raw FVF: 13.25% = $13.25
    // 10% discount on FVF: -$1.33 => $11.92
    // Order fee: $0.30
    // Total fees: $12.22
    const res = calculateEbayUs({ price: 100 }, { isTopRatedSeller: true });
    expect(res.totalFees).toBe(12.22);
    expect(res.netProfit).toBe(87.78);
  });

  it("case 6: Basic Store subscription tier (12.35% FVF)", () => {
    const res = calculateEbayUs({ price: 100 }, { hasStoreSubscription: true });
    expect(res.totalFees).toBe(12.65); // 12.35% of 100 ($12.35) + $0.30
    expect(res.netProfit).toBe(87.35);
  });

  it("case 7: with 5% Promoted Listings ad rate", () => {
    // Gross: $100
    // FVF: $13.25 + order fee $0.30 = $13.55
    // Promo fee: 5% of 100 = $5.00
    // Total fees: $18.55
    const res = calculateEbayUs(
      { price: 100 },
      { promotedListingPercent: 5.0 },
    );
    expect(res.totalFees).toBe(18.55);
    expect(res.netProfit).toBe(81.45);
  });

  it("case 8: break-even price calculation", () => {
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
