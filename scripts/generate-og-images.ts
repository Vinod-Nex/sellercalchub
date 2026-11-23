import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export interface OgImageDef {
  slug: string;
  filename: string;
  title: string;
  subtitle: string;
  platformName: string;
  sampleResult: string;
  badge?: string;
}

export const OG_IMAGES: OgImageDef[] = [
  {
    slug: 'home',
    filename: 'og-home.png',
    title: 'Seller Calc Hub',
    subtitle: 'Free, Fast Marketplace Fee & Profit Calculators for Resellers',
    platformName: 'MULTI-MARKETPLACE',
    sampleResult: 'Instant profit calculations for Whatnot, TikTok Shop, Depop, Etsy & eBay',
    badge: '2026 VERIFIED RATES',
  },
  {
    slug: 'marketplace-fee-calculators',
    filename: 'og-marketplace-fee-calculators.png',
    title: 'Compare Reseller Fees Side-by-Side',
    subtitle: 'Find Your Most Profitable Platform & Calculate Margins',
    platformName: 'CROSS-PLATFORM COMPARISON',
    sampleResult: 'Compare take-home pay, commission rates, and payouts across 7 marketplaces',
    badge: '2026 VERIFIED RATES',
  },
  {
    slug: 'ebay-fee-calculator',
    filename: 'og-ebay-fee-calculator.png',
    title: 'eBay Fee & Profit Calculator',
    subtitle: 'Calculate Exact Final Value Fees, Shipping Fees & Net Margin',
    platformName: 'EBAY (US)',
    sampleResult: 'Sample: $100.00 sale ➔ $17.13 total fees ➔ You keep: $82.87 (82.9% margin)',
    badge: '13.25% + $0.40 FVF',
  },
  {
    slug: 'ebay-fee-calculator-uk',
    filename: 'og-ebay-fee-calculator-uk.png',
    title: 'eBay UK Fee Calculator',
    subtitle: '0% Private Selling Fees vs 12.8% Business Rates',
    platformName: 'EBAY (UK)',
    sampleResult: 'Sample: £100.00 sale ➔ £0.00 selling fee for private sellers (No Final Value Fee)',
    badge: '0% PRIVATE SELLING FEE',
  },
  {
    slug: 'ebay-final-value-fee-calculator',
    filename: 'og-ebay-final-value-fee-calculator.png',
    title: 'eBay Final Value Fee Calculator',
    subtitle: 'Category Rate Ladders, $7,500 Tiers & Top Rated Discounts',
    platformName: 'EBAY (US)',
    sampleResult: 'Most categories: 13.25% up to $7,500 per item; 2.35% on the portion over $7,500',
    badge: 'CATEGORY TIER LADDERS',
  },
  {
    slug: 'ebay-profit-calculator',
    filename: 'og-ebay-profit-calculator.png',
    title: 'eBay Profit & Margin Calculator',
    subtitle: 'Calculate Net Cash Profit, Margins, ROI & Reverse Price Solver',
    platformName: 'EBAY (US)',
    sampleResult: 'Reverse solver: input target $ profit to calculate minimum listing price',
    badge: 'BOTTOM-LINE PROFIT & ROI',
  },
  {
    slug: 'ebay-shipping-fee-calculator',
    filename: 'og-ebay-shipping-fee-calculator.png',
    title: 'eBay Shipping Fee Calculator',
    subtitle: 'Fees Charged on Buyer Postage & Avoid Out-of-Pocket Loss',
    platformName: 'EBAY (US)',
    sampleResult: 'Final value fees apply to item price + shipping collected + buyer sales tax',
    badge: 'POSTAGE LOSS AVOIDANCE',
  },
  {
    slug: 'ebay-and-paypal-fee-calculator',
    filename: 'og-ebay-and-paypal-fee-calculator.png',
    title: 'eBay & PayPal Fee Calculator',
    subtitle: 'Compare Modern Managed Payments vs Legacy PayPal Deductions',
    platformName: 'EBAY (US)',
    sampleResult: 'Managed Payments (13.25%) eliminates separate 2.9% + $0.30 PayPal processing',
    badge: 'MANAGED PAYMENTS COMPARISON',
  },
  {
    slug: 'etsy-fee-calculator',
    filename: 'og-etsy-fee-calculator.png',
    title: 'Etsy Fee & Profit Calculator',
    subtitle: 'Listing Fees, Transaction Rates, Payment Costs & Net Margins',
    platformName: 'ETSY',
    sampleResult: 'Sample: $40.00 sale ➔ $0.20 listing + 6.5% fee + 3% pay ➔ You keep: $36.00',
    badge: '6.5% + $0.20 LISTING',
  },
  {
    slug: 'etsy-offsite-ads-fee-calculator',
    filename: 'og-etsy-offsite-ads-fee-calculator.png',
    title: 'Etsy Offsite Ads Fee Calculator',
    subtitle: 'Model Mandatory 12% vs Optional 15% Deductions & $100 Cap',
    platformName: 'ETSY',
    sampleResult: 'Attributed sales incur 12% or 15% ad fee capped at $100 per item maximum',
    badge: '12% VS 15% ADS CAP',
  },
  {
    slug: 'whatnot-fee-calculator',
    filename: 'og-whatnot-fee-calculator.png',
    title: 'Whatnot Fee & Profit Calculator',
    subtitle: 'Live Auction Commission, Payment Processing & Take-Home Cash',
    platformName: 'WHATNOT',
    sampleResult: 'Sample: $50.00 sale ➔ 8% commission + 2.9% + $0.30 pay ➔ You keep: $44.25',
    badge: '8% LIVE COMMISSION',
  },
  {
    slug: 'tiktok-shop-fee-calculator',
    filename: 'og-tiktok-shop-fee-calculator.png',
    title: 'TikTok Shop Fee Calculator',
    subtitle: 'Standard 6% Referral Fees, Affiliate Payouts & Real Net Margin',
    platformName: 'TIKTOK SHOP',
    sampleResult: 'Sample: $50.00 sale ➔ 6% referral fee ($3.00) + $0.30 ➔ You keep: $46.70',
    badge: '6.0% REFERRAL RATE',
  },
  {
    slug: 'depop-fee-calculator',
    filename: 'og-depop-fee-calculator.png',
    title: 'Depop Fee & Profit Calculator',
    subtitle: '0% Marketplace Selling Fee & Payment Processing Payout',
    platformName: 'DEPOP',
    sampleResult: 'Sample: $35.00 sale ➔ 0% selling fee + 3.3% + $0.45 pay ➔ You keep: $33.39',
    badge: '0% SELLING FEE',
  },
  {
    slug: 'twitch-bits-to-usd',
    filename: 'og-twitch-bits-to-usd.png',
    title: 'Twitch Bits to USD Converter',
    subtitle: 'Convert Bits into Exact Streamer Cash Payouts',
    platformName: 'TWITCH BITS',
    sampleResult: '1,000 Bits = $10.00 USD (Fixed $0.01 per bit creator revenue payout)',
    badge: '$0.01 PER BIT PAYOUT',
  },
  {
    slug: 'fee-changes',
    filename: 'og-fee-changes.png',
    title: 'Marketplace Fee Changes Changelog',
    subtitle: 'Verified 2026 Rate Shifts, Official Notices & Historical Audits',
    platformName: 'OFFICIAL CHANGELOG',
    sampleResult: 'Verified timestamped policy adjustments across eBay, Etsy, Whatnot & TikTok',
    badge: 'OFFICIAL NOTICES & DATES',
  },
  {
    slug: 'about',
    filename: 'og-about.png',
    title: 'About Seller Calc Hub',
    subtitle: 'Free & Verified Marketplace Fee Calculators Built for Online Resellers',
    platformName: 'OUR MISSION',
    sampleResult: 'Zero popups • Verified rates • Client-side privacy • WCAG AA accessible',
    badge: 'EDITORIAL STANDARDS',
  },
  {
    slug: 'contact',
    filename: 'og-contact.png',
    title: 'Contact & Rate Corrections',
    subtitle: 'Submit Fee Updates, Calculation Feedback & Platform Requests',
    platformName: 'EDITORIAL SUPPORT',
    sampleResult: 'Verified fee correction pipeline with 24–48 hour turnaround SLA',
    badge: 'DIRECT SUPPORT',
  },
  {
    slug: 'privacy',
    filename: 'og-privacy.png',
    title: 'Privacy Policy',
    subtitle: '100% Client-Side Calculations • Zero Data Selling • GDPR & CCPA Ready',
    platformName: 'DATA PROTECTION',
    sampleResult: 'Your sales prices and profit margins never leave your browser',
    badge: 'LOCAL PRIVACY FIRST',
  },
  {
    slug: 'terms',
    filename: 'og-terms.png',
    title: 'Terms of Service & Fee Disclaimer',
    subtitle: 'Transparent Estimation Guidelines, Non-Affiliation & Permissible Use',
    platformName: 'LEGAL TERMS',
    sampleResult: 'Clear usage terms, disclaimer on estimates, and embeddable widget guidelines',
    badge: 'TERMS & DISCLAIMER',
  },
  {
    slug: 'disclaimer',
    filename: 'og-disclaimer.png',
    title: 'Calculation & Estimates Disclaimer',
    subtitle: 'Why Actual Marketplace Payouts May Differ from Base Calculations',
    platformName: 'FEE ESTIMATES',
    sampleResult: 'Sales tax nuances, category ladders, seller rating tiers & ad deductions explained',
    badge: 'ESTIMATES POLICY',
  },
  {
    slug: 'guide-how-ebay-calculates-fees',
    filename: 'og-guide-how-ebay-calculates-fees.png',
    title: 'How eBay Calculates Fees in 2026',
    subtitle: 'Complete Seller Guide: Category Tiers, Shipping Fees & Store Break-Even',
    platformName: 'EBAY GUIDE',
    sampleResult: 'Step-by-step formula breakdown with worked numerical examples',
    badge: 'EDUCATIONAL GUIDE',
  },
  {
    slug: 'guide-does-ebay-charge-fees-on-shipping',
    filename: 'og-guide-does-ebay-charge-fees-on-shipping.png',
    title: 'Does eBay Charge Fees on Shipping?',
    subtitle: 'The Truth About Managed Payments, Sales Tax & Free Shipping',
    platformName: 'EBAY GUIDE',
    sampleResult: 'Why eBay applies 13.25% to buyer postage and how to avoid shipping losses',
    badge: 'EDUCATIONAL GUIDE',
  },
  {
    slug: 'guide-whatnot-fees-explained',
    filename: 'og-guide-whatnot-fees-explained.png',
    title: 'Whatnot Fees Explained',
    subtitle: 'Live Auction Commission, Smart Shipping Bundling & Early Payouts',
    platformName: 'WHATNOT GUIDE',
    sampleResult: 'Understand the 8% commission, processing fees on tax, and payout schedules',
    badge: 'EDUCATIONAL GUIDE',
  },
  {
    slug: 'default',
    filename: 'og-default.png',
    title: 'Seller Calc Hub',
    subtitle: 'Free, Fast Marketplace Fee & Profit Calculators for Resellers',
    platformName: 'SELLER CALC HUB',
    sampleResult: 'Calculate exact selling fees, profit margins, and payouts across 7 marketplaces',
    badge: '2026 VERIFIED RATES',
  },
];

