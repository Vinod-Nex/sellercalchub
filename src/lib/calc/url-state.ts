import type { PlatformId } from './dispatcher';
import type { ReverseTargetType } from './reverse';

export interface CalculatorUrlState {
  platform?: PlatformId;
  mode?: 'forward' | 'reverse';
  price?: number;
  quantity?: number;
  shippingCharged?: number;
  shippingCost?: number;
  itemCost?: number;
  reverseTargetType?: ReverseTargetType;
  targetProfit?: number;
  targetMargin?: number;
  reverseQuantity?: number;
  options?: Record<string, unknown>;
}

const VALID_PLATFORMS: Set<string> = new Set([
  'whatnot',
  'tiktok-shop',
  'depop',
  'etsy',
  'ebay-us',
  'ebay-uk',
  'twitch-bits',
]);

/**
 * Safely parse a positive numeric string into a number.
 * Returns undefined if NaN, empty, or negative.
 */
function parsePositiveNumber(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value.trim() === '') return undefined;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return undefined;
  return num;
}

/**
 * Safely parse an integer >= 1.
 */
function parsePositiveInt(value: string | null | undefined): number | undefined {
  const num = parsePositiveNumber(value);
  if (num === undefined) return undefined;
  const intVal = Math.round(num);
  return intVal >= 1 ? intVal : undefined;
}

/**
 * Parse a boolean query parameter value ('1', 'true', 'yes', 'on').
 */
function parseBoolean(value: string | null | undefined): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  const lower = value.toLowerCase().trim();
  if (lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on') return true;
  if (lower === '0' || lower === 'false' || lower === 'no' || lower === 'off') return false;
  return undefined;
}

/**
 * Parse URL query parameters into a structured CalculatorUrlState.
 * Accepts URLSearchParams, query string (with or without '?'), or full URL string.
 */
export function parseUrlState(query: string | URLSearchParams): CalculatorUrlState {
  let params: URLSearchParams;

  if (typeof query === 'string') {
    const searchPart = query.includes('?') ? query.split('?')[1] : query;
    params = new URLSearchParams(searchPart);
  } else {
    params = query;
  }

  const state: CalculatorUrlState = {};

  // 1. Platform
  const rawPlatform = params.get('platform') || params.get('plat') || params.get('p_form');
  if (rawPlatform && VALID_PLATFORMS.has(rawPlatform)) {
    state.platform = rawPlatform as PlatformId;
  }

  // 2. Mode (forward vs reverse)
  const rawMode = params.get('mode') || params.get('m');
  if (rawMode === 'reverse' || rawMode === 'rev') {
    state.mode = 'reverse';
  } else if (rawMode === 'forward' || rawMode === 'fwd') {
    state.mode = 'forward';
  }

  // 3. Forward Mode inputs
  const price = parsePositiveNumber(params.get('price') || params.get('p'));
  if (price !== undefined) state.price = price;

  const quantity = parsePositiveInt(params.get('quantity') || params.get('qty') || params.get('q'));
  if (quantity !== undefined) state.quantity = quantity;

  // 4. Reverse Mode inputs
  const rawTargetType = params.get('target_type') || params.get('targetType') || params.get('tt');
  if (rawTargetType === 'margin' || rawTargetType === 'pct' || rawTargetType === 'percent') {
    state.reverseTargetType = 'margin';
  } else if (rawTargetType === 'profit' || rawTargetType === 'net') {
    state.reverseTargetType = 'profit';
  }

  const targetProfit = parsePositiveNumber(
    params.get('target_profit') || params.get('targetProfit') || params.get('profit') || params.get('tp')
  );
  if (targetProfit !== undefined) {
    state.targetProfit = targetProfit;
    if (!state.reverseTargetType) state.reverseTargetType = 'profit';
  }

  const targetMargin = parsePositiveNumber(
    params.get('target_margin') || params.get('targetMargin') || params.get('margin') || params.get('tm')
  );
  if (targetMargin !== undefined) {
    state.targetMargin = targetMargin;
    if (!state.reverseTargetType && targetProfit === undefined) state.reverseTargetType = 'margin';
  }

  const reverseQuantity = parsePositiveInt(
    params.get('reverse_qty') || params.get('reverse_quantity') || params.get('reverseQuantity') || params.get('rq')
  );
  if (reverseQuantity !== undefined) state.reverseQuantity = reverseQuantity;

  // 5. Shared Cost Inputs
  const shippingCharged = parsePositiveNumber(
    params.get('shipping_charged') || params.get('shippingCharged') || params.get('ship_in') || params.get('sc')
  );
  if (shippingCharged !== undefined) state.shippingCharged = shippingCharged;

  const itemCost = parsePositiveNumber(
    params.get('item_cost') || params.get('itemCost') || params.get('cost') || params.get('cogs')
  );
  if (itemCost !== undefined) state.itemCost = itemCost;

  const shippingCost = parsePositiveNumber(
    params.get('shipping_cost') || params.get('shippingCost') || params.get('ship_out') || params.get('postage')
  );
  if (shippingCost !== undefined) state.shippingCost = shippingCost;

  // 6. Platform-Specific Options
  const options: Record<string, unknown> = {};
  let hasOptions = false;

  // eBay US
  const ebayCat = params.get('category') || params.get('cat');
  if (ebayCat) {
    options.category = ebayCat;
    hasOptions = true;
  }

  const topRated = parseBoolean(params.get('top_rated') || params.get('isTopRatedSeller'));
  if (topRated !== undefined) {
    options.isTopRatedSeller = topRated;
    hasOptions = true;
  }

  const store = parseBoolean(params.get('store') || params.get('hasStoreSubscription'));
  if (store !== undefined) {
    options.hasStoreSubscription = store;
    hasOptions = true;
  }

  const promoted = parsePositiveNumber(params.get('promoted') || params.get('promotedListingPercent'));
  if (promoted !== undefined) {
    options.promotedListingPercent = promoted;
    hasOptions = true;
  }

  // eBay UK
  const sellerType = params.get('seller_type') || params.get('sellerType');
  if (sellerType === 'business' || sellerType === 'private') {
    options.sellerType = sellerType;
    hasOptions = true;
  }
  const vat = parseBoolean(params.get('vat') || params.get('includeVatOnFees'));
  if (vat !== undefined) {
    options.includeVatOnFees = vat;
    hasOptions = true;
  }

  // TikTok Shop
  const referral = parsePositiveNumber(params.get('referral') || params.get('referralFeePercent'));
  if (referral !== undefined) {
    options.referralFeePercent = referral;
    hasOptions = true;
  }

  const affiliate = parsePositiveNumber(params.get('affiliate') || params.get('affiliateCommissionPercent'));
  if (affiliate !== undefined) {
    options.affiliateCommissionPercent = affiliate;
    hasOptions = true;
  }

  // Etsy
  const offsiteAds = parseBoolean(params.get('offsite_ads') || params.get('hasOffsiteAds'));
  if (offsiteAds !== undefined) {
    options.hasOffsiteAds = offsiteAds;
    hasOptions = true;
  }
  const adsTier = params.get('ads_tier') || params.get('offsiteAdsTier');
  if (adsTier === 'high_volume' || adsTier === 'standard') {
    options.offsiteAdsTier = adsTier;
    hasOptions = true;
  }

  if (hasOptions) {
    state.options = options;
  }

  return state;
}

