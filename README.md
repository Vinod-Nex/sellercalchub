# Seller Calc Hub (`SellerCalcHub.com`)

> Free, fast, and verified marketplace fee and profit calculators for online resellers and ecommerce sellers. Know your exact take-home payout, platform commission, and profit margin before listing inventory.

[![Website](https://img.shields.io/badge/Live_Site-sellercalchub.com-10b981.svg)](https://sellercalchub.com)
[![Framework](https://img.shields.io/badge/Astro-5.x-ff5d01.svg)](https://astro.build)
[![Language](https://img.shields.io/badge/TypeScript-Strict-3178c6.svg)](https://www.typescriptlang.org)
[![Styling](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Vitest-330%2B_Passed-22c55e.svg)](https://vitest.dev)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1_AA-0284c7.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Client--Side-16a34a.svg)](https://sellercalchub.com/privacy/)

---

## 🎯 Overview

**Seller Calc Hub** is an open web utility engineered specifically for ecommerce resellers who sell across multiple platforms. Variable marketplace commissions, hidden shipping fee percentages, and processing charges on buyer sales tax quietly erode seller margins. Existing calculator websites are frequently cluttered with intrusive video ads, broken on mobile devices, or rely on outdated commission schedules from years past.

Seller Calc Hub solves this with:
- **Zero Hallucinated Rates**: Every rate, tier ladder, and per-order fixed charge is backed by an official marketplace policy URL and a verification date.
- **Client-Side Privacy**: All mathematical calculations execute exclusively inside the user's browser. Sourcing costs, sales prices, and profit numbers are never stored in a database or sent across a network.
- **Sub-Second Static Performance**: Built with Astro Static Site Generation (SSG), shipping pre-rendered HTML with zero JavaScript runtime overhead outside of interactive calculation islands.
- **100% Free Forever**: No popups, no interstitial takeovers, no email capture gates, and no paid paywalls.

---

## 📊 Covered Marketplaces & Calculation Models

| Marketplace Platform | Covered Rates & Features | Live URL |
| :--- | :--- | :--- |
| **eBay US** | Standard 13.25% + $0.40, category ladders ($7.5K caps), Store subscriber discounts, Promoted Listings, and shipping fee deductions | [`/ebay-fee-calculator/`](https://sellercalchub.com/ebay-fee-calculator/) |
| **eBay UK** | 0% private seller fees, 12.8% + £0.30 business seller rates, regulatory operating fees, and VAT calculations | [`/ebay-fee-calculator-uk/`](https://sellercalchub.com/ebay-fee-calculator-uk/) |
| **Whatnot** | 8.0% livestream sales commission, 2.9% + $0.30 processing on gross order total (including tax), smart shipping bundles | [`/whatnot-fee-calculator/`](https://sellercalchub.com/whatnot-fee-calculator/) |
| **TikTok Shop** | Standard 6.0% category referral fees, co-funded platform promotions, and creator affiliate commission deductions | [`/tiktok-shop-fee-calculator/`](https://sellercalchub.com/tiktok-shop-fee-calculator/) |
| **Etsy & Offsite Ads** | 6.5% transaction fee, $0.20 listing renewal, 3.0% + $0.25 payment processing, and mandatory 12% to 15% Offsite Ads tiers | [`/etsy-fee-calculator/`](https://sellercalchub.com/etsy-fee-calculator/) |
| **Depop** | 0% US & UK selling fees, 3.3% + $0.45 payment processing, and buyer-side marketplace fees | [`/depop-fee-calculator/`](https://sellercalchub.com/depop-fee-calculator/) |
| **Twitch Bits** | Fixed $0.01 per Bit streamer cash payout across all official cheer bundle tiers | [`/twitch-bits-to-usd/`](https://sellercalchub.com/twitch-bits-to-usd/) |
| **Cross-Platform Hub** | Side-by-side comparison matrix calculating net payouts and effective fee rates across all platforms simultaneously | [`/marketplace-fee-calculators/`](https://sellercalchub.com/marketplace-fee-calculators/) |

---

## 🏗️ Architecture & Technical Stack

```
sellercalchub.com/
├── public/                     # Static public assets (robots.txt, llms.txt, og images, favicon)
│   ├── og/                     # 1200x630 Open Graph preview images generated at build time
│   ├── robots.txt              # Crawl rules pointing directly to sitemap-index.xml and sitemap.xml
│   └── llms.txt                # Plain-text factual summary for AI search engines & LLMs
├── scripts/                    # Build, audit, and quality automation scripts
│   ├── generate-og-images.ts   # Satori + Resvg 1200x630 OG social preview card generator
│   ├── check-thin-content.ts   # Build-time thin-content & anti-cannibalization guard
│   ├── check-links.ts          # Internal link audit verifying 2,100+ hyperlinks across dist/
│   └── lint-seo.ts             # SEO metadata validator for titles, descriptions, and H1 tags
├── src/
│   ├── assets/                 # Portable typography & fonts
│   ├── components/             # Astro UI components, inputs, and calculator islands
│   │   ├── CalculatorIsland.astro
│   │   ├── ResultsPanel.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── data/
│   │   ├── fees/               # Official fee data JSON files with source URLs and verified dates
│   │   └── seo/                # SEO keyword-to-page architecture and links map
│   ├── layouts/
│   │   └── BaseLayout.astro    # Common page template with Head, Breadcrumbs, and Footer
│   ├── lib/
│   │   ├── calc/               # Pure TypeScript fee calculation engines and unit tests
│   │   └── seo.ts              # Canonical routing, metadata helpers, and OG resolution
│   └── pages/                  # Statically generated Astro routes & calculators
│       ├── about.astro         # Mission, editorial standards, and reseller origin story
│       ├── contact.astro       # Interactive contact form and 4 priority support desks
│       ├── privacy.astro       # Client-side privacy guarantee, GDPR and CCPA disclosures
│       ├── terms.astro         # Legal terms of service, estimation disclaimer, and embed rules
│       ├── 404.astro           # Custom 404 error page with calculator directory
│       └── 500.astro           # Custom 500 server error page with recovery steps
└── astro.config.mjs            # Astro configuration, sitemap integration, and Tailwind v4
```

---

## ⚡ Developer Guide

### Prerequisites

- Node.js `22.x` or higher
- npm

### Installation

```bash
git clone https://github.com/Vinod-Nex/sellercalchub.git
cd sellercalchub
npm install
```

### Local Development

Start the Astro dev server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:4321`.

### Running Automated Tests

Run the full Vitest test suite (over 330 unit and integration tests):

```bash
npm test
```

### Production Build & Verification Pipeline

Run the comprehensive production pipeline:

```bash
npm run build:prod
```

This single command automatically executes:
1. **OG Image Generation**: Statically renders 1200×630 PNG preview images for all primary pages via Satori.
2. **SEO Metadata Linter**: Enforces character bounds (Title ≤ 60, Meta ≤ 160) and ensures zero cannibalization.
3. **Astro SSG Build**: Compiles static HTML and CSS assets into `dist/`.
4. **Thin-Content Guard**: Validates that all indexable pages contain at least 300 words of unique body text.

### Internal Link Verification

Verify that all internal links across the generated static site resolve without broken references:

```bash
npm run check:links
```

---

## 🔌 Embeddable Calculator Widget

Reseller blogs, creator resource pages, and tool directories can embed our responsive calculator widget directly using an HTML `iframe`:

```html
<iframe
  src="https://sellercalchub.com/embed/ebay-fee-calculator/"
  title="eBay Fee Calculator - Seller Calc Hub"
  width="100%"
  height="620"
  style="border: 1px solid #e2e8f0; border-radius: 8px; max-width: 720px; overflow: hidden;"
  loading="lazy"
></iframe>
<p style="font-size: 12px; color: #64748b; margin-top: 6px;">
  Powered by <a href="https://sellercalchub.com/ebay-fee-calculator/" target="_blank" rel="noopener">Seller Calc Hub</a>
</p>
```

Supported embed platforms: `ebay-fee-calculator`, `ebay-fee-calculator-uk`, `whatnot-fee-calculator`, `tiktok-shop-fee-calculator`, `etsy-fee-calculator`, and `depop-fee-calculator`.

---

## 🤝 Contributing Fee Corrections

Have you noticed a recent marketplace policy change, a category commission ladder shift, or a regional tax adjustment?

We welcome community fee updates! To maintain our strict data integrity standard:
1. Every rate report or pull request must include a direct link to official platform documentation (e.g. an official marketplace seller handbook or policy amendment).
2. Rate updates are reviewed and deployed within 24 to 48 hours.
3. Submissions can be sent via our [Contact page](https://sellercalchub.com/contact/) or by emailing `corrections@sellercalchub.com`.

---

## 📜 Disclaimer & Legal

Seller Calc Hub is an independent calculation utility and is not affiliated with, authorized by, sponsored by, or endorsed by eBay Inc., Etsy, Inc., Whatnot, Inc., ByteDance Ltd. / TikTok, Depop Limited, or Amazon.com / Twitch Interactive. All registered trademarks belong exclusively to their respective owners.

Fee calculations are mathematical simulations for planning and educational purposes. Always consult official marketplace statements before making purchasing or pricing commitments. Read our full [Calculation Disclaimer](https://sellercalchub.com/disclaimer/) and [Terms of Service](https://sellercalchub.com/terms/).
