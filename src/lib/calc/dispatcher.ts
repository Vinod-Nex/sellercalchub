import { calculateWhatnot } from "./whatnot";
import { calculateTikTokShop } from "./tiktok-shop";
import { calculateDepop } from "./depop";
import { calculateEtsy } from "./etsy";
import { calculateEbayUs } from "./ebay-us";
import { calculateEbayUk } from "./ebay-uk";
import { calculateTwitchBits } from "./twitch-bits";
import type { BaseCalcInput, CalcResult } from "./types";

export type PlatformId =
  | "whatnot"
  | "tiktok-shop"
  | "depop"
  | "etsy"
  | "ebay-us"
  | "ebay-uk"
  | "twitch-bits";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  defaultCurrency: "USD" | "GBP";
  currencySymbol: string;
  defaultPrice: number;
  defaultShippingCharged: number;
  defaultItemCost: number;
  defaultShippingCost: number;
  defaultQuantity: number;
  defaultOptions: Record<string, unknown>;
  verifiedOn: string;
  sourceUrl: string;
}

export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
  whatnot: {
    id: "whatnot",
    name: "Whatnot",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 50.0,
    defaultShippingCharged: 0.0,
    defaultItemCost: 15.0,
    defaultShippingCost: 0.0,
    defaultQuantity: 1,
    defaultOptions: {},
    verifiedOn: "2026-11-22",
    sourceUrl:
      "https://help.whatnot.com/hc/en-us/articles/360061525052-Selling-Fees-on-Whatnot",
  },
  "tiktok-shop": {
    id: "tiktok-shop",
    name: "TikTok Shop",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 35.0,
    defaultShippingCharged: 0.0,
    defaultItemCost: 10.0,
    defaultShippingCost: 3.5,
    defaultQuantity: 1,
    defaultOptions: {
      referralFeePercent: 6.0,
      affiliateCommissionPercent: 0.0,
    },
    verifiedOn: "2026-11-22",
    sourceUrl:
      "https://seller-us.tiktok.com/university/essay?knowledge_id=10012248",
  },
  depop: {
    id: "depop",
    name: "Depop",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 40.0,
    defaultShippingCharged: 5.0,
    defaultItemCost: 12.0,
    defaultShippingCost: 5.0,
    defaultQuantity: 1,
    defaultOptions: { region: "US" },
    verifiedOn: "2026-11-22",
    sourceUrl:
      "https://depophelp.zendesk.com/hc/en-gb/articles/360001791127-What-are-the-fees-for-selling-on-Depop",
  },
  etsy: {
    id: "etsy",
    name: "Etsy",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 45.0,
    defaultShippingCharged: 4.5,
    defaultItemCost: 12.0,
    defaultShippingCost: 4.5,
    defaultQuantity: 1,
    defaultOptions: { hasOffsiteAds: false },
    verifiedOn: "2026-11-22",
    sourceUrl: "https://www.etsy.com/legal/fees/",
  },
  "ebay-us": {
    id: "ebay-us",
    name: "eBay US",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 60.0,
    defaultShippingCharged: 6.0,
    defaultItemCost: 20.0,
    defaultShippingCost: 5.5,
    defaultQuantity: 1,
    defaultOptions: {
      isTopRatedSeller: false,
      hasStoreSubscription: false,
      promotedListingPercent: 0.0,
    },
    verifiedOn: "2026-11-22",
    sourceUrl:
      "https://www.ebay.com/help/selling/fees-credits-invoices/selling-fees?id=4822",
  },
  "ebay-uk": {
    id: "ebay-uk",
    name: "eBay UK",
    defaultCurrency: "GBP",
    currencySymbol: "£",
    defaultPrice: 45.0,
    defaultShippingCharged: 4.0,
    defaultItemCost: 15.0,
    defaultShippingCost: 4.0,
    defaultQuantity: 1,
    defaultOptions: { sellerType: "private", promotedListingPercent: 0.0 },
    verifiedOn: "2026-11-22",
    sourceUrl:
      "https://www.ebay.co.uk/help/selling/fees-credits-invoices/selling-fees?id=4822",
  },
  "twitch-bits": {
    id: "twitch-bits",
    name: "Twitch Bits",
    defaultCurrency: "USD",
    currencySymbol: "$",
    defaultPrice: 1000, // 1000 bits
    defaultShippingCharged: 0.0,
    defaultItemCost: 0.0,
    defaultShippingCost: 0.0,
    defaultQuantity: 1,
    defaultOptions: {},
    verifiedOn: "2026-11-22",
    sourceUrl: "https://help.twitch.tv/s/article/guide-to-cheering-with-bits",
  },
};

export function runCalculator(
  platform: PlatformId,
  input: BaseCalcInput,
  options: Record<string, unknown> = {},
): CalcResult {
  switch (platform) {
    case "whatnot":
      return calculateWhatnot(input, options);
    case "tiktok-shop":
      return calculateTikTokShop(input, options);
    case "depop":
      return calculateDepop(input, options);
    case "etsy":
      return calculateEtsy(input, options);
    case "ebay-us":
      return calculateEbayUs(input, options);
    case "ebay-uk":
      return calculateEbayUk(input, options);
    case "twitch-bits":
      return calculateTwitchBits(input, options);
    default:
      return calculateWhatnot(input, options);
  }
}
