import { describe, it, expect } from "vitest";
import { calculateWhatnot } from "../whatnot";

describe("Whatnot Fee Calculator", () => {
  it("case 1: zero price ($0 sale)", () => {
    const res = calculateWhatnot({
      price: 0,
      shippingCharged: 0,
      itemCost: 0,
      shippingCost: 0,
    });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
    expect(res.profitMargin).toBe(0);
  });

  it("case 2: very low price ($0.99 item)", () => {
    // Subtotal $0.99: 8% commission ($0.08) + 2.9% ($0.03) + $0.30 fixed = $0.41 total fees
    const res = calculateWhatnot({
      price: 0.99,
      shippingCharged: 0,
      itemCost: 0.2,
      shippingCost: 0,
    });
    expect(res.grossRevenue).toBe(0.99);
    expect(res.totalFees).toBe(0.41);
    expect(res.netProfit).toBe(0.38);
    expect(res.profitMargin).toBeGreaterThan(0);
  });

  it("case 3: typical sale ($50 item with $5 shipping charged)", () => {
    // Gross: $55.00
    // Commission: 8% of 55 = $4.40
    // Payment: 2.9% of 55 ($1.60) + $0.30 = $1.90
    // Total fees: $6.30
    // Costs: $15 item + $5 shipping = $20
    // Net profit: 55 - 6.30 - 20 = $28.70
    const res = calculateWhatnot({
      price: 50,
      shippingCharged: 5,
      itemCost: 15,
      shippingCost: 5,
    });
    expect(res.grossRevenue).toBe(55);
    expect(res.totalFees).toBe(6.3);
    expect(res.netProfit).toBe(28.7);
    expect(res.profitMargin).toBe(52.18);
    expect(res.roi).toBe(143.5);
  });

  it("case 4: high value luxury sale ($5,000 item)", () => {
    const res = calculateWhatnot({
      price: 5000,
      shippingCharged: 25,
      itemCost: 3000,
      shippingCost: 25,
    });
    expect(res.grossRevenue).toBe(5025);
    expect(res.totalFees).toBe(548.03); // 8% ($402.00) + 2.9% + 0.30 ($146.03)
    expect(res.netProfit).toBe(1451.97);
    expect(res.netProfit).toBeGreaterThan(0);
  });

  it("case 5: multi-quantity batch (quantity: 5)", () => {
    const res = calculateWhatnot({
      price: 20,
      quantity: 5,
      shippingCharged: 10,
      itemCost: 5,
      shippingCost: 8,
    });
    expect(res.itemRevenue).toBe(100);
    expect(res.grossRevenue).toBe(110);
    expect(res.totalCosts).toBe(33); // (5 * 5) + 8
    expect(res.totalFees).toBe(12.29); // 8% ($8.80) + 2.9% ($3.19) + 0.30
    expect(res.netProfit).toBe(64.71);
  });

  it("case 6: free shipping absorbed by seller", () => {
    const res = calculateWhatnot({
      price: 30,
      shippingCharged: 0,
      itemCost: 8,
      shippingCost: 6,
    });
    expect(res.grossRevenue).toBe(30);
    expect(res.shippingCharged).toBe(0);
    expect(res.totalFees).toBe(3.57); // 8% ($2.40) + 2.9% + 0.30 ($1.17)
    expect(res.netProfit).toBe(12.43); // 30 - 3.57 - 14
  });

  it("case 7: loss sale where costs exceed revenue", () => {
    const res = calculateWhatnot({
      price: 10,
      shippingCharged: 0,
      itemCost: 15,
      shippingCost: 4,
    });
    expect(res.netProfit).toBeLessThan(0);
    expect(res.profitMargin).toBeLessThan(0);
    expect(res.roi).toBeLessThan(0);
  });

  it("case 8: exact break-even price verification", () => {
    const res = calculateWhatnot({
      price: 25,
      shippingCharged: 4,
      itemCost: 10,
      shippingCost: 4,
    });
    const breakEven = res.breakEvenPrice;
    const testBe = calculateWhatnot({
      price: breakEven,
      shippingCharged: 4,
      itemCost: 10,
      shippingCost: 4,
    });
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05); // within cents of zero
  });
});
