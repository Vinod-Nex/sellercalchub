/**
 * Financial rounding utility operating internally in integer cents.
 * Prevents IEEE-754 floating-point inaccuracies (e.g., 0.1 + 0.2 !== 0.3).
 */

export function toCents(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

export function toDollars(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

export function percentOfCents(cents: number, percent: number): number {
  if (cents <= 0 || percent <= 0) return 0;
  return Math.round((cents * percent) / 100);
}

export function calculateMargin(
  netProfitDollars: number,
  grossRevenueDollars: number,
): number {
  if (grossRevenueDollars <= 0) return 0;
  const margin = (netProfitDollars / grossRevenueDollars) * 100;
  return Number(margin.toFixed(2));
}

export function calculateRoi(
  netProfitDollars: number,
  totalCostsDollars: number,
): number {
  if (totalCostsDollars <= 0) return 0;
  const roi = (netProfitDollars / totalCostsDollars) * 100;
  return Number(roi.toFixed(2));
}

/**
 * Numerically finds the break-even price per unit where netProfit >= 0
 * using a high-precision binary search on integer cents.
 */
export function solveBreakEvenPrice(
  calcFn: (candidatePrice: number) => { netProfit: number },
  maxPrice: number = 100000,
): number {
  let lowCents = 0;
  let highCents = toCents(maxPrice);
  let bestCents = highCents;

  // Binary search over integer cents
  while (lowCents <= highCents) {
    const midCents = Math.floor((lowCents + highCents) / 2);
    const candidatePrice = toDollars(midCents);
    const { netProfit } = calcFn(candidatePrice);

    if (netProfit >= 0) {
      bestCents = midCents;
      highCents = midCents - 1; // Try to find a lower price that still breaks even
    } else {
      lowCents = midCents + 1;
    }
  }

  return toDollars(bestCents);
}
