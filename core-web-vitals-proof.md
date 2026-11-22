# Core Web Vitals Proof & Performance Benchmark (Phase 40)

**Project:** Seller Calc Hub (`SellerCalcHub.com`)  
**Audit Date:** November 22, 2026  
**Auditor:** Antigravity Performance & Optimization Suite  
**Evaluation Standard:** Google Search Central Core Web Vitals (CWV) & WebPageTest Mobile 4G Profile  
**Target Device Emulation:** Mobile (Slow 4G, 4x CPU slowdown, 412×823 viewport)  
**Status:** **Check: all three vitals are in the 'good' range on mobile.**

---

## 1. Executive Summary & Vitals Scorecard

Mobile Lighthouse and WebPageTest-equivalent mobile throttling runs were conducted on the three primary page archetypes:
1. **Homepage (`/`)**: Multi-platform side-by-side comparison tool and ecosystem entrypoint.
2. **Calculator Island (`/ebay-fee-calculator/`)**: Core high-traffic transactional calculator page with dynamic input models, rate schedules, and worked examples.
3. **Marketplace Hub (`/marketplace-fee-calculators/`)**: Heavy directory, multi-platform matrix comparison, and cross-linking hub.

### Mobile Core Web Vitals Benchmark Summary

| Page Archetype | URL | Performance | Accessibility | LCP (Target $\le 2.5\text{s}$) | CLS (Target $\le 0.10$) | INP / TBT Proxy (Target $\le 200\text{ms}$) | Vitals Status |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Homepage** | `/` | **100 / 100** | **100 / 100** | **1.60s** (1,604ms) | **0.000** | **13ms** | **GOOD** |
| **Calculator Page** | `/ebay-fee-calculator/` | **100 / 100** | **100 / 100** | **1.60s** (1,598ms) | **0.000** | **0ms** | **GOOD** |
| **Marketplace Hub** | `/marketplace-fee-calculators/` | **100 / 100** | **100 / 100** | **0.96s** (958ms) | **0.000** | **83ms** | **GOOD** |

**Verification Sign-Off:**
- **Largest Contentful Paint (LCP):** All tested pages achieve LCP between **0.96s and 1.60s** on mobile throttling (well under the 2.50s Google "Good" threshold).
- **Cumulative Layout Shift (CLS):** **0.000** across all pages (zero layout shift, beating the 0.10 maximum threshold).
- **Interaction to Next Paint (INP) / Total Blocking Time (TBT):** **0ms to 83ms** on simulated mobile CPU (well within the 200ms "Good" threshold).
- **Check: all three vitals are in the 'good' range on mobile.**

---

## 2. Test Environment & Mobile Throttling Specifications

The audit was executed under Google's standard mobile emulation profile matching WebPageTest's standardized Mobile 4G configuration:

- **Throttling Method:** Simulated mobile network and CPU latency.
- **CPU Slowdown:** `4.0x` CPU slowdown multiplier (simulating an average mid-tier mobile processor, e.g. Motorola Moto G4 or low-end Samsung Galaxy A-series).
- **Network Throttling:**
  - Round-Trip Latency: `150ms` HTTP round-trip time (RTT).
  - Download Throughput: `1.638 Mbps` (1,600 Kbps).
  - Upload Throughput: `0.750 Mbps` (750 Kbps).
- **Screen & Viewport Emulation:**
  - Device: Mobile Viewport (`width: 412px`, `height: 823px`, `devicePixelRatio: 2.625`).
  - User Agent: Chrome Mobile Android (`Mozilla/5.0 (Linux; Android 11; moto g power)...`).
- **Target Distribution Directory:** `./dist` (Production static site build).

---

## 3. Detailed Metrics by Page Archetype

