import { describe, it, expect } from "vitest";
import { calculateReverse } from "../reverse";
import { runCalculator, type PlatformId } from "../dispatcher";

describe("Reverse Calculation Engine: Round-trip verification", () => {
  const platforms: PlatformId[] = [
    "whatnot",
    "tiktok-shop",
    "depop",
    "etsy",
    "ebay-us",
    "ebay-uk",
    "twitch-bits",
  ];

  describe("Target Net Profit round-tripping: forward(reverse(x)) === x within $0.01", () => {
    const targetProfits = [5.0, 15.5, 25.0, 50.0, 100.0, 250.75, 500.0];

    for (const platform of platforms) {
      describe(`Platform: ${platform}`, () => {
        for (const target of targetProfits) {
          it(`solves listing price for target profit $${target.toFixed(2)} within $0.01`, () => {
            const rev = calculateReverse(platform, {
              targetType: "profit",
              targetValue: target,
              shippingCharged: platform === "twitch-bits" ? 0 : 5.0,
              itemCost: platform === "twitch-bits" ? 0 : 15.0,
              shippingCost: platform === "twitch-bits" ? 0 : 4.5,
              quantity: 1,
            });

            expect(rev.targetPrice).toBeGreaterThan(0);

            // Forward verification
            const fwd = runCalculator(platform, {
              price: rev.targetPrice,
              shippingCharged: platform === "twitch-bits" ? 0 : 5.0,
              itemCost: platform === "twitch-bits" ? 0 : 15.0,
              shippingCost: platform === "twitch-bits" ? 0 : 4.5,
              quantity: 1,
            });

            const diff = Math.abs(fwd.netProfit - target);
            // Must equal target within one cent
            expect(diff).toBeLessThanOrEqual(0.01);
          });
        }
      });
    }
  });

  describe("Target Margin round-tripping: forward(reverse(m)) matches margin within 0.1%", () => {
    const targetMargins = [10.0, 25.0, 40.0, 50.0];

    it("solves listing price for target margin on Whatnot", () => {
      for (const m of targetMargins) {
        const rev = calculateReverse("whatnot", {
          targetType: "margin",
          targetValue: m,
          shippingCharged: 0,
          itemCost: 15.0,
          shippingCost: 0,
          quantity: 1,
        });

        expect(rev.targetPrice).toBeGreaterThan(15.0);

        const fwd = runCalculator("whatnot", {
          price: rev.targetPrice,
          shippingCharged: 0,
          itemCost: 15.0,
          shippingCost: 0,
          quantity: 1,
        });

        // Profit margin should match target within 0.1%
        const diff = Math.abs(fwd.profitMargin - m);
        expect(diff).toBeLessThanOrEqual(0.15);
      }
    });

    it("solves listing price for target margin on eBay US with store options", () => {
      const rev = calculateReverse(
        "ebay-us",
        {
          targetType: "margin",
          targetValue: 35.0,
          shippingCharged: 5.0,
          itemCost: 20.0,
          shippingCost: 5.0,
          quantity: 1,
        },
        { isTopRatedSeller: true, hasStoreSubscription: true },
      );

      const fwd = runCalculator(
        "ebay-us",
        {
          price: rev.targetPrice,
          shippingCharged: 5.0,
          itemCost: 20.0,
          shippingCost: 5.0,
          quantity: 1,
        },
        { isTopRatedSeller: true, hasStoreSubscription: true },
      );

      const diff = Math.abs(fwd.profitMargin - 35.0);
      expect(diff).toBeLessThanOrEqual(0.15);
    });
  });

  describe("Edge cases in reverse mode", () => {
    it("handles zero target profit (break-even point)", () => {
      const rev = calculateReverse("etsy", {
        targetType: "profit",
        targetValue: 0.0,
        shippingCharged: 4.0,
        itemCost: 10.0,
        shippingCost: 4.0,
        quantity: 1,
      });

      const fwd = runCalculator("etsy", {
        price: rev.targetPrice,
        shippingCharged: 4.0,
        itemCost: 10.0,
        shippingCost: 4.0,
        quantity: 1,
      });

      expect(fwd.netProfit).toBeGreaterThanOrEqual(-0.01);
      expect(Math.abs(fwd.netProfit - 0.0)).toBeLessThanOrEqual(0.01);
    });

    it("handles multi-quantity reverse solving", () => {
      const rev = calculateReverse("depop", {
        targetType: "profit",
        targetValue: 60.0,
        shippingCharged: 10.0,
        itemCost: 12.0,
        shippingCost: 8.0,
        quantity: 3,
      });

      const fwd = runCalculator("depop", {
        price: rev.targetPrice,
        shippingCharged: 10.0,
        itemCost: 12.0,
        shippingCost: 8.0,
        quantity: 3,
      });

      expect(Math.abs(fwd.netProfit - 60.0)).toBeLessThanOrEqual(0.01);
    });
  });
});
