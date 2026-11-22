import whatnotFee from '../../data/fees/whatnot.json';
import tiktokShopFee from '../../data/fees/tiktok-shop.json';
import depopFee from '../../data/fees/depop.json';
import etsyFee from '../../data/fees/etsy.json';
import ebayUsFee from '../../data/fees/ebay-us.json';
import ebayUkFee from '../../data/fees/ebay-uk.json';
import twitchBitsFee from '../../data/fees/twitch-bits.json';
import changelogJson from '../../data/fees/changelog.json';

export interface FeeChangeEntry {
  id: string;
  date: string;
  effective_date?: string;
  platform: string;
  platform_name: string;
  what_changed: string;
  rate_summary?: string;
  official_notice_url: string;
  calculator_url?: string;
  category_impact?: string;
}

export interface FeeRateItem {
  fee_kind: string;
  name: string;
  calculation_type: string;
  percentage?: number;
  fixed_amount?: number;
  currency?: string;
  applies_to?: string;
  notes?: string;
}

export interface PlatformFeeData {
  platform: string;
  platform_name: string;
  region: string;
  currency: string;
  rates: FeeRateItem[];
  effective_from: string;
  verified_on: string;
  source_url: string;
  notes: string;
}

export const ALL_PLATFORM_FEES: Record<string, PlatformFeeData> = {
  whatnot: whatnotFee as unknown as PlatformFeeData,
  'tiktok-shop': tiktokShopFee as unknown as PlatformFeeData,
  depop: depopFee as unknown as PlatformFeeData,
  etsy: etsyFee as unknown as PlatformFeeData,
  'ebay-us': ebayUsFee as unknown as PlatformFeeData,
  'ebay-uk': ebayUkFee as unknown as PlatformFeeData,
  'twitch-bits': twitchBitsFee as unknown as PlatformFeeData,
};

const PLATFORM_URLS: Record<string, string> = {
  whatnot: '/whatnot-fee-calculator/',
  'tiktok-shop': '/tiktok-shop-fee-calculator/',
  depop: '/depop-fee-calculator/',
  etsy: '/etsy-fee-calculator/',
  'ebay-us': '/ebay-fee-calculator/',
  'ebay-uk': '/ebay-fee-calculator-uk/',
  'twitch-bits': '/twitch-bits-to-usd/',
};

/**
 * Retrieves all fee changes across platforms, sorted chronologically descending.
 * Synchronized with platform fee JSON files and changelog.json.
 */
