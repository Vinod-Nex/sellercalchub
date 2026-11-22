import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale, type UiDictionary } from './types';
import { enDictionary } from './dictionaries/en';
import { LOCALIZED_SLUG_MAP } from './slugs';

export * from './types';
export * from './slugs';

/**
 * Registry of dictionaries by locale.
 * Adding a language requires adding a dictionary file here without refactoring components.
 */
const dictionaries: Record<string, Partial<UiDictionary>> = {
  en: enDictionary,
};

/**
 * Register a new dictionary dynamically (used for plugins, extensions, or test verification).
 */
export function registerDictionary(locale: string, dict: Partial<UiDictionary>) {
  dictionaries[locale] = dict;
}

/**
 * Environment flag determining if multi-locale routes and hreflang output are activated.
 */
export function isI18nEnabled(): boolean {
  return (
    typeof process !== 'undefined' &&
    (process.env.ENABLE_I18N === 'true' || process.env.PUBLIC_ENABLE_I18N === 'true')
  );
}

/**
 * Returns currently active locales based on environment flag.
 */
export function getActiveLocales(): Locale[] {
  if (isI18nEnabled()) {
    return [...SUPPORTED_LOCALES];
  }
  return [DEFAULT_LOCALE];
}

/**
 * Returns a type-safe translation helper for a given locale, with fallback to English.
 */
export function useTranslations(locale: string = DEFAULT_LOCALE) {
  const dict = dictionaries[locale] || dictionaries.en;
  const fallback = dictionaries.en;

  return {
    t: (section: keyof UiDictionary, key: string): string => {
      // @ts-expect-error dynamic dictionary lookup
      const sec = dict[section] || fallback[section];
      if (sec && sec[key]) {
        return sec[key];
      }
      // @ts-expect-error fallback lookup
      if (fallback[section] && fallback[section][key]) {
        // @ts-expect-error fallback lookup
        return fallback[section][key];
      }
      return `${String(section)}.${key}`;
    },
    dict: dict as UiDictionary,
    locale,
  };
}

export interface HreflangTag {
  hreflang: string;
  href: string;
}

/**
 * Generates reciprocal hreflang tags plus x-default for a given path.
 * Every language page references itself, all alternate language pages, and the x-default fallback.
 */
export function getHreflangTags(
  currentPath: string,
  options?: {
    siteUrl?: string;
    locales?: Locale[];
  }
): HreflangTag[] {
  const siteUrl = (options?.siteUrl || 'https://sellercalchub.com').replace(/\/$/, '');
  const activeLocales = options?.locales || getActiveLocales();

  // Normalize path to trailing slash
  const cleanPath = currentPath.split('?')[0].split('#')[0];
  const normalizedPath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;

  // Find canonical English path from localized slug map
  let canonicalPath = normalizedPath;
  for (const [canon, map] of Object.entries(LOCALIZED_SLUG_MAP)) {
    if (Object.values(map).includes(normalizedPath)) {
      canonicalPath = canon;
      break;
    }
  }

  const tags: HreflangTag[] = [];
  const mapping = LOCALIZED_SLUG_MAP[canonicalPath];

  // 1. x-default points to the primary English canonical URL
  const defaultHref = `${siteUrl}${canonicalPath}`;
  tags.push({ hreflang: 'x-default', href: defaultHref });

  // 2. English link
  tags.push({ hreflang: 'en', href: defaultHref });

  // 3. Alternate languages when active
  for (const loc of activeLocales) {
    if (loc === 'en') continue;
    const localizedSlug = mapping && mapping[loc] ? mapping[loc] : `/${loc}${canonicalPath}`;
    tags.push({
      hreflang: loc,
      href: `${siteUrl}${localizedSlug}`,
    });
  }

  return tags;
}
