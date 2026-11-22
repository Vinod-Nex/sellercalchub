# Weekly Search & Performance Monitoring Checklist

> **Owner**: Vinod Kumar (me)  
> **Cadence**: Every Monday at 09:00 AM (30-Minute Review)  
> **Scope**: `SellerCalcHub.com` (GSC, Bing Webmaster Tools, Cloudflare Analytics)

---

## 1. 30-Minute Weekly Checklist

- [ ] **1. URL-Level Metrics & Indexing**: In Google Search Console (GSC) Performance report (filter: Last 7 Days vs Previous 7 Days), record:
  - **Impressions**, **Clicks**, and **Average Position** across all published calculator and guide URLs.
  - GSC **Page Indexing** report: verify 100% of sitemap URLs are indexed; confirm 0 unindexed errors.
- [ ] **2. Top Queries Review**:
  - Filter queries by Clicks and Impressions. Identify top 10 gaining and losing queries.
  - Identify emerging secondary keywords with >50 impressions to inform new FAQ items.
- [ ] **3. Low CTR Diagnostic (High Impressions, Low CTR)**:
  - Flag any page with $\ge 100$ impressions and CTR $< 2.5\%$ (ranking in top 15).
  - **Immediate Action**: Rewrite `<title>` (stronger hook/benefit) and `<meta name="description">` (actionable CTA, verified rate highlight) in `src/data/seo/pages.json`.
- [ ] **4. Unindexed Pages (Inspect & Fix)**:
  - Check for URLs marked *“Discovered – currently not indexed”* or *“Crawled – currently not indexed”*.
  - **Action**: Run live URL inspection in GSC; check internal link count; ping Bing/Yandex via `npm run indexnow:ping`; click **Request Indexing**.

---

## 2. Decision Rules (Week 6 & Week 8 Triage Matrix)

| Criteria | Search Metric Threshold | Required Action |
|:---|:---|:---|
| **Expand (Striking Distance)** | **Rank 8 to 20** (steady impressions) | Expand page content by +250–400 words. Add 2 worked examples for secondary queries, answer high-impression queries in FAQ, and add 3 contextual internal links. |
| **Rewrite (Intent Mismatch)** | **Rank > 30** (stuck after 6 weeks) | Full on-page rewrite. Audit top 3 competitors for search intent; realign H1/H2s, title, and formula blocks to match user intent directly. |
| **Cut (Dead Weight Prune)** | **0 Impressions after 8 weeks** | Evaluate utility. If zero search demand, consolidate unique content into the parent hub and issue a 301 redirect to keep crawl budget focused on winning pages. |

---

## 3. Weekly Log Template

| Week | Date | Clicks | Impressions | Avg Pos | Indexed URLs | Action Items Completed | Owner Sign-Off |
|:---|:---|:---|:---|:---|:---|:---|:---|
| W1 | 2026-11-23 | | | | /13 | GSC sitemap submitted; IndexNow pinged | Vinod Kumar (me) |
| W2 | 2026-11-30 | | | | /13 | | Vinod Kumar (me) |
| W3 | 2026-12-07 | | | | /21 | | Vinod Kumar (me) |
| W4 | 2026-12-14 | | | | /26 | | Vinod Kumar (me) |
| W5 | 2026-12-21 | | | | /26 | Pre-decision audit | Vinod Kumar (me) |
| W6 | 2026-12-28 | | | | /26 | **Execute Week 6 Decision Rules** (Expand / Rewrite) | Vinod Kumar (me) |
| W8 | 2027-01-11 | | | | /26 | **Execute Week 8 Decision Rules** (Cut 0-impression URLs) | Vinod Kumar (me) |