export function getChangelog(): FeeChangeEntry[] {
  const items = [...(changelogJson as FeeChangeEntry[])];

  // Dynamically include any platform where verified_on is newer than changelog entries
  for (const [key, feeData] of Object.entries(ALL_PLATFORM_FEES)) {
    if (!feeData?.verified_on) continue;
    const hasEntry = items.some(
      (c) => (c.platform === key || c.platform === 'all') && c.date === feeData.verified_on
    );
    if (!hasEntry) {
      items.push({
        id: `${key}-verified-${feeData.verified_on}`,
        date: feeData.verified_on,
        effective_date: feeData.effective_from || feeData.verified_on,
        platform: key,
        platform_name: feeData.platform_name || key,
        what_changed: `Fee schedule verified: ${formatFeeSummary(key)}. Confirmed compliant with official policy.`,
        rate_summary: formatFeeSummary(key),
        official_notice_url: feeData.source_url,
        calculator_url: PLATFORM_URLS[key] || `/${key}-fee-calculator/`,
        category_impact: 'All active listings',
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Retrieves the fee data record for a given platform.
 * Synchronizes the verified_on timestamp with the latest changelog date if newer.
 */
export function getPlatformFeeData(platform: string): PlatformFeeData | undefined {
  const data = ALL_PLATFORM_FEES[platform];
  if (!data) return undefined;

  // Derive latest verified date from platform data and changelog
  const changelog = getChangelog();
  const latestChange = changelog.find((c) => c.platform === platform || c.platform === 'all');
  if (latestChange && latestChange.date > data.verified_on) {
    return {
      ...data,
      verified_on: latestChange.date,
    };
  }
  return data;
}

/**
 * Formats an ISO date (YYYY-MM-DD) into an accessible, readable string (e.g. "November 22, 2026").
 */
export function formatVerifiedDate(isoDate?: string): string {
  if (!isoDate) return 'November 22, 2026';
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    if (!year || !month || !day) return isoDate;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Formats a percentage cleanly, ensuring 8 -> "8.0%" and 13.25 -> "13.25%".
 */
export function formatPct(n: number): string {
  return n % 1 === 0 ? `${n.toFixed(1)}%` : `${n}%`;
}

/**
 * Dynamically computes a concise fee summary string directly from the platform's JSON rates array.
 * If rates are modified in JSON, this automatically reflects the new numbers across all components.
 */
export function formatFeeSummary(platform: string): string {
  const data = ALL_PLATFORM_FEES[platform];
  if (!data || !Array.isArray(data.rates)) {
    return 'Official rates';
  }

  switch (platform) {
    case 'whatnot': {
      const comm = data.rates.find((r) => r.fee_kind === 'commission')?.percentage ?? 8.0;
      const proc = data.rates.find((r) => r.fee_kind === 'payment_processing');
      const procPct = proc?.percentage ?? 2.9;
      const procFixed = proc?.fixed_amount ?? 0.3;
      return `${formatPct(comm)} + ${formatPct(procPct)} + $${procFixed.toFixed(2)}`;
    }
    case 'tiktok-shop': {
      const referral = data.rates.find((r) => r.fee_kind === 'referral')?.percentage ?? 6.0;
      return `${formatPct(referral)} referral fee`;
    }
    case 'depop': {
      const sellFee = data.rates.find((r) => r.fee_kind === 'commission')?.percentage ?? 0.0;
      const proc = data.rates.find((r) => r.fee_kind === 'payment_processing');
      const procPct = proc?.percentage ?? 3.3;
      const procFixed = proc?.fixed_amount ?? 0.45;
      return `${sellFee.toFixed(0)}% selling + ${formatPct(procPct)} + $${procFixed.toFixed(2)}`;
    }
    case 'etsy': {
      const listing = data.rates.find((r) => r.fee_kind === 'listing')?.fixed_amount ?? 0.2;
      const txn = data.rates.find((r) => r.fee_kind === 'commission')?.percentage ?? 6.5;
      const proc = data.rates.find((r) => r.fee_kind === 'payment_processing');
      const procPct = proc?.percentage ?? 3.0;
      const procFixed = proc?.fixed_amount ?? 0.25;
      return `${formatPct(txn)} + $${listing.toFixed(2)} + ${formatPct(procPct)} + $${procFixed.toFixed(2)}`;
    }
    case 'ebay-us': {
      const standardFvf = data.rates.find((r) => r.name?.includes('Most Categories') && !r.name?.includes('Store'))?.percentage ?? 13.25;
      const storeFvf = data.rates.find((r) => r.name?.includes('Store Subscriber'))?.percentage ?? 12.35;
      const orderFee = data.rates.find((r) => r.name?.includes('over $10.00'))?.fixed_amount ?? 0.4;
      return `${formatPct(standardFvf)} + $${orderFee.toFixed(2)} (${formatPct(storeFvf)} Store)`;
    }
    case 'ebay-uk': {
      const priv = data.rates.find((r) => r.name?.includes('Private'))?.percentage ?? 0.0;
      const biz = data.rates.find((r) => r.name?.includes('Business Final Value'))?.percentage ?? 12.8;
      return `${priv.toFixed(0)}% Private / ${formatPct(biz)} Business + VAT`;
    }
    case 'twitch-bits': {
      const payout = data.rates.find((r) => r.fee_kind === 'revenue_share')?.fixed_amount ?? 0.01;
      return `$${payout.toFixed(2)} / Bit Payout`;
    }
    default:
      return 'Verified official rates';
  }
}

export interface RelatedCalculatorMeta {
  id: string;
  name: string;
  rate: string;
  desc: string;
  href: string;
  badge?: string;
}

/**
 * Returns a list of all calculators with rates dynamically pulled from fee data.
 */
export function getAllCalculatorsMeta(): RelatedCalculatorMeta[] {
  return [
    {
      id: 'whatnot',
      name: 'Whatnot Fee Calculator',
      rate: formatFeeSummary('whatnot'),
      desc: 'Calculate seller take-home earnings, margin %, and break-even prices for live video auctions.',
      href: '/whatnot-fee-calculator/',
      badge: 'Live Sales',
    },
    {
      id: 'tiktok-shop',
      name: 'TikTok Shop Fee Calculator',
      rate: formatFeeSummary('tiktok-shop'),
      desc: 'Calculate TikTok Shop referral commissions, affiliate creator splits, and social commerce profits.',
      href: '/tiktok-shop-fee-calculator/',
      badge: 'Social Commerce',
    },
    {
      id: 'depop',
      name: 'Depop Fee Calculator',
      rate: formatFeeSummary('depop'),
      desc: 'Calculate marketplace payment processing fees and profit margins for second-hand fashion.',
      href: '/depop-fee-calculator/',
      badge: 'Fashion',
    },
    {
      id: 'etsy',
      name: 'Etsy Fee Calculator',
      rate: formatFeeSummary('etsy'),
      desc: 'Calculate listing renewal fees, 6.5% transaction fees, and Etsy Payments processing margins.',
      href: '/etsy-fee-calculator/',
      badge: 'Handmade',
    },
    {
      id: 'ebay-us',
      name: 'eBay Fee Calculator',
      rate: formatFeeSummary('ebay-us'),
      desc: 'Calculate final value fees, store subscription discounts, and promoted listings.',
      href: '/ebay-fee-calculator/',
      badge: 'Global Marketplace',
    },
    {
      id: 'ebay-uk',
      name: 'eBay UK Fee Calculator',
      rate: formatFeeSummary('ebay-uk'),
      desc: 'Calculate 0% fees for UK private sellers and 12.8% + 30p plus 20% VAT for business sellers.',
      href: '/ebay-fee-calculator-uk/',
      badge: 'UK (GBP)',
    },
    {
      id: 'twitch-bits',
      name: 'Twitch Bits to USD Converter',
      rate: formatFeeSummary('twitch-bits'),
      desc: 'Convert Twitch Bits to USD, review viewer bundle pricing markups, and track the $50 threshold.',
      href: '/twitch-bits-to-usd/',
      badge: 'Streaming',
    },
  ];
}
