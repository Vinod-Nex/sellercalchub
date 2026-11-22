import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface EbayUkCalcOptions {
  sellerType?: "private" | "business"; // default 'private' (0% selling fees in UK)
  businessFvfPercent?: number; // default 12.8% for business sellers
  businessPerOrderFee?: number; // default £0.30 for business sellers
  promotedListingPercent?: number; // optional ad rate
  includeVatOnFees?: boolean; // whether 20% UK VAT is applied on top of eBay business fees (default: true for business sellers)
  skipBreakEven?: boolean;
}

export function calculateEbayUk(
  input: BaseCalcInput,
  options: EbayUkCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const sellerType = options.sellerType ?? "private";
  const isBusiness = sellerType === "business";
  const businessFvfPercent = options.businessFvfPercent ?? 12.8;
  const businessPerOrderFeePounds = options.businessPerOrderFee ?? 0.3;
  const promotedPercent = options.promotedListingPercent ?? 0.0;
  const includeVat = options.includeVatOnFees ?? true;

  const itemPricePence = toCents(price);
  const qty = Math.max(1, Math.floor(quantity));
  const itemRevenuePence = itemPricePence * qty;
  const shippingChargedPence = toCents(shippingCharged);
  const grossRevenuePence = itemRevenuePence + shippingChargedPence;

  const itemCostPence = toCents(itemCost) * qty;
  const shippingCostPence = toCents(shippingCost);
  const totalCostsPence = itemCostPence + shippingCostPence;

  const fees: FeeItem[] = [];
  let totalFeesPence = 0;

  if (isBusiness) {
    // Business Seller: 12.8% FVF + £0.30 per order (exclusive of VAT)
    const baseFvfPence = percentOfCents(grossRevenuePence, businessFvfPercent);
    fees.push({
      id: "final_value_fee",
      name: `Business Final Value Fee (${businessFvfPercent}%)`,
      amount: toDollars(baseFvfPence),
      ratePercent: businessFvfPercent,
      description: `${businessFvfPercent}% on gross order total`,
    });

    let orderFeePence = 0;
    if (grossRevenuePence > 0) {
      orderFeePence = toCents(businessPerOrderFeePounds);
      fees.push({
        id: "per_order_fee",
        name: `Per-Order Fee (£${businessPerOrderFeePounds.toFixed(2)})`,
        amount: toDollars(orderFeePence),
        fixedPart: businessPerOrderFeePounds,
        description: `Fixed £${businessPerOrderFeePounds.toFixed(2)} order handling charge`,
      });
    }

    let subtotalFeesPence = baseFvfPence + orderFeePence;

    // Optional Promoted Listings
    let promoPence = 0;
    if (promotedPercent > 0) {
      promoPence = percentOfCents(grossRevenuePence, promotedPercent);
      fees.push({
        id: "promoted_listings",
        name: `Promoted Listings (${promotedPercent}%)`,
        amount: toDollars(promoPence),
        ratePercent: promotedPercent,
        description: `${promotedPercent}% ad fee on item sale`,
      });
      subtotalFeesPence += promoPence;
    }

    // VAT handling on fees (20% standard UK VAT applied to all eBay fees billed to UK business sellers)
    if (includeVat && subtotalFeesPence > 0) {
      const vatPence = percentOfCents(subtotalFeesPence, 20.0);
      fees.push({
        id: "vat_on_fees",
        name: "UK VAT on eBay Fees (20%)",
        amount: toDollars(vatPence),
        ratePercent: 20.0,
        description:
          "20% HMRC standard VAT charged on eBay business seller fees",
      });
      totalFeesPence = subtotalFeesPence + vatPence;
    } else {
      totalFeesPence = subtotalFeesPence;
    }
  } else {
    // Private UK Seller: 0% selling fee (Free selling on eBay UK)
    fees.push({
      id: "private_seller_fee",
      name: "eBay UK Private Selling Fee (0%)",
      amount: 0,
      ratePercent: 0,
      description:
        "Free to sell for UK private individuals (0% final value fee)",
    });

    // Promoted Listings (if private seller opts into Promoted Listings)
    if (promotedPercent > 0) {
      const promoPence = percentOfCents(grossRevenuePence, promotedPercent);
      totalFeesPence += promoPence;
      fees.push({
        id: "promoted_listings",
        name: `Promoted Listings (${promotedPercent}%)`,
        amount: toDollars(promoPence),
        ratePercent: promotedPercent,
        description: `${promotedPercent}% ad fee on item sale (inclusive of VAT)`,
      });
    }
  }

  const netProfitPence = grossRevenuePence - totalFeesPence - totalCostsPence;

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateEbayUk(
          {
            price: candidatePrice,
            shippingCharged,
            itemCost,
            shippingCost,
            quantity,
          },
          { ...options, skipBreakEven: true },
        );
        return { netProfit: res.netProfit };
      });

  return {
    grossRevenue: toDollars(grossRevenuePence),
    itemRevenue: toDollars(itemRevenuePence),
    shippingCharged: toDollars(shippingChargedPence),
    itemCostTotal: toDollars(itemCostPence),
    shippingCostTotal: toDollars(shippingCostPence),
    totalCosts: toDollars(totalCostsPence),
    fees,
    totalFees: toDollars(totalFeesPence),
    netProfit: toDollars(netProfitPence),
    profitMargin: calculateMargin(
      toDollars(netProfitPence),
      toDollars(grossRevenuePence),
    ),
    roi: calculateRoi(toDollars(netProfitPence), toDollars(totalCostsPence)),
    breakEvenPrice,
    currency: "GBP",
  };
}