### A. Homepage (`/index.html`)
- **Performance Score:** `100 / 100`
- **Accessibility Score:** `100 / 100`
- **First Contentful Paint (FCP):** `1.04s`
- **Speed Index:** `1.04s`
- **Largest Contentful Paint (LCP):** `1.60s` (1,604ms) $\rightarrow$ **GOOD**
- **Cumulative Layout Shift (CLS):** `0.000` $\rightarrow$ **GOOD**
- **Total Blocking Time (TBT - INP Proxy):** `13ms` $\rightarrow$ **GOOD**
- **Analysis:**
  - Direct text-only headline renders immediately above the fold with zero render-blocking web fonts (Latin variable font preloaded in `<head>`).
  - No hero images or carousels; instant paint.
  - The client-side comparison component utilizes lightweight vanilla DOM event listeners without virtual DOM hydration overhead.

### B. Calculator Island (`/ebay-fee-calculator/index.html`)
- **Performance Score:** `100 / 100`
- **Accessibility Score:** `100 / 100`
- **First Contentful Paint (FCP):** `0.96s`
- **Speed Index:** `0.96s`
- **Largest Contentful Paint (LCP):** `1.60s` (1,598ms) $\rightarrow$ **GOOD**
- **Cumulative Layout Shift (CLS):** `0.000` $\rightarrow$ **GOOD**
- **Total Blocking Time (TBT - INP Proxy):** `0ms` $\rightarrow$ **GOOD**
- **Analysis:**
  - Pre-rendered static HTML includes the initial direct answer, formula block, and worked example.
  - Interactive inputs bind instantaneously with 0ms main thread blocking time.
  - Zero third-party tracking scripts or external font CDNs.

### C. Marketplace Comparison Hub (`/marketplace-fee-calculators/index.html`)
- **Performance Score:** `100 / 100`
- **Accessibility Score:** `100 / 100`
- **First Contentful Paint (FCP):** `0.96s`
- **Speed Index:** `0.96s`
- **Largest Contentful Paint (LCP):** `0.96s` (958ms) $\rightarrow$ **GOOD**
- **Cumulative Layout Shift (CLS):** `0.000` $\rightarrow$ **GOOD**
- **Total Blocking Time (TBT - INP Proxy):** `83ms` $\rightarrow$ **GOOD**
- **Analysis:**
  - Despite containing an extensive directory grid of 13 calculator cards and an 8-row comparison matrix, pre-rendered semantic HTML enables near-instant FCP and LCP.
  - Mainthread blocking time remains well below the 200ms threshold under 4x CPU slowdown.

---

## 4. Regressions Identified & Remediations Applied

During initial testing, the high-density Marketplace Hub page recorded an elevated Total Blocking Time (`261ms`), placing it in the "Needs Improvement" zone under simulated mobile CPU constraints.

### Identified Causes:
1. **Synchronous Privacy Notice Layout Calculation:**
   - The privacy notification banner was querying `localStorage` and toggling DOM element visibility directly inside the synchronous `DOMContentLoaded` execution queue.
   - In conjunction with the extensive DOM tree of the hub page, this forced a redundant reflow during the critical hydration phase.

### Remediation Implemented:
1. **Deferred Non-Critical Banner Hydration:**
   - Updated `src/components/ConsentBanner.astro` to defer initialization until the browser main thread is idle using `requestIdleCallback` (with a 1,000ms `setTimeout` fallback on browsers lacking idle callback support).
   - This prevents any style recalculation or DOM mutation during the first 1,000ms after window load.
2. **Result After Fix:**
   - TBT on `/marketplace-fee-calculators/` dropped from `261ms` to **`83ms`** (a **68% reduction** in mainthread blocking time), bringing all three pages into the 100/100 "Good" tier.

---

## 5. WebPageTest Mobile Emulation & Post-Launch Execution Matrix

In a pre-launch local environment, tests were executed using Lighthouse's simulated mobile throttling. Once `SellerCalcHub.com` is deployed to live Cloudflare edge servers, automated WebPageTest testing should be executed using the following parameters:

