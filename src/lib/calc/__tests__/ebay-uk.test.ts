import { describe, it, expect } from "vitest";
import { calculateEbayUk } from "../ebay-uk";

describe("eBay UK Fee Calculator", () => {
  it("case 1: zero price (£0 sale)", () => {
    const res = calculateEbayUk({ price: 0 });
    expect(res.grossRevenue).toBe(0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0);
    expect(res.currency).toBe("GBP");
  });

  it("case 2: very low price private seller (£1.00 item)", () => {
    // UK Private seller: 0% fee
    const res = calculateEbayUk({ price: 1.0, itemCost: 0.2 });
    expect(res.grossRevenue).toBe(1.0);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(0.8);
  });

  it("case 3: typical private seller (£50 clothing item with £4 shipping)", () => {
    // Gross: £54.00, Private seller fees: £0
    const res = calculateEbayUk({
      price: 50,
      shippingCharged: 4,
      itemCost: 15,
      shippingCost: 4,
    });
    expect(res.grossRevenue).toBe(54);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(35); // 54 - 0 - 19
    expect(res.profitMargin).toBe(64.81);
  });

  it("case 4: high value private seller sale (£5,000 watch)", () => {
    const res = calculateEbayUk({ price: 5000, itemCost: 3500 });
    expect(res.grossRevenue).toBe(5000);
    expect(res.totalFees).toBe(0);
    expect(res.netProfit).toBe(1500);
  });

  it("case 5: UK Business Seller (12.8% FVF + £0.30 per order)", () => {
    // Gross: £100
    // FVF: 12.8% of 100 = £12.80
    // Order fee: £0.30
    // Total fees: £13.10
    const res = calculateEbayUk({ price: 100 }, { sellerType: "business" });
    expect(res.totalFees).toBe(13.1);
    expect(res.netProfit).toBe(86.9);
  });

  it("case 6: UK Business Seller with Promoted Listing (4%)", () => {
    // Gross: £100
    // Fees: 13.10 + (4% of 100 = £4.00) = £17.10
    const res = calculateEbayUk(
      { price: 100 },
      { sellerType: "business", promotedListingPercent: 4.0 },
    );
    expect(res.totalFees).toBe(17.1);
    expect(res.netProfit).toBe(82.9);
  });

  it("case 7: multi-quantity business sale (quantity: 3)", () => {
    const res = calculateEbayUk(
      { price: 20, quantity: 3, itemCost: 8 },
      { sellerType: "business" },
    );
    expect(res.itemRevenue).toBe(60);
    expect(res.totalFees).toBe(7.98); // 12.8% of 60 (£7.68) + £0.30
    expect(res.totalCosts).toBe(24);
    expect(res.netProfit).toBe(28.02);
  });

  it("case 8: break-even price calculation for business seller", () => {
    const res = calculateEbayUk(
      { price: 50, itemCost: 20, shippingCost: 5 },
      { sellerType: "business" },
    );
    const breakEven = res.breakEvenPrice;
    const testBe = calculateEbayUk(
      { price: breakEven, itemCost: 20, shippingCost: 5 },
      { sellerType: "business" },
    );
    expect(testBe.netProfit).toBeGreaterThanOrEqual(0);
    expect(testBe.netProfit).toBeLessThanOrEqual(0.05);
  });
});
