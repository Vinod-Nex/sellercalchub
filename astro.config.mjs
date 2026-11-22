// @ts-check
import { defineConfig } from "astro/config";
import sitemap, { ChangeFreqEnum } from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

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
        // Filter demo or internal pages
        if (/(inputs-demo|design-tokens)/.test(item.url)) {
          return undefined;
        }
        // Set ISO lastmod date
        item.lastmod = new Date("2026-11-22T00:00:00.000Z").toISOString();
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
          const fs = await import("node:fs/promises");
          const indexPath = new URL("sitemap-index.xml", dir);
          const targetPath = new URL("sitemap.xml", dir);
          try {
            await fs.copyFile(indexPath, targetPath);
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
