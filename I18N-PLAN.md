# Internationalization (i18n) Strategy & Implementation Plan

> **Core Mandate**: Prepare the architecture for complete internationalization without translating or shipping unverified machine-translated content. 
> 
> **Zero-Refactor Rule**: Adding a new language requires **data and strings only**. No components, mathematical formulas, state hooks, or layout architectures ever need to be refactored to support a new language.

---

## 1. Local Semrush Keyword Analysis (PT, ES, FR)

The following tables are pulled directly from our local Semrush keyword database (`keyword-plan-ranked.xlsx`, Sheets 3, 4, and 5).

### A. Portuguese (Brazil & Portugal)
*Source: `keyword-plan-ranked.xlsx` (Sheet: Portuguese)*

| Priority | Planned Page Route | Target Keyword | English Source Keyword | Baseline Searches (US/UK) | Local Status |
|:---|:---|:---|:---|:---|:---|
| 1 | `/pt/calculadora-taxas-ebay/` | `calculadora de taxas do ebay` | ebay fees calculator | 5,400 | Unverified: pull BR/PT Semrush volume |
| 2 | `/pt/calculadora-taxas-ebay/` | `calculadora de tarifas ebay` | ebay calculator fee | 4,400 | Unverified: pull BR/PT Semrush volume |
| 3 | `/pt/calculadora-taxas-ebay/` | `calcular taxas do ebay` | calculate ebay fees | 1,000 | Unverified: pull BR/PT Semrush volume |
| 4 | `/pt/calculadora-taxa-valor-final-ebay/` | `calculadora de taxa de valor final ebay` | ebay final value fee calculator | 480 | Unverified: pull BR/PT Semrush volume |
| 5 | `/pt/calculadora-lucro-ebay/` | `calculadora de lucro ebay depois das taxas` | ebay after fees calculator | 110 | Unverified: pull BR/PT Semrush volume |
| 6 | `/pt/calculadora-taxas-ebay-paypal/` | `calculadora de taxas ebay e paypal` | ebay and paypal fee calculator | 210 | Unverified: pull BR/PT Semrush volume |
| 7 | `/pt/calculadora-taxas-etsy/` | `calculadora de taxas etsy` | etsy fees calculator | 390 | Unverified: pull BR/PT Semrush volume |
| 8 | `/pt/calculadora-taxas-whatnot/` | `calculadora de taxas whatnot` | whatnot fee calculator | 590 | Unverified: pull BR/PT Semrush volume |
| 9 | `/pt/calculadora-taxas-tiktok-shop/` | `calculadora de taxas tiktok shop` | tiktok shop fee calculator | 170 | Unverified: pull BR/PT Semrush volume |
| 10 | `/pt/bits-twitch-para-reais/` | `converter bits da twitch para reais` | twitch bits to usd | 1,000 | High intent in Brazil (BRL) |
| 11 | `/pt/bits-twitch-para-euros/` | `bits da twitch para euros (Portugal)` | twitch bits to usd | 1,000 | High intent in Portugal (EUR) |
| 12 | `/pt/calculadora-taxas-mercado-livre/` | `calculadora de taxas mercado livre` | (no English source) | High (BR) | Major local platform in Brazil |
| 13 | `/pt/calculadora-shopee/` | `calculadora shopee` | (no English source) | High (BR) | Major local marketplace |

---

### B. Spanish (Spain & Latin America)
*Source: `keyword-plan-ranked.xlsx` (Sheet: Spanish)*

| Priority | Planned Page Route | Target Keyword | English Source Keyword | Baseline Searches (US/UK) | Local Status |
|:---|:---|:---|:---|:---|:---|
| 1 | `/es/calculadora-comisiones-ebay/` | `calculadora de comisiones ebay` | ebay fees calculator | 5,400 | Unverified: pull ES/MX Semrush volume |
| 2 | `/es/calculadora-comisiones-ebay/` | `calculadora de tarifas ebay` | ebay calculator fee | 4,400 | Unverified: pull ES/MX Semrush volume |
| 3 | `/es/calculadora-comisiones-ebay/` | `calcular comisiones de ebay` | calculate ebay fees | 1,000 | Unverified: pull ES/MX Semrush volume |
| 4 | `/es/calculadora-comision-valor-final-ebay/` | `calculadora de comisión de valor final ebay` | ebay final value fee calculator | 480 | Unverified: pull ES/MX Semrush volume |
| 5 | `/es/calculadora-beneficio-ebay/` | `calculadora de beneficio ebay después de comisiones` | ebay after fees calculator | 110 | Unverified: pull ES/MX Semrush volume |
| 6 | `/es/calculadora-comisiones-ebay-paypal/` | `calculadora de comisiones ebay y paypal` | ebay and paypal fee calculator | 210 | Unverified: pull ES/MX Semrush volume |
| 7 | `/es/calculadora-comisiones-etsy/` | `calculadora de comisiones etsy` | etsy fees calculator | 390 | Unverified: pull ES/MX Semrush volume |
| 8 | `/es/calculadora-comisiones-whatnot/` | `calculadora de comisiones whatnot` | whatnot fee calculator | 590 | Unverified: pull ES/MX Semrush volume |
| 9 | `/es/calculadora-comisiones-tiktok-shop/` | `calculadora de comisiones tiktok shop` | tiktok shop fee calculator | 170 | Unverified: pull ES/MX Semrush volume |
| 10 | `/es/bits-twitch-a-euros/` | `convertir bits de twitch a euros` | twitch bits to usd | 1,000 | High intent in Spain (EUR) |
| 11 | `/es/bits-twitch-a-dolares/` | `convertir bits de twitch a dólares` | twitch bits to usd | 1,000 | High intent in LATAM (USD) |
| 12 | `/es/calculadora-comisiones-wallapop/` | `calculadora de comisiones wallapop` | (no English source) | High (ES) | Dominant C2C app in Spain |
| 13 | `/es/calculadora-comisiones-mercado-libre/` | `calculadora de comisiones mercado libre` | (no English source) | High (MX/AR) | Dominant marketplace in LATAM |

