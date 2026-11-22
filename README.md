# Seller Calc Hub (`SellerCalcHub.com`)

Free, fast marketplace fee and profit calculators for resellers and online sellers: Whatnot, TikTok Shop, Depop, Etsy, eBay, and Twitch Bits. Users enter sale price and costs to see exactly what they keep.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `22.23.4` or higher
- npm

### Installation

```bash
npm install
```

### Development

Start the local Astro development server:

```bash
npm run dev
```

Or run Astro in background mode:

```bash
astro dev --background
```

Background server management:

- Status: `astro dev status`
- Logs: `astro dev logs`
- Stop: `astro dev stop`

### Build (Static Site Generation)

Build the production-ready static assets in `dist/`:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

### Code Quality & Formatting

Run ESLint:

```bash
npm run lint
npm run lint:fix
```

Run Prettier:

```bash
npm run format
npm run format:check
```

---

## 📐 Project Rules & Architecture

- **Static Output (SSG):** Ship zero or minimal JavaScript except interactive calculator islands.
- **Strict TypeScript:** Strictly typed, small focused modules, no unused dependencies.
- **Verified Fee Data Only:** Every platform fee rate is sourced from official documentation with `source_url` and `verified_on`.
- **Design System:** Strictly adhere to [`DESIGN.md`](./DESIGN.md) (NerdWallet-inspired high-trust financial utility, mint/green ladder, WCAG AA accessibility, mobile-first, dark mode).
- **Clean UX:** No popups, no interstitials, no autoplay, no layout shift.
