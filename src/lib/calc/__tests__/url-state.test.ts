import { describe, it, expect } from 'vitest';
import {
  parseUrlState,
  buildUrlQuery,
  buildShareableUrl,
  type CalculatorUrlState,
} from '../url-state';
import { runCalculator, PLATFORM_CONFIGS, type PlatformId } from '../dispatcher';
import { calculateReverse } from '../reverse';

describe('URL State Serialization & Parsing', () => {
  it('parses empty query string into empty state', () => {
    expect(parseUrlState('')).toEqual({});
    expect(parseUrlState('?')).toEqual({});
  });

  it('parses standard forward inputs correctly', () => {
    const qs = '?platform=etsy&price=45.50&qty=2&cost=12.00&ship_in=4.50&ship_out=3.75';
    const state = parseUrlState(qs);

    expect(state.platform).toBe('etsy');
    expect(state.price).toBe(45.5);
    expect(state.quantity).toBe(2);
    expect(state.itemCost).toBe(12.0);
    expect(state.shippingCharged).toBe(4.5);
    expect(state.shippingCost).toBe(3.75);
  });

  it('supports friendly aliases for quick sharing and query typing', () => {
    const qs = '?plat=ebay-us&p=120&q=3&cogs=30&sc=10&postage=8';
    const state = parseUrlState(qs);

    expect(state.platform).toBe('ebay-us');
    expect(state.price).toBe(120);
    expect(state.quantity).toBe(3);
    expect(state.itemCost).toBe(30);
    expect(state.shippingCharged).toBe(10);
    expect(state.shippingCost).toBe(8);
  });

  it('parses reverse mode with target profit', () => {
    const qs = '?mode=reverse&target_type=profit&target_profit=50&reverse_qty=2&cost=15';
    const state = parseUrlState(qs);

    expect(state.mode).toBe('reverse');
    expect(state.reverseTargetType).toBe('profit');
    expect(state.targetProfit).toBe(50);
    expect(state.reverseQuantity).toBe(2);
    expect(state.itemCost).toBe(15);
  });

  it('parses reverse mode with target margin', () => {
    const qs = '?m=rev&target_margin=35.5&cost=10';
    const state = parseUrlState(qs);

    expect(state.mode).toBe('reverse');
    expect(state.reverseTargetType).toBe('margin');
    expect(state.targetMargin).toBe(35.5);
    expect(state.itemCost).toBe(10);
  });

  it('parses platform-specific options', () => {
    // eBay US
    const usState = parseUrlState('?platform=ebay-us&category=books_movies_music&top_rated=1&store=1&promoted=2.5');
    expect(usState.options?.category).toBe('books_movies_music');
    expect(usState.options?.isTopRatedSeller).toBe(true);
    expect(usState.options?.hasStoreSubscription).toBe(true);
    expect(usState.options?.promotedListingPercent).toBe(2.5);

    // eBay UK
    const ukState = parseUrlState('?platform=ebay-uk&seller_type=business&promoted=3');
    expect(ukState.options?.sellerType).toBe('business');
    expect(ukState.options?.promotedListingPercent).toBe(3);

    // TikTok Shop
    const ttState = parseUrlState('?platform=tiktok-shop&referral=8&affiliate=5');
    expect(ttState.options?.referralFeePercent).toBe(8);
    expect(ttState.options?.affiliateCommissionPercent).toBe(5);

    // Etsy
    const etsyState = parseUrlState('?platform=etsy&offsite_ads=1');
    expect(etsyState.options?.hasOffsiteAds).toBe(true);
  });

  it('safely ignores invalid inputs and negative numbers', () => {
    const qs = '?price=-50&qty=0&platform=invalid-marketplace&cost=not-a-number';
    const state = parseUrlState(qs);

    expect(state.price).toBeUndefined();
    expect(state.quantity).toBeUndefined();
    expect(state.platform).toBeUndefined();
    expect(state.itemCost).toBeUndefined();
  });

  it('serializes state into clean URL query string', () => {
    const state: CalculatorUrlState = {
      platform: 'depop',
      price: 65.0,
      quantity: 2,
      shippingCharged: 5.0,
      itemCost: 15.0,
      shippingCost: 5.0,
    };

    const query = buildUrlQuery(state);
    expect(query).toBe('?platform=depop&price=65&qty=2&ship_in=5&cost=15&ship_out=5');
  });

  it('builds full shareable URL', () => {
    const state: CalculatorUrlState = {
      platform: 'whatnot',
      price: 100,
    };
    const url = buildShareableUrl(state, 'https://sellercalchub.com/');
    expect(url).toBe('https://sellercalchub.com/?platform=whatnot&price=100');
  });

  it('round-trips state cleanly: parse(build(state)) matches state', () => {
    const original: CalculatorUrlState = {
      platform: 'ebay-us',
      price: 99.99,
      quantity: 2,
      shippingCharged: 8.5,
      itemCost: 25.0,
      shippingCost: 7.25,
      options: {
        isTopRatedSeller: true,
        hasStoreSubscription: true,
        promotedListingPercent: 3.5,
      },
    };

    const qs = buildUrlQuery(original);
    const parsed = parseUrlState(qs);

    expect(parsed.platform).toBe(original.platform);
    expect(parsed.price).toBe(original.price);
    expect(parsed.quantity).toBe(original.quantity);
    expect(parsed.shippingCharged).toBe(original.shippingCharged);
    expect(parsed.itemCost).toBe(original.itemCost);
    expect(parsed.shippingCost).toBe(original.shippingCost);
    expect(parsed.options?.isTopRatedSeller).toBe(true);
    expect(parsed.options?.hasStoreSubscription).toBe(true);
    expect(parsed.options?.promotedListingPercent).toBe(3.5);
  });
});

