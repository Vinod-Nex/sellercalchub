import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface DepopCalcOptions {
  isLegacyTenPercentFee?: boolean; // default false
  isBoosted?: boolean; // default false
  boostRatePercent?: number; // default 8.0%
  paymentProcessingPercent?: number; // default 3.3% (US)
  paymentProcessingFixed?: number; // default $0.45 (US)
  skipBreakEven?: boolean;
}

export function calculateDepop(
  input: BaseCalcInput,
  options: DepopCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const isLegacy = options.isLegacyTenPercentFee ?? false;
  const isBoosted = options.isBoosted ?? false;
  const boostPercent = options.boostRatePercent ?? 8.0;
  const paymentPercent = options.paymentProcessingPercent ?? 3.3;
  const paymentFixedDollars = options.paymentProcessingFixed ?? 0.45;

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

  // Depop Marketplace Fee (0% current, 10% legacy)
  const marketplaceFeeRate = isLegacy ? 10.0 : 0.0;
  const marketplaceFeeCents = isLegacy
    ? percentOfCents(grossRevenueCents, 10.0)
    : 0;
  totalFeesCents += marketplaceFeeCents;

  fees.push({
    id: "marketplace_fee",
    name: `Depop Marketplace Fee (${marketplaceFeeRate}%)`,
    amount: toDollars(marketplaceFeeCents),
    ratePercent: marketplaceFeeRate,
    description: isLegacy
      ? "10% selling fee on legacy listings"
      : "0% selling fee (buyers pay marketplace fee on new listings)",
  });

  // Depop Payments Processing (3.3% + $0.45 in US)
  const paymentPercentCents = percentOfCents(grossRevenueCents, paymentPercent);
  const paymentFixedCents =
    grossRevenueCents > 0 ? toCents(paymentFixedDollars) : 0;
  const paymentTotalCents = paymentPercentCents + paymentFixedCents;
  totalFeesCents += paymentTotalCents;

  fees.push({
    id: "payment_processing",
    name: `Depop Payments Fee (${paymentPercent}% + $${paymentFixedDollars.toFixed(2)})`,
    amount: toDollars(paymentTotalCents),
    ratePercent: paymentPercent,
    fixedPart: paymentFixedDollars,
    description: `${paymentPercent}% of transaction + $${paymentFixedDollars.toFixed(2)}`,
  });

  // Boosted Listing Fee (optional 8%)
  if (isBoosted) {
    const boostCents = percentOfCents(itemRevenueCents, boostPercent);
    totalFeesCents += boostCents;
    fees.push({
      id: "boost_fee",
      name: `Depop Boost Fee (${boostPercent}%)`,
      amount: toDollars(boostCents),
      ratePercent: boostPercent,
      description: `${boostPercent}% of item sale price for boosted visibility`,
    });
  }

  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateDepop(
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
