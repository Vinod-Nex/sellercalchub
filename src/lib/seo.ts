import seoPagesData from '../data/seo/pages.json';

export interface PageSeoEntry {
  url: string;
  primary_keyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  ogTitle: string;
  supporting_keywords: string[];
  search_intent: string;
  tier: string;
  notes?: string;
}

/**
 * Retrieves the verified SEO metadata entry for a given URL path from pages.json.
 * Enforces single source of truth for Title, Meta Description, H1, and Primary Keyword.
 */
export function getPageSeo(path: string): PageSeoEntry {
  const normalized = path.endsWith('/') ? path : `${path}/`;
  const entry = seoPagesData.pages.find((p) => p.url === normalized);
  if (!entry) {
    throw new Error(`SEO metadata not found in pages.json for URL path: ${path}`);
  }
  return entry as PageSeoEntry;
}

/**
 * Maps any page path to its corresponding 1200x630 OG image.
 */
export function getOgImagePath(path: string): string {
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  if (!clean || clean === 'index') {
    return '/og/og-home.png';
  }
  if (clean === '404' || clean === '500') {
    return '/og/og-default.png';
  }
  if (clean.startsWith('guides/')) {
    const guideSlug = clean.replace('guides/', '');
    return `/og/og-guide-${guideSlug}.png`;
  }
  const ogFilename = `/og/og-${clean}.png`;
  return ogFilename;
}