/**
 * Serialize a CalculatorUrlState into a clean URL query string.
 * Omits zero, default, or empty values for clean and compact URLs.
 * Returns empty string '' if no non-default parameters exist.
 */
export function buildUrlQuery(state: CalculatorUrlState): string {
  const params = new URLSearchParams();

  if (state.platform) {
    params.set('platform', state.platform);
  }

  if (state.mode === 'reverse') {
    params.set('mode', 'reverse');
    const targetType = state.reverseTargetType ?? 'profit';
    if (targetType === 'margin') {
      params.set('target_type', 'margin');
      if (typeof state.targetMargin === 'number' && !isNaN(state.targetMargin)) {
        params.set('target_margin', Number(state.targetMargin.toFixed(1)).toString());
      }
    } else {
      params.set('target_type', 'profit');
      if (typeof state.targetProfit === 'number' && !isNaN(state.targetProfit)) {
        params.set('target_profit', Number(state.targetProfit.toFixed(2)).toString());
      }
    }

    if (typeof state.reverseQuantity === 'number' && state.reverseQuantity > 1) {
      params.set('reverse_qty', state.reverseQuantity.toString());
    }
  } else {
    // Forward mode
    if (typeof state.price === 'number' && !isNaN(state.price)) {
      params.set('price', Number(state.price.toFixed(2)).toString());
    }
    if (typeof state.quantity === 'number' && state.quantity > 1) {
      params.set('qty', state.quantity.toString());
    }
  }

  if (typeof state.shippingCharged === 'number' && state.shippingCharged > 0) {
    params.set('ship_in', Number(state.shippingCharged.toFixed(2)).toString());
  }

  if (typeof state.itemCost === 'number' && state.itemCost > 0) {
    params.set('cost', Number(state.itemCost.toFixed(2)).toString());
  }

  if (typeof state.shippingCost === 'number' && state.shippingCost > 0) {
    params.set('ship_out', Number(state.shippingCost.toFixed(2)).toString());
  }

  // Platform options
  const opts = state.options ?? {};
  if (state.platform === 'ebay-us') {
    if (opts.category && opts.category !== 'most_categories') {
      params.set('category', String(opts.category));
    }
    if (opts.isTopRatedSeller) params.set('top_rated', '1');
    if (opts.hasStoreSubscription) params.set('store', '1');
    if (typeof opts.promotedListingPercent === 'number' && opts.promotedListingPercent > 0) {
      params.set('promoted', opts.promotedListingPercent.toString());
    }
  } else if (state.platform === 'ebay-uk') {
    if (opts.sellerType && opts.sellerType !== 'private') {
      params.set('seller_type', String(opts.sellerType));
      if (opts.includeVatOnFees === false) {
        params.set('vat', '0');
      }
    }
    if (typeof opts.promotedListingPercent === 'number' && opts.promotedListingPercent > 0) {
      params.set('promoted', opts.promotedListingPercent.toString());
    }
  } else if (state.platform === 'tiktok-shop') {
    if (typeof opts.referralFeePercent === 'number' && opts.referralFeePercent !== 6.0) {
      params.set('referral', opts.referralFeePercent.toString());
    }
    if (typeof opts.affiliateCommissionPercent === 'number' && opts.affiliateCommissionPercent > 0) {
      params.set('affiliate', opts.affiliateCommissionPercent.toString());
    }
  } else if (state.platform === 'etsy') {
    if (opts.hasOffsiteAds) {
      params.set('offsite_ads', '1');
      if (opts.offsiteAdsTier === 'high_volume') {
        params.set('ads_tier', 'high_volume');
      }
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Build a full shareable URL given state and an optional base URL.
 */
export function buildShareableUrl(state: CalculatorUrlState, baseUrl?: string): string {
  const query = buildUrlQuery(state);
  const base =
    baseUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://sellercalchub.com/');
  return `${base}${query}`;
}
