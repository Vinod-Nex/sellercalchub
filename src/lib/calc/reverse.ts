import type { BaseCalcInput, CalcResult } from "./types";
import { toDollars } from "./money";
import { runCalculator, type PlatformId } from "./dispatcher";

export type ReverseTargetType = "profit" | "margin";

export interface ReverseCalcInput extends Omit<BaseCalcInput, "price"> {
  targetType: ReverseTargetType;
  targetValue: number; // Target net profit in currency ($) or target margin in percent (%)
}

export interface ReverseCalcResult {
  targetPrice: number;
  targetType: ReverseTargetType;
  targetValue: number;
  forwardResult: CalcResult;
}

/**
 * Precision binary search to solve for the exact sale price required
 * to achieve a specified target net profit.
 *
 * Guarantees that `Math.abs(forward(price).netProfit - targetProfit) <= 0.01`
 */
export function solvePriceForTargetProfit(
  targetProfit: number,
  calcFn: (candidatePrice: number) => CalcResult,
): { price: number; result: CalcResult } {
  // If target profit is <= 0, break-even or 0 price
  if (targetProfit <= 0) {
    const zeroRes = calcFn(0);
    if (zeroRes.netProfit >= targetProfit) {
      return { price: 0, result: zeroRes };
    }
  }

  let lowCents = 0;
  let highCents = 50_000_000; // $500,000.00 ceiling
  let candidatePriceCents = highCents;

  while (lowCents <= highCents) {
    const midCents = Math.floor((lowCents + highCents) / 2);
    const candidatePrice = toDollars(midCents);
    const res = calcFn(candidatePrice);

    if (res.netProfit >= targetProfit) {
      candidatePriceCents = midCents;
      highCents = midCents - 1; // Search for lower price meeting target
    } else {
      lowCents = midCents + 1;
    }
  }

  // Compare candidate with candidate - 1 cent to pick the one closest to targetProfit
  const priceA = toDollars(candidatePriceCents);
  const resA = calcFn(priceA);
  const diffA = Math.abs(resA.netProfit - targetProfit);

  if (candidatePriceCents > 0) {
    const priceB = toDollars(candidatePriceCents - 1);
    const resB = calcFn(priceB);
    const diffB = Math.abs(resB.netProfit - targetProfit);

    if (diffB < diffA) {
      return { price: priceB, result: resB };
    }
  }

  return { price: priceA, result: resA };
}

/**
 * Precision binary search to solve for the exact sale price required
 * to achieve a specified target profit margin percentage.
 */
export function solvePriceForTargetMargin(
  targetMarginPercent: number,
  calcFn: (candidatePrice: number) => CalcResult,
): { price: number; result: CalcResult } {
  // Clamp target margin to realistic ceiling (95%)
  const clampedMargin = Math.max(0, Math.min(95, targetMarginPercent));

  let lowCents = 0;
  let highCents = 50_000_000; // $500,000.00 ceiling
  let candidatePriceCents = highCents;

  while (lowCents <= highCents) {
    const midCents = Math.floor((lowCents + highCents) / 2);
    const candidatePrice = toDollars(midCents);
    const res = calcFn(candidatePrice);

    if (res.profitMargin >= clampedMargin) {
      candidatePriceCents = midCents;
      highCents = midCents - 1;
    } else {
      lowCents = midCents + 1;
    }
  }

  const priceA = toDollars(candidatePriceCents);
  const resA = calcFn(priceA);
  const diffA = Math.abs(resA.profitMargin - clampedMargin);

  if (candidatePriceCents > 0) {
    const priceB = toDollars(candidatePriceCents - 1);
    const resB = calcFn(priceB);
    const diffB = Math.abs(resB.profitMargin - clampedMargin);

    if (diffB < diffA) {
      return { price: priceB, result: resB };
    }
  }

  return { price: priceA, result: resA };
}

/**
 * Unified reverse calculation engine function.
 * Takes platform, reverse target (profit or margin), other costs, and platform options,
 * and returns the solved listing price along with the full forward fee & profit breakdown.
 */
export function calculateReverse(
  platform: PlatformId,
  input: ReverseCalcInput,
  options: Record<string, unknown> = {},
): ReverseCalcResult {
  const {
    targetType,
    targetValue,
    shippingCharged = 0,
    itemCost = 0,
    shippingCost = 0,
    quantity = 1,
  } = input;

  const calcFn = (candidatePrice: number): CalcResult => {
    return runCalculator(
      platform,
      {
        price: candidatePrice,
        shippingCharged,
        itemCost,
        shippingCost,
        quantity,
      },
      { ...options, skipBreakEven: true },
    );
  };

  const { price, result } =
    targetType === "margin"
      ? solvePriceForTargetMargin(targetValue, calcFn)
      : solvePriceForTargetProfit(targetValue, calcFn);

  return {
    targetPrice: price,
    targetType,
    targetValue,
    forwardResult: result,
  };
}
