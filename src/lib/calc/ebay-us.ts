import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface EbayCategoryRate {
  id: string;
  name: string;
  rateStandard: number;
  rateStore: number;
  threshold?: number;
  rateAboveThreshold?: number;
}

export const EBAY_US_CATEGORIES: EbayCategoryRate[] = [
  {
    id: "most_categories",
    name: "Most Categories (Clothing, Home, Toys)",
    rateStandard: 13.25,
    rateStore: 12.35,
    threshold: 7500,
    rateAboveThreshold: 2.35,
  },
  {
    id: "books_movies_music",
    name: "Books, Movies & Music",
    rateStandard: 15.3,
    rateStore: 14.95,
    threshold: 7500,
    rateAboveThreshold: 2.35,
  },
  {
    id: "consumer_electronics",
    name: "Computers & Consumer Electronics",
    rateStandard: 13.25,
    rateStore: 9.35,
    threshold: 2500,
    rateAboveThreshold: 2.35,
  },
  {
    id: "musical_instruments",
    name: "Guitars & Musical Instruments",
    rateStandard: 6.7,
    rateStore: 6.35,
    threshold: 7500,
    rateAboveThreshold: 2.35,
  },
  {
    id: "jewelry_watches",
    name: "Jewelry & Watches",
    rateStandard: 15.0,
    rateStore: 13.0,
    threshold: 5000,
    rateAboveThreshold: 9.0,
  },
  {
    id: "athletic_shoes_150",
    name: "Athletic Shoes / Sneakers ($150+)",
    rateStandard: 8.0,
    rateStore: 8.0,
  },
  {
    id: "heavy_equipment",
    name: "Heavy Equipment & Commercial",
    rateStandard: 3.0,
    rateStore: 2.5,
    threshold: 15000,
    rateAboveThreshold: 0.5,
  },
];

export interface EbayUsCalcOptions {
  category?: string;
  finalValueFeePercent?: number; // manual override if specified
  isTopRatedSeller?: boolean; // 10% discount on final value fee
  hasStoreSubscription?: boolean; // store rate if true
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

  const selectedCat =
    EBAY_US_CATEGORIES.find((c) => c.id === options.category) ||
    EBAY_US_CATEGORIES[0];
  const defaultFvf = options.hasStoreSubscription
    ? selectedCat.rateStore
    : selectedCat.rateStandard;
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
  let rawFvfCents = 0;
  if (
    selectedCat.threshold &&
    selectedCat.rateAboveThreshold !== undefined &&
    grossRevenueCents > selectedCat.threshold * 100 &&
    options.finalValueFeePercent === undefined
  ) {
    const tier1ThresholdCents = selectedCat.threshold * 100;
    const tier1Cents = percentOfCents(tier1ThresholdCents, fvfPercent);
    const excessCents = grossRevenueCents - tier1ThresholdCents;
    const tier2Cents = percentOfCents(
      excessCents,
      selectedCat.rateAboveThreshold,
    );
    rawFvfCents = tier1Cents + tier2Cents;
  } else {
    rawFvfCents = percentOfCents(grossRevenueCents, fvfPercent);
  }

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

  // 3. Per-order fee ($0.30 if gross <= $10, $0.40 if gross > $10)
  // Exception: Athletic shoes $150+ has per-order fee waived
  const isSneakerWaived =
    options.category === "athletic_shoes_150" && grossRevenueCents >= 15000;
  if (grossRevenueCents > 0 && !isSneakerWaived) {
    const isUnderTen = grossRevenueCents <= 1000;
    const perOrderFeeDollars = isUnderTen ? 0.3 : 0.4;
    const perOrderFeeCents = toCents(perOrderFeeDollars);
    totalFeesCents += perOrderFeeCents;
    fees.push({
      id: "per_order_fee",
      name: `Per-Order Fee ($${perOrderFeeDollars.toFixed(2)})`,
      amount: toDollars(perOrderFeeCents),
      fixedPart: perOrderFeeDollars,
      description: isUnderTen
        ? "$0.30 for orders $10.00 or under"
        : "$0.40 for orders over $10.00",
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
