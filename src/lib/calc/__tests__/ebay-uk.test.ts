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

  it("case 5: UK Business Seller with 20% UK VAT on fees (default)", () => {
    // Gross: £100
    // FVF: 12.8% of 100 = £12.80
    // Order fee: £0.30
    // Subtotal fees: £13.10
    // 20% UK VAT on fees: 20% of 13.10 = £2.62
    // Total fees: £15.72
    // Net: 100 - 15.72 = £84.28
    const res = calculateEbayUk({ price: 100 }, { sellerType: "business" });
    expect(res.totalFees).toBe(15.72);
    expect(res.netProfit).toBe(84.28);
    expect(res.fees.some((f) => f.id === "vat_on_fees")).toBe(true);
  });

  it("case 6: UK Business Seller with VAT excluded (includeVatOnFees: false)", () => {
    // Gross: £100
    // Subtotal: £13.10
    const res = calculateEbayUk(
      { price: 100 },
      { sellerType: "business", includeVatOnFees: false },
    );
    expect(res.totalFees).toBe(13.1);
    expect(res.netProfit).toBe(86.9);
  });

  it("case 7: UK Business Seller with Promoted Listing (4%) and VAT", () => {
    // Gross: £100
    // FVF: £12.80, Order fee: £0.30, Promo: £4.00 => Subtotal: £17.10
    // 20% VAT on £17.10 = £3.42
    // Total fees: £20.52
    const res = calculateEbayUk(
      { price: 100 },
      {
        sellerType: "business",
        promotedListingPercent: 4.0,
        includeVatOnFees: true,
      },
    );
    expect(res.totalFees).toBe(20.52);
    expect(res.netProfit).toBe(79.48);
  });

  it("case 8: multi-quantity business sale with VAT (quantity: 3)", () => {
    // Gross: £60
    // FVF: 12.8% of 60 (£7.68) + £0.30 order fee = £7.98
    // 20% VAT on £7.98 = £1.60
    // Total fees: £9.58
    // Costs: 3 * £8 = £24
    // Net: 60 - 9.58 - 24 = £26.42
    const res = calculateEbayUk(
      { price: 20, quantity: 3, itemCost: 8 },
      { sellerType: "business" },
    );
    expect(res.itemRevenue).toBe(60);
    expect(res.totalFees).toBe(9.58);
    expect(res.totalCosts).toBe(24);
    expect(res.netProfit).toBe(26.42);
  });

  it("case 9: break-even price calculation for business seller", () => {
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