describe('Shared URL Number Reproduction (Forward & Reverse)', () => {
  const platforms: PlatformId[] = [
    'whatnot',
    'tiktok-shop',
    'depop',
    'etsy',
    'ebay-us',
    'ebay-uk',
    'twitch-bits',
  ];

  platforms.forEach((platform) => {
    it(`reproduces the exact same forward calculation numbers on ${platform}`, () => {
      const config = PLATFORM_CONFIGS[platform];
      const initialPrice = platform === 'twitch-bits' ? 5000 : 75.5;
      const initialCost = platform === 'twitch-bits' ? 0 : 18.25;
      const initialShipIn = platform === 'twitch-bits' ? 0 : 6.0;
      const initialShipOut = platform === 'twitch-bits' ? 0 : 5.5;
      const initialQty = 2;

      // 1. Direct calculation
      const directResult = runCalculator(
        platform,
        {
          price: initialPrice,
          shippingCharged: initialShipIn,
          shippingCost: initialShipOut,
          itemCost: initialCost,
          quantity: initialQty,
        },
        config.defaultOptions
      );

      // 2. State serialized to URL query
      const state: CalculatorUrlState = {
        platform,
        price: initialPrice,
        quantity: initialQty,
        shippingCharged: initialShipIn,
        shippingCost: initialShipOut,
        itemCost: initialCost,
      };
      const query = buildUrlQuery(state);

      // 3. Simulated recipient parsing the URL
      const restoredState = parseUrlState(query);

      // 4. Recipient calculation from restored state
      const restoredResult = runCalculator(
        restoredState.platform as PlatformId,
        {
          price: restoredState.price ?? config.defaultPrice,
          shippingCharged: restoredState.shippingCharged ?? config.defaultShippingCharged,
          shippingCost: restoredState.shippingCost ?? config.defaultShippingCost,
          itemCost: restoredState.itemCost ?? config.defaultItemCost,
          quantity: restoredState.quantity ?? config.defaultQuantity,
        },
        config.defaultOptions
      );

      // Verify every single output number matches exactly to the penny
      expect(restoredResult.grossRevenue).toBe(directResult.grossRevenue);
      expect(restoredResult.totalFees).toBe(directResult.totalFees);
      expect(restoredResult.totalCosts).toBe(directResult.totalCosts);
      expect(restoredResult.netProfit).toBe(directResult.netProfit);
      expect(restoredResult.profitMargin).toBe(directResult.profitMargin);
      expect(restoredResult.roi).toBe(directResult.roi);
      expect(restoredResult.breakEvenPrice).toBe(directResult.breakEvenPrice);
      expect(restoredResult.fees.length).toBe(directResult.fees.length);

      for (let i = 0; i < directResult.fees.length; i++) {
        expect(restoredResult.fees[i].amount).toBe(directResult.fees[i].amount);
      }
    });

    it(`reproduces the exact same reverse calculation numbers on ${platform}`, () => {
      const config = PLATFORM_CONFIGS[platform];
      const targetProfit = 30.0;
      const cost = platform === 'twitch-bits' ? 0 : 12.0;

      // 1. Direct reverse calculation
      const directRev = calculateReverse(
        platform,
        {
          targetType: 'profit',
          targetValue: targetProfit,
          quantity: 1,
          shippingCharged: 0,
          shippingCost: 0,
          itemCost: cost,
        },
        config.defaultOptions
      );

      // 2. Serialize to URL
      const state: CalculatorUrlState = {
        platform,
        mode: 'reverse',
        reverseTargetType: 'profit',
        targetProfit,
        itemCost: cost,
      };
      const query = buildUrlQuery(state);

      // 3. Parse URL back
      const restored = parseUrlState(query);

      // 4. Compute reverse from restored state
      const restoredRev = calculateReverse(
        restored.platform as PlatformId,
        {
          targetType: restored.reverseTargetType ?? 'profit',
          targetValue: restored.targetProfit ?? 25.0,
          quantity: restored.reverseQuantity ?? 1,
          shippingCharged: restored.shippingCharged ?? 0,
          shippingCost: restored.shippingCost ?? 0,
          itemCost: restored.itemCost ?? cost,
        },
        config.defaultOptions
      );

      expect(restoredRev.targetPrice).toBe(directRev.targetPrice);
      expect(restoredRev.forwardResult.netProfit).toBe(directRev.forwardResult.netProfit);
      expect(restoredRev.forwardResult.totalFees).toBe(directRev.forwardResult.totalFees);
      expect(restoredRev.forwardResult.profitMargin).toBe(directRev.forwardResult.profitMargin);
    });
  });
});
