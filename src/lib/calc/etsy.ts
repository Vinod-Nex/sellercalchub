import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface EtsyCalcOptions {
  listingFeePerUnit?: number; // default $0.20
  transactionFeePercent?: number; // default 6.5%
  paymentProcessingPercent?: number; // default 3.0% (US)
  paymentProcessingFixed?: number; // default $0.25 (US)
  hasOffsiteAds?: boolean; // default false
  offsiteAdsPercent?: number; // default 15% if hasOffsiteAds, or 12%
  offsiteAdsTier?: 'standard' | 'high_volume'; // standard = 15%, high_volume = 12%
  regulatoryFeePercent?: number; // default 0.0%
  skipBreakEven?: boolean;
}

export function calculateEtsy(
  input: BaseCalcInput,
  options: EtsyCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const listingFeeDollars = options.listingFeePerUnit ?? 0.2;
  const transactionPercent = options.transactionFeePercent ?? 6.5;
  const paymentPercent = options.paymentProcessingPercent ?? 3.0;
  const paymentFixedDollars = options.paymentProcessingFixed ?? 0.25;
  const regulatoryPercent = options.regulatoryFeePercent ?? 0.0;

  // Determine Offsite Ads rate: explicit percent, or tier-based if hasOffsiteAds is true
  let offsiteAdsRate = 0.0;
  if (typeof options.offsiteAdsPercent === 'number') {
    offsiteAdsRate = options.offsiteAdsPercent;
  } else if (options.hasOffsiteAds) {
    offsiteAdsRate = options.offsiteAdsTier === 'high_volume' ? 12.0 : 15.0;
  }

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

  // 1. Etsy Listing Fee ($0.20 per item unit)
  const listingFeeCents = toCents(listingFeeDollars) * qty;
  totalFeesCents += listingFeeCents;
  fees.push({
    id: "listing_fee",
    name: `Listing Fee ($${listingFeeDollars.toFixed(2)} × ${qty})`,
    amount: toDollars(listingFeeCents),
    fixedPart: listingFeeDollars,
    description: `$${listingFeeDollars.toFixed(2)} per listing or renewed quantity`,
  });

  // 2. Transaction Fee (6.5% of item price + shipping charged)
  const transactionFeeCents = percentOfCents(
    grossRevenueCents,
    transactionPercent,
  );
  totalFeesCents += transactionFeeCents;
  fees.push({
    id: "transaction_fee",
    name: `Transaction Fee (${transactionPercent}%)`,
    amount: toDollars(transactionFeeCents),
    ratePercent: transactionPercent,
    description: `${transactionPercent}% of sale price + shipping charged`,
  });

  // 3. Payment Processing Fee (3% + $0.25 in US)
  const paymentPercentCents = percentOfCents(grossRevenueCents, paymentPercent);
  const paymentFixedCents =
    grossRevenueCents > 0 ? toCents(paymentFixedDollars) : 0;
  const paymentTotalCents = paymentPercentCents + paymentFixedCents;
  totalFeesCents += paymentTotalCents;
  fees.push({
    id: "payment_processing",
    name: `Payment Processing (${paymentPercent}% + $${paymentFixedDollars.toFixed(2)})`,
    amount: toDollars(paymentTotalCents),
    ratePercent: paymentPercent,
    fixedPart: paymentFixedDollars,
    description: `${paymentPercent}% of transaction + $${paymentFixedDollars.toFixed(2)}`,
  });

  // 4. Offsite Ads Fee (optional 15% standard or 12% high volume, capped at $100 per order)
  if (offsiteAdsRate > 0) {
    const rawOffsiteAdsCents = percentOfCents(
      grossRevenueCents,
      offsiteAdsRate,
    );
    // Official Etsy rule: Offsite Ads fee never exceeds $100 USD per single attributed order
    const maxCapCents = toCents(100.0);
    const isCapped = rawOffsiteAdsCents > maxCapCents;
    const offsiteAdsCents = Math.min(maxCapCents, rawOffsiteAdsCents);
    totalFeesCents += offsiteAdsCents;
    fees.push({
      id: "offsite_ads",
      name: `Offsite Ads Fee (${offsiteAdsRate}%${isCapped ? " - $100 Cap" : ""})`,
      amount: toDollars(offsiteAdsCents),
      ratePercent: offsiteAdsRate,
      description: `${offsiteAdsRate}% fee on attributed orders from Etsy Offsite Ads${isCapped ? " (capped at $100 max per order)" : ""}`,
    });
  }

  // 5. Regulatory Operating Fee (if applicable)
  if (regulatoryPercent > 0) {
    const regCents = percentOfCents(grossRevenueCents, regulatoryPercent);
    totalFeesCents += regCents;
    fees.push({
      id: "regulatory_fee",
      name: `Regulatory Operating Fee (${regulatoryPercent}%)`,
      amount: toDollars(regCents),
      ratePercent: regulatoryPercent,
      description: "Country-specific digital services regulatory charge",
    });
  }

  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateEtsy(
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
