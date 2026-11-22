/**
 * Supported UI Locales for Seller Calc Hub
 */
export const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * UI Dictionary Schema for all user-facing strings
 */
export interface UiDictionary {
  // Navigation & Header
  nav: {
    home: string;
    allCalculators: string;
    feeChanges: string;
    methodology: string;
    about: string;
    contact: string;
    searchPlaceholder: string;
    toggleTheme: string;
  };

  // Calculator Common Controls
  calculator: {
    soldPrice: string;
    soldPriceHelp: string;
    itemCost: string;
    itemCostHelp: string;
    shippingCharged: string;
    shippingChargedHelp: string;
    actualShippingCost: string;
    actualShippingCostHelp: string;
    stateSalesTax: string;
    stateSalesTaxHelp: string;
    category: string;
    selectCategory: string;
    storeTier: string;
    noStore: string;
    topRatedPlus: string;
    topRatedPlusHelp: string;
    promotedAdRate: string;
    promotedAdRateHelp: string;
    calculateButton: string;
    resetButton: string;
    reverseModeToggle: string;
    reverseModeHelp: string;
    targetProfit: string;
    targetProfitHelp: string;
  };

  // Calculator Output & Results
  results: {
    netProfit: string;
    profitMargin: string;
    totalFees: string;
    effectiveFeeRate: string;
    takeHomePay: string;
    roi: string;
    breakEvenPrice: string;
    platformFeeDeduction: string;
    paymentProcessingFee: string;
    fixedOrderFee: string;
    adFeeDeduction: string;
    estimatedPostage: string;
    payoutSchedule: string;
    copyResults: string;
    copied: string;
  };

  // Trust & Verification
  trust: {
    verifiedBadge: string;
    verifiedOn: string;
    officialSource: string;
    noAdsGuaranteed: string;
    freeCalculator: string;
    reportFeeChange: string;
    viewChangelog: string;
  };

  // Embed Widget
  embed: {
    title: string;
    description: string;
    copyCode: string;
    copiedToClipboard: string;
    attributionText: string;
    zeroAdsGuarantee: string;
  };

  // Footer & Legal
  footer: {
    tagline: string;
    disclaimer: string;
    privacy: string;
    terms: string;
    allRightsReserved: string;
  };
}