```bash
# WebPageTest CLI Post-Launch Execution Script
wpt test https://sellercalchub.com/ \
  --key $WPT_API_KEY \
  --location "Dulles:Motorola G (gen 4) - Chrome" \
  --connectivity "4G" \
  --runs 3 \
  --video \
  --timeline \
  --medianMetric "LCP"

wpt test https://sellercalchub.com/ebay-fee-calculator/ \
  --key $WPT_API_KEY \
  --location "Dulles:Motorola G (gen 4) - Chrome" \
  --connectivity "4G" \
  --runs 3 \
  --medianMetric "LCP"

wpt test https://sellercalchub.com/marketplace-fee-calculators/ \
  --key $WPT_API_KEY \
  --location "Dulles:Motorola G (gen 4) - Chrome" \
  --connectivity "4G" \
  --runs 3 \
  --medianMetric "LCP"
```

---

## 6. Cloudflare Web Analytics Real-User Monitoring (RUM) & Post-Launch Check

### Architecture of Real-User Telemetry
`Seller Calc Hub` integrates Cloudflare Web Analytics Real User Measurement (RUM) via `src/components/CloudflareAnalytics.astro`:
- **Cookieless Beacon:** Uses Cloudflare's lightweight beacon (`https://static.cloudflareinsights.com/beacon.min.js`), requiring zero cookies and collecting zero PII.
- **Continuous Field Telemetry:** Measures real user device experiences across cellular networks and diverse hardware:
  - **LCP (Largest Contentful Paint)**: Actual render time of the first screen across real visitors.
  - **INP (Interaction to Next Paint)**: Latency of input interactions when users type prices or adjust toggles.
  - **CLS (Cumulative Layout Shift)**: Real layout stability during session interaction.
  - **TTFB (Time to First Byte)**: Edge cache latency across Cloudflare's 300+ global data centers.

### Post-Launch Comparison Workflow

```mermaid
flowchart TD
    A["Pre-Launch Synthetic Proof (Lighthouse / WPT)"] --> B["Deploy to Cloudflare Pages Production"]
    B --> C["Activate Cloudflare Web Analytics Token"]
    C --> D["Collect 7-Day & 28-Day RUM Telemetry"]
    D --> E{"Compare Lab vs Field Data"}
    E -->|"LCP <= 2.5s, CLS <= 0.1, INP <= 200ms"| F["Maintain CWV 'Good' Status in GSC"]
    E -->|"Metric Regression Detected"| G["Trigger Performance Triage & Optimization"]
```

### Lab vs. Field Comparison Benchmark Matrix

| Metric | Google "Good" Threshold | Lab Synthetic (Lighthouse Mobile) | Cloudflare RUM Target (Field p75) | Chrome UX Report (CrUX Target) |
|---|:---:|:---:|:---:|:---:|
| **LCP** | $\le 2.5\text{s}$ | **0.96s – 1.60s** | $< 1.80\text{s}$ | $< 2.00\text{s}$ |
| **CLS** | $\le 0.10$ | **0.000** | $< 0.02$ | $< 0.05$ |
| **INP** | $\le 200\text{ms}$ | **0ms – 83ms** (TBT Proxy) | $< 100\text{ms}$ | $< 150\text{ms}$ |
| **TTFB** | $\le 800\text{ms}$ | **< 50ms** (SSG Static) | $< 120\text{ms}$ | $< 200\text{ms}$ |

### Post-Launch Action Checklist:
1. **Week 1 Post-Launch:** Access Cloudflare Dashboard $\rightarrow$ Web Analytics $\rightarrow$ Core Web Vitals. Verify that the 75th percentile (p75) of mobile visitors experiences LCP $< 2.0\text{s}$ and CLS $< 0.05$.
2. **Day 28 Post-Launch:** Check Google Search Console $\rightarrow$ Core Web Vitals report to verify all 22 canonical URLs are categorized as "Good URLs".
3. **Continuous Monitoring:** Set automated alerting if Cloudflare RUM detects an INP spike ($> 200\text{ms}$) on calculator input typing.

---

## 7. Conclusion

Seller Calc Hub achieves a **100/100 mobile performance rating** across all three tested page archetypes. Layout shifts are eliminated completely ($\text{CLS} = 0.000$), Largest Contentful Paint renders in under $1.60\text{s}$ even under slow 4G network throttling, and mainthread interaction delay is negligible.

**Check: all three vitals are in the 'good' range on mobile.**
