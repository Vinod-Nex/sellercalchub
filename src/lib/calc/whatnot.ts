import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface WhatnotCalcOptions {
  commissionPercent?: number; // default 8.0%
  paymentProcessingPercent?: number; // default 2.9%
  paymentProcessingFixed?: number; // default $0.30
  skipBreakEven?: boolean;
}

export function calculateWhatnot(
  input: BaseCalcInput,
  options: WhatnotCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const commissionPercent = options.commissionPercent ?? 8.0;
  const paymentPercent = options.paymentProcessingPercent ?? 2.9;
  const paymentFixedDollars = options.paymentProcessingFixed ?? 0.3;

  const itemPriceCents = toCents(price);
  const qty = Math.max(1, Math.floor(quantity));
  const itemRevenueCents = itemPriceCents * qty;
  const shippingChargedCents = toCents(shippingCharged);
  const grossRevenueCents = itemRevenueCents + shippingChargedCents;

  const itemCostCents = toCents(itemCost) * qty;
  const shippingCostCents = toCents(shippingCost);
  const totalCostsCents = itemCostCents + shippingCostCents;

  // Whatnot Commission (8% of gross subtotal)
  const commissionCents = percentOfCents(grossRevenueCents, commissionPercent);

  // Whatnot Payment Processing (2.9% + $0.30 per order)
  const paymentPercentCents = percentOfCents(grossRevenueCents, paymentPercent);
  const paymentFixedCents =
    grossRevenueCents > 0 ? toCents(paymentFixedDollars) : 0;
  const paymentProcessingCents = paymentPercentCents + paymentFixedCents;

  const totalFeesCents = commissionCents + paymentProcessingCents;
  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  const fees: FeeItem[] = [
    {
      id: "commission",
      name: `Whatnot Commission (${commissionPercent}%)`,
      amount: toDollars(commissionCents),
      ratePercent: commissionPercent,
      description: `${commissionPercent}% of buyer subtotal (items + shipping charged)`,
    },
    {
      id: "payment_processing",
      name: `Payment Processing (${paymentPercent}% + $${paymentFixedDollars.toFixed(2)})`,
      amount: toDollars(paymentProcessingCents),
      ratePercent: paymentPercent,
      fixedPart: paymentFixedDollars,
      description: `${paymentPercent}% of transaction + $${paymentFixedDollars.toFixed(2)} fixed fee`,
    },
  ];

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateWhatnot(
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
