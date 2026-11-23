# Contributing to Seller Calc Hub

Thank you for your interest in contributing to **Seller Calc Hub**! Our mission is to provide online resellers with the most accurate, transparent, and up-to-date marketplace fee and profit calculators on the internet.

To ensure absolute precision and reliability, all contributions to our calculation models, datasets, and documentation must adhere to the standards outlined below.

---

## 🛡️ Core Contribution Principles

1. **Zero Invented Rates**: We never guess, estimate, or invent platform fee percentages. Every rate, category tier, fixed charge, and promotional rule must be backed by an official primary documentation source URL.
2. **Strict Verification**: When modifying or adding a fee schedule, you must provide:
   - The direct URL to the official marketplace seller help page, terms of service update, or seller center announcement.
   - The exact date (`verified_on`) when you verified the rate against the documentation.
3. **Automated Test Coverage**: Any change to calculation logic must be accompanied by unit tests covering base fees, edge cases, category caps, and rounding boundaries.
4. **Clean Code & Mobile Responsiveness**: All code must conform to our TypeScript strictness, WCAG 2.1 AA accessibility guidelines, and zero layout shift standards.

---

## 📁 How Fee Data is Structured

Platform fee datasets are stored as structured JSON files inside `src/data/fees/`:

```
src/data/fees/
├── ebay-us.json        # eBay US final value fees, category tiers, store subscriber rates
├── ebay-uk.json        # eBay UK 0% private seller rules & business VAT tiers
├── whatnot.json        # Whatnot livestream commissions & smart shipping rules
├── tiktok-shop.json    # TikTok Shop referral fee categories & voucher rules
├── depop.json          # Depop 0% selling fee structure & payment processing
├── etsy.json           # Etsy transaction fees, listing renewals & Offsite Ads
├── twitch-bits.json    # Twitch Bits fixed streamer cashout rates
└── changelog.json      # Public changelog of verified rate adjustments
```

Each fee data file requires:
- `platform`: Identifier (e.g. `ebay-us`, `etsy`)
- `version`: Dataset version string
- `verified_on`: ISO date string (e.g. `2026-11-23`)
- `source_url`: Canonical URL to the platform's official fee page
- Detailed rate structures and category tiers

---

## 🧪 Local Development & Verification Workflow

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/sellercalchub.git
   cd sellercalchub
   npm install
   ```

2. **Make Your Changes**:
   - Update the respective fee JSON file in `src/data/fees/`.
   - Update calculation logic in `src/lib/calc/` if formulas changed.
   - Add a changelog entry to `src/data/fees/changelog.json`.

3. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```
   Ensure all 330+ unit tests pass.

4. **Run the Full Production Pipeline**:
   ```bash
   npm run build:prod
   ```
   This validates:
   - OG image generation
   - SEO metadata character lengths and zero-cannibalization rules
   - Astro static site compilation
   - Thin-content guard (> 300 words unique text per page)

5. **Verify Internal Links**:
   ```bash
   npm run check:links
   ```

---

## 📬 Submitting Fee Corrections Without Code

If you are an active seller who noticed a fee change but prefer not to submit a Pull Request, you can alert our editorial team directly:
- **Online Form**: [https://sellercalchub.com/contact/](https://sellercalchub.com/contact/)
- **Fee Reporting Tool**: [https://sellercalchub.com/report-fee/](https://sellercalchub.com/report-fee/)
- **Email**: Send the platform name, details, and official announcement link to `corrections@sellercalchub.com`.

Our editorial and engineering team reviews all submissions and typically deploys verified changes within 24 to 48 hours.

---

Thank you for helping keep marketplace fee calculations transparent and accurate for the entire online selling community!
