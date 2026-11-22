import { describe, it, expect } from "vitest";
import { calculateTikTokShop } from "../tiktok-shop";

describe("TikTok Shop Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateTikTokShop({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
  });

  it("case 2: very low price ($1.00 item)", () => {
    // 6% of $1.00 = $0.06 fee
    const res = calculateTikTokShop({ price: 1.0, itemCost: 0.3 });
    expect(res.grossRevenue).toBe(1.0);
    expect(res.totalFees).toBe(0.06);
    expect(res.netProfit).toBe(0.64);
  });

  it("case 3: standard $35 item with $4 shipping charged", () => {
    // Gross: $39.00
    // 6% of 39 = $2.34
    // Costs: $10 item + $4 shipping = $14
    // Net: 39 - 2.34 - 14 = $22.66
    const res = calculateTikTokShop({
      price: 35,
      shippingCharged: 4,
      itemCost: 10,
      shippingCost: 4,
    });
    expect(res.grossRevenue).toBe(39);
    expect(res.totalFees).toBe(2.34);
    expect(res.netProfit).toBe(22.66);
    expect(res.profitMargin).toBe(58.1);
  });

  it("case 4: high value apparel item ($2,500)", () => {
    const res = calculateTikTokShop({ price: 2500, itemCost: 1200 });
    expect(res.grossRevenue).toBe(2500);
    expect(res.totalFees).toBe(150.0); // 6% of 2500
    expect(res.netProfit).toBe(1150.0);
  });

  it("case 5: custom referral rate (e.g. 5% electronics category)", () => {
    const res = calculateTikTokShop(
      { price: 200, itemCost: 120 },
      { referralFeePercent: 5.0 },
    );
    expect(res.totalFees).toBe(10.0);
    expect(res.netProfit).toBe(70.0);
  });

  it("case 6: order with custom fixed handling fee", () => {
    const res = calculateTikTokShop({ price: 50 }, { fixedFee: 0.5 });
    expect(res.totalFees).toBe(3.5); // 6% of 50 ($3.00) + $0.50
    expect(res.netProfit).toBe(46.5);
  });

  it("case 7: multi-quantity sale (quantity: 4)", () => {
    const res = calculateTikTokShop({ price: 15, quantity: 4, itemCost: 5 });
    expect(res.itemRevenue).toBe(60);
    expect(res.totalFees).toBe(3.6); // 6% of 60
    expect(res.totalCosts).toBe(20);
    expect(res.netProfit).toBe(36.4);
  });

  it("case 8: break-even price calculation", () => {
    const res = calculateTikTokShop({
      price: 40,
      itemCost: 15,
      shippingCost: 5,
    });
    const breakEven = res.breakEvenPrice;
    const testBe = calculateTikTokShop({
      price: breakEven,
      itemCost: 15,
      shippingCost: 5,
    });
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05);
  });
});
