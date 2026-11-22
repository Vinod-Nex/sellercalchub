# Seller Calc Hub: Phased Launch Order & Pre-Publish Checklist

This document outlines the four-week phased rollout sequence for **Seller Calc Hub** (`SellerCalcHub.com`), derived directly from keyword search velocity, keyword difficulty (KD), and competitive opportunity identified in `keyword-plan-ranked.xlsx`.

Every page must pass the **6-Point Pre-Publish Checklist** before deployment.

---

## 1. Executive Summary & Phased Launch Rationale

Instead of deploying all tools simultaneously, our phased rollout establishes search engine trust and topical authority sequentially:

```mermaid
flowchart LR
    W1["Week 1: Social & Live<br/>Whatnot, TikTok, Depop"] --> W2["Week 2: Crafts & Creators<br/>Etsy, Offsite Ads, Twitch"]
    W2 --> W3["Week 3: eBay Core Pillars<br/>Pillar, FVF Tiers, Profit"]
    W3 --> W4["Week 4: Global & Hub<br/>eBay UK, Shipping, PayPal, Master Hub"]
```

1. **Week 1 (Social, Resale & Live Commerce):** Fastest-growing marketplace niches with lower keyword difficulty (KD < 15) and underserved calculator tools. Establishes immediate traction on Google and Bing.
2. **Week 2 (Artisan & Creator Economy):** Addresses Etsy sellers frustrated with complex multi-fee structures (listing, transaction, payment processing, and 12%/15% offsite ads) alongside Twitch Bits cash conversions.
3. **Week 3 (Core eBay US Volume Pillars):** Deploys the highest search volume cluster (eBay US Managed Payments), targeting generic seller fee searches, tiered category ladders, and reverse-margin calculations.
4. **Week 4 (Global, Shipping Nuances & Comparison Hub):** Captures UK private/business VAT calculations, answers the critical question of fees on shipping, compares legacy PayPal processing, and binds all clusters together with the master comparison hub.

---

## 2. Weekly Deployment Schedule

### Week 1: Social, Resale & Livestream Commerce
*Target Audience: Live video auctioneers, Gen-Z vintage clothing resellers, and social media shop creators.*

| Page Name | Canonical URL | Primary Target Keyword | Intent | Key Verified Fact |
|---|---|---|---|---|
| **Whatnot Fee Calculator** | [`/whatnot-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/whatnot-fee-calculator.astro) | `whatnot fee calculator` | Tool | 8.0% hammer price commission + 2.9% + $0.30 processing; zero fee on shipping. |
| **TikTok Shop Fee Calculator** | [`/tiktok-shop-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/tiktok-shop-fee-calculator.astro) | `tiktok shop fee calculator` | Tool | 6.0% referral fee per order (inclusive of payment processing). |
| **Depop Fee Calculator** | [`/depop-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/depop-fee-calculator.astro) | `depop fee calculator` | Tool | 0.0% selling fee policy (sellers only pay 3.3% + $0.45 processing). |
| **Whatnot Fees Explained** | [`/guides/whatnot-fees-explained/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/guides/whatnot-fees-explained.astro) | `whatnot fees explained` | Informational | Smart shipping bundling mechanics & Early Payout scan milestones. |

---

### Week 2: Artisan Crafts & Creator Economy
*Target Audience: Handmade artisans, vintage craft sellers, and livestream creators.*

