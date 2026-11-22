export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface WebApplicationSchemaOptions {
  name: string;
  url: string;
  description: string;
  currency?: string;
  applicationCategory?: string;
  siteUrl?: string;
}

export interface CalculatorStructuredDataOptions {
  name: string;
  url: string;
  description: string;
  currency?: string;
  applicationCategory?: string;
  breadcrumbs: BreadcrumbItem[];
  faqs?: FaqItem[];
  siteUrl?: string;
}

const DEFAULT_SITE_URL = 'https://sellercalchub.com/';

function ensureTrailingSlashUrl(urlOrPath: string, siteUrl: string): string {
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return new URL(cleanPath, base).toString();
}

/**
 * Builds Schema.org Organization structured data for the site publisher / brand.
 */
export function buildOrganizationSchema(siteUrl = DEFAULT_SITE_URL): Record<string, unknown> {
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Seller Calc Hub',
    url: base,
    logo: `${base}icon-512.png`,
    description:
      'Free, fast marketplace fee and profit calculators for online resellers across Whatnot, TikTok Shop, Depop, Etsy, eBay, and Twitch Bits.',
    sameAs: [],
  };
}

/**
 * Builds Schema.org WebSite structured data with SearchAction.
 */
export function buildWebSiteSchema(siteUrl = DEFAULT_SITE_URL): Record<string, unknown> {
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Seller Calc Hub',
    url: base,
    description:
      'Free, fast marketplace fee and profit calculators for online resellers across Whatnot, TikTok Shop, Depop, Etsy, eBay, and Twitch Bits.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Builds Schema.org BreadcrumbList structured data for nested navigation.
 * Validates that every ListItem carries a valid 1-based position, non-empty name, and absolute URL.
 */
export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
  canonicalPathOrUrl: string,
  siteUrl = DEFAULT_SITE_URL
): Record<string, unknown> {
  const canonicalUrl = ensureTrailingSlashUrl(canonicalPathOrUrl, siteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      let itemUrl: string;
      if (item.href) {
        itemUrl = ensureTrailingSlashUrl(item.href, siteUrl);
      } else {
        // Leaf item in breadcrumb maps directly to current canonical URL
        itemUrl = canonicalUrl;
      }

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: itemUrl,
      };
    }),
  };
}

/**
 * Builds Schema.org WebApplication structured data for calculator islands.
 */
export function buildWebApplicationSchema(options: WebApplicationSchemaOptions): Record<string, unknown> {
  const {
    name,
    url,
    description,
    currency = 'USD',
    applicationCategory = 'BusinessApplication',
    siteUrl = DEFAULT_SITE_URL,
  } = options;

  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const canonicalUrl = ensureTrailingSlashUrl(url, base);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: canonicalUrl,
    description,
    applicationCategory,
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: currency,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Seller Calc Hub',
      url: base,
    },
  };
}

/**
 * Builds Schema.org FAQPage structured data strictly when FAQs exist.
 * Text must match visible HTML question and answer content exactly.
 */
export function buildFaqSchema(faqs: FaqItem[]): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * High-level helper for calculator pages: generates WebApplication, BreadcrumbList,
 * and FAQPage (if FAQs present) as a unified array for BaseLayout structuredData.
 */
export function buildCalculatorStructuredData(
  options: CalculatorStructuredDataOptions
): Array<Record<string, unknown>> {
  const {
    name,
    url,
    description,
    currency = 'USD',
    applicationCategory = 'BusinessApplication',
    breadcrumbs,
    faqs,
    siteUrl = DEFAULT_SITE_URL,
  } = options;

  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const canonicalUrl = ensureTrailingSlashUrl(url, base);

  const schemas: Array<Record<string, unknown>> = [];

  // 1. WebApplication Schema
  schemas.push(
    buildWebApplicationSchema({
      name,
      url: canonicalUrl,
      description,
      currency,
      applicationCategory,
      siteUrl: base,
    })
  );

  // 2. BreadcrumbList Schema (if breadcrumbs provided)
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(buildBreadcrumbSchema(breadcrumbs, canonicalUrl, base));
  }

  // 3. FAQPage Schema (only where faqs exist and are non-empty)
  if (faqs && faqs.length > 0) {
    const faqSchema = buildFaqSchema(faqs);
    if (faqSchema) {
      schemas.push(faqSchema);
    }
  }

  return schemas;
}
