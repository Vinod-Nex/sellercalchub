import type { BaseCalcInput, CalcResult, FeeItem } from "./types";
import { toCents, toDollars, calculateMargin, calculateRoi } from "./money";

export interface TwitchBitsCalcOptions {
  payoutFee?: number; // optional payment / cashout fee (e.g. $0.00 ACH, $0.75 PayPal, $25 wire)
  bitsPerCheer?: number; // optional cheer package size
}

/**
 * Twitch Bits Calculation:
 * Eligible Streamers and Affiliates receive $0.01 USD (1 cent) per Bit cheered.
 * The buyer pays Twitch a markup when purchasing Bits, but the streamer keeps $0.01 per bit flat.
 */
export function calculateTwitchBits(
  input: BaseCalcInput,
  options: TwitchBitsCalcOptions = {},
): CalcResult {
  const {
    price: bitsAmount, // Bits amount passed as price
    itemCost = 0, // Streaming overhead or emote design costs
    quantity = 1,
  } = input;

  const payoutFeeDollars = options.payoutFee ?? 0.0;
  const qty = Math.max(1, Math.floor(quantity));
  const totalBits = Math.max(0, Math.floor(bitsAmount * qty));

  // Each bit = $0.01 USD (1 cent)
  const grossRevenueCents = totalBits; // 1 cent per bit

  const itemCostCents = toCents(itemCost);
  const totalCostsCents = itemCostCents;

  const fees: FeeItem[] = [];
  let totalFeesCents = 0;

  // Streamer revenue share: 100% of $0.01/bit payout (Twitch takes its cut upfront from viewers)
  fees.push({
    id: "twitch_payout_rate",
    name: "Twitch Payout Share ($0.01 / Bit)",
    amount: 0,
    ratePercent: 0,
    description:
      "Creators receive flat $0.01 USD per Bit cheered (Twitch collects markup from viewer)",
  });

  // Payout / Cashout fee (if applicable)
  if (payoutFeeDollars > 0 && grossRevenueCents > 0) {
    const payoutCents = toCents(payoutFeeDollars);
    totalFeesCents += payoutCents;
    fees.push({
      id: "payout_processing_fee",
      name: "Payout / Cashout Fee",
      amount: toDollars(payoutCents),
      fixedPart: payoutFeeDollars,
      description: `Payment processing fee for cashing out (${options.payoutFee ? `$${options.payoutFee.toFixed(2)}` : "ACH/wire"})`,
    });
  }

  const netProfitCents = grossRevenueCents - totalFeesCents - totalCostsCents;

  // Break-even in terms of Bits required:
  // Net profit >= 0 => totalBits - totalFeesCents - totalCostsCents >= 0
  const breakEvenBits = Math.max(
    0,
    Math.ceil((totalCostsCents + totalFeesCents) / qty),
  );

  return {
    grossRevenue: toDollars(grossRevenueCents),
    itemRevenue: toDollars(grossRevenueCents),
    shippingCharged: 0,
    itemCostTotal: toDollars(itemCostCents),
    shippingCostTotal: 0,
    totalCosts: toDollars(totalCostsCents),
    fees,
    totalFees: toDollars(totalFeesCents),
    netProfit: toDollars(netProfitCents),
    profitMargin: calculateMargin(
      toDollars(netProfitCents),
      toDollars(grossRevenueCents),
    ),
    roi: calculateRoi(toDollars(netProfitCents), toDollars(totalCostsCents)),
    breakEvenPrice: breakEvenBits, // Break-even in Bits count per unit
    currency: "USD",
  };
}
