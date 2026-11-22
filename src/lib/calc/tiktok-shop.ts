import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import {
  toCents,
  toDollars,
  percentOfCents,
  calculateMargin,
  calculateRoi,
  solveBreakEvenPrice,
} from "./money";

export interface TikTokShopCalcOptions {
  referralFeePercent?: number; // default standard 6.0%
  category?: string;
  fixedFee?: number; // default $0.00
  skipBreakEven?: boolean;
}

export function calculateTikTokShop(
  input: BaseCalcInput,
  options: TikTokShopCalcOptions = {},
): CalcResult {
  const {
    price,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const referralPercent = options.referralFeePercent ?? 6.0;
  const fixedFeeDollars = options.fixedFee ?? 0.0;

  const itemPriceCents = toCents(price);
  const qty = Math.max(1, Math.floor(quantity));
  const itemRevenueCents = itemPriceCents * qty;
  const shippingChargedCents = toCents(shippingCharged);
  const grossRevenueCents = itemRevenueCents + shippingChargedCents;

  const itemCostCents = toCents(itemCost) * qty;
  const shippingCostCents = toCents(shippingCost);
  const totalCostsCents = itemCostCents + shippingCostCents;

  // Referral Fee: percentage of total amount paid by customer
  const referralFeeCents = percentOfCents(grossRevenueCents, referralPercent);
  const fixedFeeCents = grossRevenueCents > 0 ? toCents(fixedFeeDollars) : 0;

  const totalFeesCents = referralFeeCents + fixedFeeCents;
  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  const fees: FeeItem[] = [
    {
      id: "referral_fee",
      name: `TikTok Shop Referral Fee (${referralPercent}%)`,
      amount: toDollars(referralFeeCents),
      ratePercent: referralPercent,
      description: `${referralPercent}% of customer payment`,
    },
  ];

  if (fixedFeeCents > 0) {
    fees.push({
      id: "fixed_fee",
      name: "Fixed Transaction Fee",
      amount: toDollars(fixedFeeCents),
      description: "Per-order transaction fee",
    });
  }

  const breakEvenPrice = options.skipBreakEven
    ? 0
    : solveBreakEvenPrice((candidatePrice) => {
        const res = calculateTikTokShop(
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