---

### C. French (France, Belgium, Switzerland)
*Source: `keyword-plan-ranked.xlsx` (Sheet: French)*

| Priority | Planned Page Route | Target Keyword | English Source Keyword | Baseline Searches (US/UK) | Local Status |
|:---|:---|:---|:---|:---|:---|
| 1 | `/fr/calculateur-frais-ebay/` | `calculateur frais ebay` | ebay fees calculator | 5,400 | Unverified: pull FR Semrush volume |
| 2 | `/fr/calculateur-frais-ebay/` | `simulateur frais ebay` | ebay calculator fee | 4,400 | Unverified: pull FR Semrush volume |
| 3 | `/fr/calculateur-frais-ebay/` | `calculer les frais ebay` | calculate ebay fees | 1,000 | Unverified: pull FR Semrush volume |
| 4 | `/fr/calculateur-frais-valeur-finale-ebay/` | `calculateur frais de valeur finale ebay` | ebay final value fee calculator | 480 | Unverified: pull FR Semrush volume |
| 5 | `/fr/calculateur-benefice-ebay/` | `calculateur bénéfice ebay après frais` | ebay after fees calculator | 110 | Unverified: pull FR Semrush volume |
| 6 | `/fr/calculateur-frais-ebay-paypal/` | `calculateur frais ebay et paypal` | ebay and paypal fee calculator | 210 | Unverified: pull FR Semrush volume |
| 7 | `/fr/calculateur-frais-etsy/` | `calculateur frais etsy` | etsy fees calculator | 390 | Unverified: pull FR Semrush volume |
| 8 | `/fr/calculateur-frais-whatnot/` | `calculateur frais whatnot` | whatnot fee calculator | 590 | Unverified: pull FR Semrush volume |
| 9 | `/fr/calculateur-frais-tiktok-shop/` | `calculateur frais tiktok shop` | tiktok shop fee calculator | 170 | Unverified: pull FR Semrush volume |
| 10 | `/fr/bits-twitch-en-euros/` | `bits twitch en euros` | twitch bits to usd | 1,000 | High intent in France (EUR) |
| 11 | `/fr/calculateur-frais-leboncoin/` | `calculateur frais leboncoin` | (no English source) | High (FR) | Dominant marketplace in France |
| 12 | `/fr/calculateur-frais-vinted/` | `calculateur frais vinted (protection)` | (no English source) | High (FR) | Major European second-hand platform |

---

## 2. Decision Rules: Build Only Verified Volume

Per project rules, **we build only languages where volume is independently verified**:

1. **Volume Threshold Rule**:
   - A language subpath (e.g. `/pt/` or `/es/`) will **NOT** be published until its core calculator keywords achieve $\ge 250$ verified monthly searches in Semrush's local database (BR for Brazil, ES for Spain, FR for France).
2. **Keyword Difficulty (KD) Rule**:
   - The primary keyword cluster must have $\text{KD} \le 35$ (Tier 1 or Tier 2). If local competitors hold all SERP slots with KD $> 50$, defer building until domain authority increases.
3. **Official Data Source Rule**:
   - A localized calculator will only be created if the marketplace operates an official regional entity with a published, verifiable fee schedule in that language (e.g. `ebay.es`, `ebay.fr`, `mercadolivre.com.br`). Never invent exchange rates or local fee rules.

---

## 3. The "Data & Strings Only" Architecture

Our architecture guarantees that adding a language requires **zero code refactoring**:

```
Adding a Language:
  1. src/i18n/dictionaries/<locale>.ts  ──> UI text strings
  2. src/data/fees/<platform>-<locale>.json ──> Verified rate data
  3. src/i18n/slugs.ts                 ──> Localized URL mappings
  4. ENABLE_I18N=true                  ──> Flag turns on routes & hreflang
  ───────────────────────────────────────────────────────────────────
  RESULT: Complete localized calculator runs with ZERO component refactoring!
```

### Component Decoupling Proof
- **Mathematical Models** (`src/lib/calc/*.ts`): Pure functions operating on abstract numeric fee tiers and currency symbols.
- **Calculator Island** (`src/components/CalculatorIsland.astro`): Takes `locale` and `platform` as props, sourcing UI labels from `useTranslations(locale)` and fee data from `getPlatformFeeData(platform, locale)`.
- **Hreflang Generator** (`src/i18n/index.ts`): Automatically emits reciprocal `<link rel="alternate" hreflang="..." />` and `<link rel="alternate" hreflang="x-default" ...>` tags without manual template editing.
