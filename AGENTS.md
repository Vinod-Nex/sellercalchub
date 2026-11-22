# Project Brief: Seller Calc Hub

I have initialized a new Astro project. Use the `astro-docs` MCP and the `tailwind-4-docs` skill for all code. Follow `@DESIGN.md` for the visual design.

- **Name:** Seller Calc Hub
- **Domain:** SellerCalcHub.com
- **Description:** Free, fast marketplace fee and profit calculators for resellers and online sellers: Whatnot, TikTok Shop, Depop, Etsy, eBay and Twitch Bits. Users enter sale price and costs and see exactly what they keep. English only for now, but keep routing ready for more languages later.

## Competitors for Reference Only
- `ebayfeescalculator.com`
- `yotpo.com/tools/ebay-fee-calculator`
- `salest.io/free-tools/amazon-profit-calculator`
- `flowlister.com/tools/fee-calculator`
- `alura.io/tools/etsy-profit-calculator`

*Study what features they have, then make ours better. Do not copy their design, layout, code or text.*

## Rules for Every Phase
- **Static output (SSG):** Ship almost no JavaScript except the calculator islands.
- **TypeScript strict:** Small files. No unused dependencies.
- **NEVER invent fee rates:** Every rate lives in a data file with `source_url` and `verified_on`. If you do not have an official source, write `TODO` and stop.
- **Mobile first, dark mode, accessible (WCAG AA):** Follow `@DESIGN.md` for the visual design system.
- **Clean UX:** No popups, no interstitials, no autoplay, no layout shift.
- **Commit discipline:** Commit after each phase with a clear message.

## Development & Tooling
- **Docs MCP:** Use `astro-docs` MCP server (`search_astro_docs`).
- **Styling Skill:** Use `tailwind-4-docs` skill.
- **Background Dev Server:** When starting the dev server, use `astro dev --background` (managed via `astro dev stop`, `astro dev status`, and `astro dev logs`).
