// @ts-check
import { defineConfig } from "astro/config";
import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

/**
 * Loads verified_on dates dynamically from fee data JSON files.
 * Provides real lastmod timestamps tied to fee freshness audits.
 */
function getFeeDates() {
  const feesDir = path.resolve("./src/data/fees");
  /** @type {Record<string, string>} */
  const dates = {};
  let latestDate = "2026-01-01";

  const files = [
    "ebay-us.json",
    "ebay-uk.json",
    "etsy.json",
    "whatnot.json",
    "tiktok-shop.json",
    "depop.json",
    "twitch-bits.json",
  ];

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(feesDir, file), "utf8"));
      const verified = content.verified_on || content.last_updated || "2026-11-22";
      const key = file.replace(".json", "");
      dates[key] = verified;
      if (verified > latestDate) {
        latestDate = verified;
      }
    } catch {
      // Fallback
    }
  }

  return { dates, latestDate };
}

const { dates: feeDates, latestDate: latestFeeDate } = getFeeDates();

/**
 * Maps a canonical URL to its verified fee data date.
 * @param {string} url
 */
function getUrlLastmod(url) {
  if (/ebay-fee-calculator-uk/.test(url)) {
    return feeDates["ebay-uk"] || latestFeeDate;
  }
  if (/ebay/.test(url)) {
    return feeDates["ebay-us"] || latestFeeDate;
  }
  if (/etsy/.test(url)) {
    return feeDates["etsy"] || latestFeeDate;
  }
  if (/whatnot/.test(url)) {
    return feeDates["whatnot"] || latestFeeDate;
  }
  if (/tiktok/.test(url)) {
    return feeDates["tiktok-shop"] || latestFeeDate;
  }
  if (/depop/.test(url)) {
    return feeDates["depop"] || latestFeeDate;
  }
  if (/twitch|bits/.test(url)) {
    return feeDates["twitch-bits"] || latestFeeDate;
  }
  // Hub, Home, Methodology, and informational pages use latest verified fee date
  return latestFeeDate;
}

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://sellercalchub.com",
  trailingSlash: "always",
  redirects: {
    "/twitch-bits-calculator/": "/twitch-bits-to-usd/",
    "/ebay-uk-fee-calculator/": "/ebay-fee-calculator-uk/",
  },
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    sitemap({
      serialize(item) {
        // Exclude demo, internal dev, 404, or non-indexable routes
        if (/(inputs-demo|design-tokens|404)/.test(item.url)) {
          return undefined;
        }

        // Only canonical trailing-slash URLs (reject query-param or fragmented states)
        if (!item.url.endsWith("/") || item.url.includes("?") || item.url.includes("#")) {
          return undefined;
        }

        // Set ISO lastmod date derived directly from real fee data verified_on dates
        const lastmodDate = getUrlLastmod(item.url);
        item.lastmod = new Date(`${lastmodDate}T00:00:00.000Z`).toISOString();

        if (item.url === "https://sellercalchub.com/") {
          item.priority = 1.0;
          item.changefreq = ChangeFreqEnum.WEEKLY;
        } else if (/calculator|bits/.test(item.url)) {
          item.priority = 0.9;
          item.changefreq = ChangeFreqEnum.WEEKLY;
        } else {
          item.priority = 0.7;
          item.changefreq = ChangeFreqEnum.MONTHLY;
        }
        return item;
      },
    }),
    {
      name: "sitemap-copy-hook",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          const fsPromises = await import("node:fs/promises");
          const indexPath = new URL("sitemap-index.xml", dir);
          const targetPath = new URL("sitemap.xml", dir);
          try {
            await fsPromises.copyFile(indexPath, targetPath);
            console.log("[sitemap-copy-hook] Created sitemap.xml from sitemap-index.xml");
          } catch (err) {
            console.error("[sitemap-copy-hook] Error copying sitemap.xml:", err);
          }
        },
      },
    },
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
