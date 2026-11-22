import { describe, it, expect } from "vitest";
import { calculateEtsy } from "../etsy";

describe("Etsy Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateEtsy({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0.2); // $0.20 listing fee still applies
    expect(res.netProfit).toBe(-0.2);
  });

  it("case 2: very low price ($1.50 digital download)", () => {
    // Gross: $1.50
    // Listing fee: $0.20
    // Transaction fee: 6.5% of 1.50 = $0.10
    // Payment processing: 3% of 1.50 ($0.05) + $0.25 = $0.30
    // Total fees: 0.20 + 0.10 + 0.30 = $0.60
    const res = calculateEtsy({ price: 1.5 });
    expect(res.grossRevenue).toBe(1.5);
    expect(res.totalFees).toBe(0.6);
    expect(res.netProfit).toBe(0.9);
  });

  it("case 3: standard $60 handmade item with $6 shipping", () => {
    // Gross: $66.00
    // Listing fee: $0.20
    // Transaction fee: 6.5% of 66 = $4.29
    // Payment processing: 3% of 66 ($1.98) + $0.25 = $2.23
    // Total fees: 0.20 + 4.29 + 2.23 = $6.72
    // Costs: $18 item + $6 shipping = $24
    // Net: 66 - 6.72 - 24 = $35.28
    const res = calculateEtsy({
      price: 60,
      shippingCharged: 6,
      itemCost: 18,
      shippingCost: 6,
    });
    expect(res.grossRevenue).toBe(66);
    expect(res.totalFees).toBe(6.72);
    expect(res.netProfit).toBe(35.28);
    expect(res.profitMargin).toBe(53.45);
  });

  it("case 4: high value bespoke furniture ($3,000)", () => {
    const res = calculateEtsy({
      price: 3000,
      shippingCharged: 150,
      itemCost: 1200,
      shippingCost: 150,
    });
    expect(res.grossRevenue).toBe(3150);
    expect(res.totalFees).toBe(299.7); // 0.20 + (6.5% of 3150 = 204.75) + (3% + 0.25 = 94.75)
    expect(res.netProfit).toBe(1500.3);
  });

  it("case 5: order with 15% Offsite Ads fee applied", () => {
    // Gross: $100
    // Listing: $0.20
    // Transaction: 6.5% = $6.50
    // Payment: 3% + 0.25 = $3.25
    // Offsite ads: 15% of 100 = $15.00
    // Total fees: $24.95
    const res = calculateEtsy({ price: 100 }, { offsiteAdsPercent: 15.0 });
    expect(res.totalFees).toBe(24.95);
    expect(res.netProfit).toBe(75.05);
  });

  it("case 6: order with regulatory operating fee (e.g. 0.32% UK)", () => {
    const res = calculateEtsy({ price: 100 }, { regulatoryFeePercent: 0.32 });
    expect(res.totalFees).toBe(10.27); // 0.20 + 6.50 + 3.25 + 0.32
  });

  it("case 7: multi-quantity listing renewal (quantity: 5)", () => {
    // 5 units: listing fee is $0.20 * 5 = $1.00
    const res = calculateEtsy({ price: 20, quantity: 5, itemCost: 5 });
    expect(res.itemRevenue).toBe(100);
    expect(res.fees.find((f) => f.id === "listing_fee")?.amount).toBe(1.0);
    expect(res.totalFees).toBe(10.75); // $1.00 + $6.50 + $3.25
  });

  it("case 8: break-even price calculation", () => {
    const res = calculateEtsy({ price: 50, itemCost: 20, shippingCost: 5 });
    const breakEven = res.breakEvenPrice;
    const testBe = calculateEtsy({
      price: breakEven,
      itemCost: 20,
      shippingCost: 5,
    });
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05);
  });
});