/**
 * Builds the Satori JSX element for an OG image.
 */
function buildOgElement(def: OgImageDef) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: '#0c120f',
        color: '#ffffff',
        padding: '56px 64px',
        boxSizing: 'border-box',
        border: '12px solid #14221b',
        position: 'relative',
      },
      children: [
        // Top Header Bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            },
            children: [
              // Logo & Brand
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: '#10b981',
                          color: '#0c120f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          marginRight: '14px',
                        },
                        children: 'SCH',
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: '26px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          letterSpacing: '-0.5px',
                        },
                        children: 'Seller Calc Hub',
                      },
                    },
                  ],
                },
              },
              // Platform Badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#162a1f',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '8px 16px',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: '15px',
                          fontWeight: 'bold',
                          color: '#10b981',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                        },
                        children: def.platformName,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Middle Section: Page Title & Subtitle
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              margin: '20px 0',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: def.title.length > 32 ? '48px' : '56px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    lineHeight: 1.15,
                    letterSpacing: '-1px',
                    marginBottom: '16px',
                  },
                  children: def.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    color: '#9ca3af',
                    lineHeight: 1.3,
                  },
                  children: def.subtitle,
                },
              },
            ],
          },
        },

        // Sample Calculation Result Card (Prompt requirement: "a sample result")
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#121e17',
              border: '2px solid #233e2f',
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '10px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#a3e635',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        },
                        children: 'SAMPLE CALCULATION BREAKDOWN',
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontSize: '13px',
                          color: '#10b981',
                          backgroundColor: '#0c1e13',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #10b981',
                        },
                        children: def.badge || '2026 VERIFIED',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '22px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    letterSpacing: '-0.3px',
                  },
                  children: def.sampleResult,
                },
              },
            ],
          },
        },

        // Bottom Footer Bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #1f3326',
            },
            children: [
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: '18px',
                    color: '#10b981',
                    fontWeight: 'bold',
                  },
                  children: 'https://sellercalchub.com',
                },
              },
              {
                type: 'span',
                props: {
                  style: {
                    fontSize: '16px',
                    color: '#6b7280',
                  },
                  children: 'Free · Fast · 100% Verified · Zero Ads',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Generates all 1200x630 OG PNG images at build time.
 */
export async function generateAllOgImages(): Promise<string[]> {
  const rootDir = process.cwd();
  const fontPath = path.join(rootDir, 'src/assets/fonts/Arial.ttf');

  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found at ${fontPath}`);
  }

  const fontData = fs.readFileSync(fontPath);
  const outDir = path.join(rootDir, 'public/og');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const generatedFiles: string[] = [];

  for (const def of OG_IMAGES) {
    // @ts-expect-error Satori elements
    const svg = await satori(buildOgElement(def), {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Arial',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Write to public/og/
    const filePath = path.join(outDir, def.filename);
    fs.writeFileSync(filePath, pngBuffer);
    generatedFiles.push(filePath);

    // If default, also save to public/og-default.png
    if (def.slug === 'default') {
      fs.writeFileSync(path.join(rootDir, 'public/og-default.png'), pngBuffer);
    }
  }

  return generatedFiles;
}

if (process.argv[1] && process.argv[1].endsWith('generate-og-images.ts')) {
  console.log('Generating 1200x630 OG social preview images for all pages...');
  const start = performance.now();
  generateAllOgImages()
    .then((files) => {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      console.log(`✅ Generated ${files.length} OG images in ${elapsed}s:`);
      files.forEach((f) => console.log(`   - ${path.basename(f)}`));
    })
    .catch((err) => {
      console.error('❌ Failed to generate OG images:', err);
      process.exit(1);
    });
}
