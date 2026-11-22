export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  ratePercent?: number;
  fixedPart?: number;
  description?: string;
}

export interface BaseCalcInput {
  price: number;
  shippingCharged?: number;
  itemCost?: number;
  shippingCost?: number;
  quantity?: number;
}

export interface CalcResult {
  grossRevenue: number;
  itemRevenue: number;
  shippingCharged: number;
  itemCostTotal: number;
  shippingCostTotal: number;
  totalCosts: number;
  fees: FeeItem[];
  totalFees: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  breakEvenPrice: number;
  currency: string;
}
