import { describe, it, expect } from "vitest";
import { calculateTwitchBits } from "../twitch-bits";

describe("Twitch Bits Calculator", () => {
  it("case 1: zero bits (0 bits)", () => {
    const res = calculateTwitchBits({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
  });

  it("case 2: very low cheer (1 single Bit = $0.01 payout)", () => {
    const res = calculateTwitchBits({ price: 1 });
    expect(res.grossRevenue).toBe(0.01);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0.01);
  });

  it("case 3: common cheer package (100 Bits = $1.00 payout)", () => {
    const res = calculateTwitchBits({ price: 100 });
    expect(res.grossRevenue).toBe(1.0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(1.0);
    expect(res.profitMargin).toBe(100);
  });

  it("case 4: raid cheer (5,000 Bits = $50.00 payout)", () => {
    const res = calculateTwitchBits({ price: 5000 });
    expect(res.grossRevenue).toBe(50.0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(50.0);
  });

  it("case 5: mega high cheer (1,000,000 Bits = $10,000 payout)", () => {
    const res = calculateTwitchBits({ price: 1000000 });
    expect(res.grossRevenue).toBe(10000.0);
    expect(res.netProfit).toBe(10000.0);
  });

  it("case 6: payout with PayPal cashout fee ($0.75 deduction)", () => {
    const res = calculateTwitchBits({ price: 5000 }, { payoutFee: 0.75 });
    expect(res.grossRevenue).toBe(50.0);
    expect(res.totalFees).toBe(0.75);
    expect(res.netProfit).toBe(49.25);
  });

  it("case 7: streamer with overhead costs (e.g. emote designer cost $20)", () => {
    const res = calculateTwitchBits({ price: 5000, itemCost: 20 });
    expect(res.grossRevenue).toBe(50.0);
    expect(res.totalCosts).toBe(20.0);
    expect(res.netProfit).toBe(30.0);
    expect(res.roi).toBe(150.0);
  });

  it("case 8: break-even bits calculation with fixed overhead", () => {
    // If costs are $25, streamer needs 2500 bits to break even (2500 * $0.01 = $25)
    const res = calculateTwitchBits({ price: 1000, itemCost: 25 });
    expect(res.breakEvenPrice).toBe(2500); // 2500 bits needed
    const testBe = calculateTwitchBits({
      price: res.breakEvenPrice,
      itemCost: 25,
    });
    expect(testBe.netProfit).toBe(0);
  });
});
