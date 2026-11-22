import linksMapData from '../../data/seo/links-map.json';

export interface SiblingLink {
  url: string;
  name: string;
  rate: string;
  badge?: string;
  anchor: string;
  description: string;
}

export interface HubLink {
  url: string;
  name: string;
  anchor: string;
  description: string;
}

export interface PillarLink {
  url: string;
  name: string;
  anchor: string;
  description: string;
}

export interface PageLinksEntry {
  url: string;
  isPillar: boolean;
  cluster: string;
  pillarLink?: PillarLink;
  hubLink: HubLink;
  siblings: SiblingLink[];
}

export interface LinksMap {
  hub: HubLink;
  pillar: PillarLink;
  pages: PageLinksEntry[];
}

const data = linksMapData as LinksMap;

/**
 * Normalizes a URL path to ensure leading and trailing slashes.
 */
export function normalizePath(pathOrUrl: string): string {
  let cleaned = pathOrUrl.trim();
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      cleaned = new URL(cleaned).pathname;
    } catch {
      // ignore
    }
  }
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  if (!cleaned.endsWith('/')) {
    cleaned = `${cleaned}/`;
  }
  return cleaned;
}

/**
 * Maps a platform ID (e.g. 'ebay-us', 'depop', 'whatnot') to its canonical URL path.
 */
export function platformIdToUrl(platformId: string): string {
  const map: Record<string, string> = {
    'ebay-us': '/ebay-fee-calculator/',
    'ebay-uk': '/ebay-fee-calculator-uk/',
    'etsy': '/etsy-fee-calculator/',
    'whatnot': '/whatnot-fee-calculator/',
    'depop': '/depop-fee-calculator/',
    'tiktok-shop': '/tiktok-shop-fee-calculator/',
    'twitch-bits': '/twitch-bits-to-usd/',
  };
  return map[platformId] || '/marketplace-fee-calculators/';
}

/**
 * Retrieves the full links entry for a given URL or platform ID.
 */
export function getPageLinks(urlOrPath: string): PageLinksEntry | null {
  const normalized = normalizePath(urlOrPath);
  const found = data.pages.find((p) => p.url === normalized);
  if (found) {
    return found;
  }
  // Try platform ID mapping
  const mappedUrl = platformIdToUrl(urlOrPath);
  return data.pages.find((p) => p.url === mappedUrl) ?? null;
}

/**
 * Retrieves the global LinksMap.
 */
export function getAllLinksMap(): LinksMap {
  return data;
}
