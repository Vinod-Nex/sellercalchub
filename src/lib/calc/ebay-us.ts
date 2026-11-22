import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface EbayUsCalcOptions {
  finalValueFeePercent?: number; // default 13.25%
  isTopRatedSeller?: boolean; // 10% discount on final value fee
  hasStoreSubscription?: boolean; // e.g. 12.35% store rate if true
  promotedListingPercent?: number; // optional ad rate (e.g. 2.0%)
  insertionFee?: number; // default $0.00
  skipBreakEven?: boolean;
}

export function calculateEbayUs(
  input: BaseCalcInput,
  options: EbayUsCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const defaultFvf = options.hasStoreSubscription ? 12.35 : 13.25;
  const fvfPercent = options.finalValueFeePercent ?? defaultFvf;
  const isTopRated = options.isTopRatedSeller ?? false;
  const promotedPercent = options.promotedListingPercent ?? 0.0;
  const insertionFeeDollars = options.insertionFee ?? 0.0;

  const itemPriceCents = toCents(price);
  const qty = Math.max(1, Math.floor(quantity));
  const itemRevenueCents = itemPriceCents * qty;
  const shippingChargedCents = toCents(shippingCharged);
  const grossRevenueCents = itemRevenueCents + shippingChargedCents;

  const itemCostCents = toCents(itemCost) * qty;
  const shippingCostCents = toCents(shippingCost);
  const totalCostsCents = itemCostCents + shippingCostCents;

  const fees: FeeItem[] = [];
  let totalFeesCents = 0;

  // 1. Insertion Fee
  if (insertionFeeDollars > 0) {
    const insertionCents = toCents(insertionFeeDollars);
    totalFeesCents += insertionCents;
    fees.push({
      id: "insertion_fee",
      name: "Listing / Insertion Fee",
      amount: toDollars(insertionCents),
      fixedPart: insertionFeeDollars,
      description: "Fee per listing beyond free allocation",
    });
  }

  // 2. Final Value Fee (FVF)
  let rawFvfCents = percentOfCents(grossRevenueCents, fvfPercent);
  if (isTopRated && rawFvfCents > 0) {
    // 10% discount on final value fee portion
    const discountCents = percentOfCents(rawFvfCents, 10.0);
    rawFvfCents = Math.max(0, rawFvfCents - discountCents);
    fees.push({
      id: "final_value_fee",
      name: `Final Value Fee (${fvfPercent}% with 10% Top Rated Discount)`,
      amount: toDollars(rawFvfCents),
      ratePercent: Number((fvfPercent * 0.9).toFixed(2)),
      description: `${fvfPercent}% with Top Rated Seller Plus discount applied`,
    });
  } else {
    fees.push({
      id: "final_value_fee",
      name: `Final Value Fee (${fvfPercent}%)`,
      amount: toDollars(rawFvfCents),
      ratePercent: fvfPercent,
      description: `${fvfPercent}% of total buyer payment`,
    });
  }
  totalFeesCents += rawFvfCents;

  // 3. Per-order fee ($0.30 if gross > $10, $0.40 if gross <= $10)
  if (grossRevenueCents > 0) {
    const isUnderTen = grossRevenueCents <= 1000;
    const perOrderFeeDollars = isUnderTen ? 0.4 : 0.3;
    const perOrderFeeCents = toCents(perOrderFeeDollars);
    totalFeesCents += perOrderFeeCents;
    fees.push({
      id: "per_order_fee",
      name: `Per-Order Fee ($${perOrderFeeDollars.toFixed(2)})`,
      amount: toDollars(perOrderFeeCents),
      fixedPart: perOrderFeeDollars,
      description: isUnderTen
        ? "$0.40 for orders $10.00 or under"
        : "$0.30 for orders over $10.00",
    });
  }

  // 4. Promoted Listings Standard
  if (promotedPercent > 0) {
    const promoCents = percentOfCents(grossRevenueCents, promotedPercent);
    totalFeesCents += promoCents;
    fees.push({
      id: "promoted_listings",
      name: `Promoted Listings (${promotedPercent}%)`,
      amount: toDollars(promoCents),
      ratePercent: promotedPercent,
      description: `${promotedPercent}% ad rate on total sale`,
    });
  }

  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateEbayUs(
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
    grossRevenue: toDollars(grossRevenueCents),
    itemRevenue: toDollars(itemRevenueCents),
    shippingCharged: toDollars(shippingChargedCents),
    itemCostTotal: toDollars(itemCostCents),
    shippingCostTotal: toDollars(shippingCostCents),
    totalCosts: toDollars(totalCostsCents),
    fees,
    totalFees: toDollars(totalFeesCents),
    netProfit: toDollars(netProfitCents),
    profitMargin: calculateMargin(
      toDollars(netProfitCents),
      toDollars(grossRevenueCents),
    ),
    roi: calculateRoi(toDollars(netProfitCents), toDollars(totalCostsCents)),
    breakEvenPrice,
    currency: "USD",
  };
}
