import { describe, it, expect } from "vitest";
import { calculateDepop } from "../depop";

describe("Depop Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateDepop({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
  });

  it("case 2: very low price ($2.00 vintage accessory)", () => {
    // Current Depop: 0% marketplace fee + 3.3% + $0.45 payment fee
    // Payment: 3.3% of $2.00 ($0.07) + $0.45 = $0.52
    const res = calculateDepop({ price: 2.0, itemCost: 0.5 });
    expect(res.grossRevenue).toBe(2.0);
    expect(res.totalFees).toBe(0.52);
    expect(res.netProfit).toBe(0.98);
  });

  it("case 3: standard $45 sale with $6 shipping", () => {
    // Gross: $51.00
    // Marketplace fee: $0 (0% current)
    // Depop Payments: 3.3% of 51 ($1.68) + $0.45 = $2.13
    const res = calculateDepop({
      price: 45,
      shippingCharged: 6,
      itemCost: 12,
      shippingCost: 6,
    });
    expect(res.grossRevenue).toBe(51.0);
    expect(res.totalFees).toBe(2.13);
    expect(res.netProfit).toBe(30.87); // 51 - 2.13 - 18
  });

  it("case 4: high value designer item ($1,500)", () => {
    // Gross: $1,500
    // Payment: 3.3% ($49.50) + $0.45 = $49.95
    const res = calculateDepop({ price: 1500, itemCost: 800 });
    expect(res.totalFees).toBe(49.95);
    expect(res.netProfit).toBe(650.05);
  });

  it("case 5: legacy 10% selling fee option", () => {
    // With isLegacyTenPercentFee = true:
    // 10% of 100 ($10) + (3.3% + $0.45 = $3.75) = $13.75 total fees
    const res = calculateDepop({ price: 100 }, { isLegacyTenPercentFee: true });
    expect(res.totalFees).toBe(13.75);
    expect(res.netProfit).toBe(86.25);
  });

  it("case 6: boosted listing (8% boost rate)", () => {
    // Sale: $80
    // Marketplace: $0
    // Payment: 3.3% of 80 ($2.64) + $0.45 = $3.09
    // Boost: 8% of 80 = $6.40
    // Total fees: $9.49
    const res = calculateDepop(
      { price: 80 },
      { isBoosted: true, boostRatePercent: 8.0 },
    );
    expect(res.totalFees).toBe(9.49);
    expect(res.netProfit).toBe(70.51);
  });

  it("case 7: multi-quantity sale (quantity: 3)", () => {
    const res = calculateDepop({ price: 30, quantity: 3, itemCost: 10 });
    expect(res.grossRevenue).toBe(90);
    expect(res.totalCosts).toBe(30);
    expect(res.totalFees).toBe(3.42); // 3.3% of 90 ($2.97) + $0.45
    expect(res.netProfit).toBe(56.58);
  });

  it("case 8: break-even price calculation", () => {
    const res = calculateDepop({ price: 50, itemCost: 20, shippingCost: 5 });
    const breakEven = res.breakEvenPrice;
    const testBe = calculateDepop({
      price: breakEven,
      itemCost: 20,
      shippingCost: 5,
    });
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05);
  });
});
