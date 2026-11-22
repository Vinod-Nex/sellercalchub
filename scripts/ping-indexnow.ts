import fs from 'node:fs';
import path from 'node:path';

export const INDEXNOW_KEY = 'cbe4aec295ff4745a58e90bc79fa4c84';
export const SITE_HOST = 'sellercalchub.com';
export const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export interface PlatformUrlMap {
  [platform: string]: string[];
}

export const PLATFORM_URLS: PlatformUrlMap = {
  'ebay-us': [
    `https://${SITE_HOST}/ebay-fee-calculator/`,
    `https://${SITE_HOST}/ebay-final-value-fee-calculator/`,
    `https://${SITE_HOST}/ebay-shipping-fee-calculator/`,
    `https://${SITE_HOST}/ebay-profit-calculator/`,
    `https://${SITE_HOST}/ebay-and-paypal-fee-calculator/`,
    `https://${SITE_HOST}/guides/how-ebay-calculates-fees/`,
    `https://${SITE_HOST}/guides/does-ebay-charge-fees-on-shipping/`,
  ],
  'ebay-uk': [
    `https://${SITE_HOST}/ebay-fee-calculator-uk/`,
  ],
  etsy: [
    `https://${SITE_HOST}/etsy-fee-calculator/`,
    `https://${SITE_HOST}/etsy-offsite-ads-fee-calculator/`,
  ],
  whatnot: [
    `https://${SITE_HOST}/whatnot-fee-calculator/`,
    `https://${SITE_HOST}/guides/whatnot-fees-explained/`,
  ],
  'tiktok-shop': [
    `https://${SITE_HOST}/tiktok-shop-fee-calculator/`,
  ],
  depop: [
    `https://${SITE_HOST}/depop-fee-calculator/`,
  ],
  'twitch-bits': [
    `https://${SITE_HOST}/twitch-bits-to-usd/`,
  ],
};

/**
 * Derives the list of updated URLs to notify search engines about.
 */
export function getChangedFeeUrls(options?: {
  platform?: string;
  all?: boolean;
  changelogPath?: string;
}): string[] {
  const urls = new Set<string>();

  // Always ping fee changes changelog and hub
  urls.add(`https://${SITE_HOST}/fee-changes/`);
  urls.add(`https://${SITE_HOST}/marketplace-fee-calculators/`);

  if (options?.all) {
    for (const list of Object.values(PLATFORM_URLS)) {
      for (const u of list) urls.add(u);
    }
    return Array.from(urls);
  }

  if (options?.platform && PLATFORM_URLS[options.platform]) {
    for (const u of PLATFORM_URLS[options.platform]) urls.add(u);
    return Array.from(urls);
  }

  // Otherwise, inspect changelog.json for recent platform edits
  const changelogFile = options?.changelogPath || path.resolve('src/data/fees/changelog.json');
  if (fs.existsSync(changelogFile)) {
    try {
      const changelog = JSON.parse(fs.readFileSync(changelogFile, 'utf-8'));
      if (Array.isArray(changelog)) {
        // Find platforms modified in the most recent updates
        for (const entry of changelog.slice(0, 5)) {
          const platform = entry.platform;
          if (platform && PLATFORM_URLS[platform]) {
            for (const u of PLATFORM_URLS[platform]) urls.add(u);
          }
        }
      }
    } catch {
      // Fallback: ping all core calculators
      for (const list of Object.values(PLATFORM_URLS)) {
        for (const u of list) urls.add(u);
      }
    }
  }

  return Array.from(urls);
}

/**
 * Builds standard IndexNow JSON payload according to indexnow.org specification.
 */
export function buildIndexNowPayload(urls: string[]): IndexNowPayload {
  return {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
}

/**
 * Pings the IndexNow endpoint (or simulates if dryRun is true).
 */
export async function submitToIndexNow(
  payload: IndexNowPayload,
  options?: { dryRun?: boolean }
): Promise<{ success: boolean; status: number; message: string }> {
  if (options?.dryRun || process.env.INDEXNOW_DRY_RUN === 'true') {
    return {
      success: true,
      status: 200,
      message: `[Dry Run] Successfully constructed IndexNow ping for ${payload.urlList.length} URLs. No external request sent.`,
    };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'SellerCalcHub-IndexNow/1.0',
      },
      body: JSON.stringify(payload),
    });

    // 200: OK, 202: Accepted (queued for indexing)
    if (response.status === 200 || response.status === 202) {
      return {
        success: true,
        status: response.status,
        message: `IndexNow ping accepted (HTTP ${response.status}) for ${payload.urlList.length} URLs.`,
      };
    } else {
      const text = await response.text();
      return {
        success: false,
        status: response.status,
        message: `IndexNow ping returned HTTP ${response.status}: ${text}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      status: 500,
      message: `Network error pinging IndexNow: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const isDryRun = args.includes('--dry-run') || process.env.NODE_ENV !== 'production';
  const platformArg = args.find((a) => !a.startsWith('--'));

  console.log(`\n========================================`);
  console.log(`INDEXNOW SEARCH ENGINE PINGER (Phase 45)`);
  console.log(`Host: ${SITE_HOST}`);
  console.log(`Key:  ${INDEXNOW_KEY}`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE SUBMISSION'}`);
  console.log(`========================================\n`);

  const urlsToPing = getChangedFeeUrls({
    all: isAll,
    platform: platformArg,
  });

  console.log(`Found ${urlsToPing.length} URL(s) to submit to IndexNow:`);
  for (const u of urlsToPing) {
    console.log(` - ${u}`);
  }

  const payload = buildIndexNowPayload(urlsToPing);

  submitToIndexNow(payload, { dryRun: isDryRun }).then((res) => {
    if (res.success) {
      console.log(`\n✅ ${res.message}\n`);
      process.exit(0);
    } else {
      console.error(`\n❌ ${res.message}\n`);
      process.exit(1);
    }
  });
}
