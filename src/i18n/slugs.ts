import type { Locale } from './types';

export interface LocalizedSlugMapping {
  en: string;
  pt?: string;
  es?: string;
  fr?: string;
  [locale: string]: string | undefined;
}

/**
 * Canonical English slug to localized route mapping derived from Semrush keyword research.
 */
export const LOCALIZED_SLUG_MAP: Record<string, LocalizedSlugMapping> = {
  '/': {
    en: '/',
    pt: '/pt/',
    es: '/es/',
    fr: '/fr/',
  },
  '/marketplace-fee-calculators/': {
    en: '/marketplace-fee-calculators/',
    pt: '/pt/marketplaces/',
    es: '/es/marketplaces/',
    fr: '/fr/marketplaces/',
  },
  '/ebay-fee-calculator/': {
    en: '/ebay-fee-calculator/',
    pt: '/pt/calculadora-taxas-ebay/',
    es: '/es/calculadora-comisiones-ebay/',
    fr: '/fr/calculateur-frais-ebay/',
  },
  '/ebay-final-value-fee-calculator/': {
    en: '/ebay-final-value-fee-calculator/',
    pt: '/pt/calculadora-taxa-valor-final-ebay/',
    es: '/es/calculadora-comision-valor-final-ebay/',
    fr: '/fr/calculateur-frais-valeur-finale-ebay/',
  },
  '/ebay-profit-calculator/': {
    en: '/ebay-profit-calculator/',
    pt: '/pt/calculadora-lucro-ebay/',
    es: '/es/calculadora-beneficio-ebay/',
    fr: '/fr/calculateur-benefice-ebay/',
  },
  '/ebay-and-paypal-fee-calculator/': {
    en: '/ebay-and-paypal-fee-calculator/',
    pt: '/pt/calculadora-taxas-ebay-paypal/',
    es: '/es/calculadora-comisiones-ebay-paypal/',
    fr: '/fr/calculateur-frais-ebay-paypal/',
  },
  '/ebay-shipping-fee-calculator/': {
    en: '/ebay-shipping-fee-calculator/',
    pt: '/pt/calculadora-taxas-envio-ebay/',
    es: '/es/calculadora-comisiones-envio-ebay/',
    fr: '/fr/calculateur-frais-livraison-ebay/',
  },
  '/ebay-fee-calculator-uk/': {
    en: '/ebay-fee-calculator-uk/',
    pt: '/pt/calculadora-taxas-ebay-uk/',
    es: '/es/calculadora-comisiones-ebay-uk/',
    fr: '/fr/calculateur-frais-ebay-uk/',
  },
  '/etsy-fee-calculator/': {
    en: '/etsy-fee-calculator/',
    pt: '/pt/calculadora-taxas-etsy/',
    es: '/es/calculadora-comisiones-etsy/',
    fr: '/fr/calculateur-frais-etsy/',
  },
  '/etsy-offsite-ads-fee-calculator/': {
    en: '/etsy-offsite-ads-fee-calculator/',
    pt: '/pt/calculadora-taxas-etsy-offsite-ads/',
    es: '/es/calculadora-comisiones-etsy-offsite-ads/',
    fr: '/fr/calculateur-frais-etsy-offsite-ads/',
  },
  '/whatnot-fee-calculator/': {
    en: '/whatnot-fee-calculator/',
    pt: '/pt/calculadora-taxas-whatnot/',
    es: '/es/calculadora-comisiones-whatnot/',
    fr: '/fr/calculateur-frais-whatnot/',
  },
  '/tiktok-shop-fee-calculator/': {
    en: '/tiktok-shop-fee-calculator/',
    pt: '/pt/calculadora-taxas-tiktok-shop/',
    es: '/es/calculadora-comisiones-tiktok-shop/',
    fr: '/fr/calculateur-frais-tiktok-shop/',
  },
  '/depop-fee-calculator/': {
    en: '/depop-fee-calculator/',
    pt: '/pt/calculadora-taxas-depop/',
    es: '/es/calculadora-comisiones-depop/',
    fr: '/fr/calculateur-frais-depop/',
  },
  '/twitch-bits-to-usd/': {
    en: '/twitch-bits-to-usd/',
    pt: '/pt/bits-twitch-para-reais/',
    es: '/es/bits-twitch-a-dolares/',
    fr: '/fr/bits-twitch-en-euros/',
  },
  '/fee-changes/': {
    en: '/fee-changes/',
    pt: '/pt/mudancas-taxas/',
    es: '/es/cambios-tarifas/',
    fr: '/fr/changements-frais/',
  },
};