| Page Name | Canonical URL | Primary Target Keyword | Intent | Key Verified Fact |
|---|---|---|---|---|
| **Etsy Fee Calculator** | [`/etsy-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/etsy-fee-calculator.astro) | `etsy fee calculator` | Tool | 6.5% transaction cut + $0.20 listing renewal + 3.0% + $0.25 payment processing. |
| **Etsy Offsite Ads Calculator** | [`/etsy-offsite-ads-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/etsy-offsite-ads-fee-calculator.astro) | `etsy offsite ads fee calculator` | Tool | 12% mandatory fee ($10k+ trailing sales) vs 15% optional fee; $100 cap per order. |
| **Twitch Bits to USD Converter** | [`/twitch-bits-to-usd/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/twitch-bits-to-usd.astro) | `twitch bits to usd` | Tool | Exactly $0.01 USD per bit to creator; ~28% to 40% upfront viewer web markup; $50 threshold. |

---

### Week 3: Core eBay US Volume Pillars
*Target Audience: General eBay resellers, electronics liquidators, sneakerheads, and full-time ecommerce sellers.*

| Page Name | Canonical URL | Primary Target Keyword | Intent | Key Verified Fact |
|---|---|---|---|---|
| **eBay Fee & Profit Calculator** | [`/ebay-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-fee-calculator.astro) | `ebay fee calculator` | Tool | 13.25% + $0.40 standard FVF ($0.30 if ≤ $10); 12.35% Basic Store rate; 250 free listings. |
| **eBay Final Value Fee Calculator** | [`/ebay-final-value-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-final-value-fee-calculator.astro) | `ebay final value fee calculator` | Tool | Category ladders: Guitars (6.7%), Sneakers $150+ (8.0%), Media (15.3%), Jewelry (15.0%). |
| **eBay Profit Calculator** | [`/ebay-profit-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-profit-calculator.astro) | `ebay profit calculator` | Tool | Reverse math algorithm solving required listing price from target net cash or margin %. |
| **How eBay Calculates Fees** | [`/guides/how-ebay-calculates-fees/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/guides/how-ebay-calculates-fees.astro) | `how does ebay calculate fees` | Informational | 3-part math formula explaining why FVF applies to buyer-paid sales tax and postage. |

---

### Week 4: Global Cross-Border, Shipping & Master Hub
*Target Audience: UK private & commercial traders, cross-border sellers, multi-platform resellers.*

| Page Name | Canonical URL | Primary Target Keyword | Intent | Key Verified Fact |
|---|---|---|---|---|
| **eBay UK Fee Calculator** | [`/ebay-fee-calculator-uk/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-fee-calculator-uk.astro) | `ebay fee calculator uk` | Tool | 0% private seller fee vs 12.8% + 30p business rate + 20% HMRC VAT + 0.42% regulatory fee. |
| **eBay Shipping Fee Calculator** | [`/ebay-shipping-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-shipping-fee-calculator.astro) | `ebay shipping fee calculator` | Tool | 13.25% fee deducted on postage; handling buffer strategy; Commercial Base label savings. |
| **eBay & PayPal Explainer** | [`/ebay-and-paypal-fee-calculator/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/ebay-and-paypal-fee-calculator.astro) | `ebay and paypal fee calculator` | Tool | Modern Managed Payments vs legacy 2.9% + $0.30 PayPal processing comparison. |
| **Marketplace Fee Comparison Hub** | [`/marketplace-fee-calculators/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/marketplace-fee-calculators.astro) | `marketplace fee calculators` | Hub | Multi-platform comparative grid evaluating payouts across all 7 platforms side-by-side. |
| **Does eBay Charge Fees on Shipping?** | [`/guides/does-ebay-charge-fees-on-shipping/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/guides/does-ebay-charge-fees-on-shipping.astro) | `does ebay charge fees on shipping` | Informational | 2011 fee circumvention history and 3 actionable strategies to prevent postage loss. |
| **Fee Changes Changelog** | [`/fee-changes/`](file:///Users/vinodkumar/Desktop/playground/sellercalchub.com/src/pages/fee-changes.astro) | `marketplace fee changes 2026` | Freshness | Real-time changelog linking verified rates, official notices, and `<lastmod>` sitemap dates. |

---

## 3. The 6-Point Pre-Publish Checklist per Page

Every page must fulfill all six gates prior to deployment:

```
[ ] 1. RATE VERIFICATION GATE
    - Data stored in src/data/fees/*.json with official source_url and verified_on timestamp.
    - Zero placeholder rates, zero estimated percentages, zero TODO markers.
    - Rate updates verified against official marketplace help documentation.

[ ] 2. SEO METADATA & INTENT GATE
    - Title ≤ 60 characters with primary keyword positioned near front (character index ≤ 35).
    - Meta description ≤ 160 characters reading like ad copy with a soft call-to-action.
    - H1 tag is distinct word-for-word from title tag (strictly 1 <h1> per page).
    - Open Graph tags (og:title, og:description, og:url, og:image) defined.
    - Zero keyword cannibalization between calculators (tool intent) and guides (informational intent).

[ ] 3. STRUCTURED DATA (JSON-LD) GATE
    - WebApplication schema on all calculator pages with browserRequirements and applicationCategory.
    - BreadcrumbList schema on all nested pages with complete URL trails from Home.
    - FAQPage schema only where FAQs are visible on page and text matches exactly word-for-word.
    - Passes Google Rich Results Test validation with 0 errors and 0 warnings.

[ ] 4. CONTENT SUBSTANCE & THIN-CONTENT GUARD
    - Body text contains ≥ 300 words of unique substance (calculators average 1,200–1,700 words).
    - Includes formula explanation, 1 worked example with real numbers, and platform edge cases.
    - 3-gram shingle similarity against all existing pages is < 70% (no template-only clones).
    - Opening paragraph answers searcher intent directly in plain text with JS disabled.

[ ] 5. INTERNAL LINKING & INTEGRITY GATE
    - Every calculator links up to /marketplace-fee-calculators/ with descriptive anchor text.
    - Every calculator links across to its 2 nearest sibling tools in RelatedCalculators.
    - Every supporting eBay tool links to the core US pillar (/ebay-fee-calculator/).
    - Zero broken links (check-links passes 100%).
    - Zero orphan pages (all pages within ≤ 3 clicks of Home).

[ ] 6. ACCESSIBILITY, MOBILE & CORE WEB VITALS GATE
    - Mobile-first, fully responsive down to 320px viewport with no horizontal scroll.
    - Minimum 44×44px interactive tap targets for all buttons, inputs, and toggles.
    - Keyboard inputs declare inputmode="decimal" or inputmode="numeric" for mobile keypad.
    - WCAG AA contrast ratio ≥ 4.5:1 for normal text and ≥ 3.0:1 for large UI components.
    - Lighthouse Performance score ≥ 95 (LCP ≤ 2.5s, CLS = 0.000, INP ≤ 200ms on mobile throttling).
```

---

## 4. Automated Build & Verification Pipeline

Run the automated pre-publish verification suite before pushing any release branch:

```bash
# 1. Verify SEO Metadata Lengths, Duplicates, and Cannibalization
npm run lint:seo

# 2. Compile Static HTML (Astro SSG) and Run Thin-Content Guard
npm run build:prod

# 3. Execute Full Vitest Test Suite (29 test files, 293+ tests)
npm test

# 4. Verify Zero Broken Internal Links (1,768+ links inspected)
npm run check:links

# 5. Verify Target Launch Week (e.g. Week 1, 2, 3, or 4)
npx tsx scripts/verify-launch-week.ts --week=1
```
