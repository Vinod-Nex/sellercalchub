import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function findHtmlFiles(dir: string): string[] {
  let results: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

describe('Google Tag Manager / Google Analytics (GTM-WM6KDVJP)', () => {
  it('places exactly one GTM-WM6KDVJP snippet immediately after <head> on every built HTML page', () => {
    const htmlFiles = findHtmlFiles(DIST_DIR).filter((file) => {
      const html = fs.readFileSync(file, 'utf-8');
      return !html.includes('<meta http-equiv="refresh"');
    });

    expect(htmlFiles.length).toBeGreaterThan(20);

    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf-8');
      const rel = file.replace(DIST_DIR, '');

      // Must appear immediately after <head>
      expect(
        html,
        `${rel} must place GTM-WM6KDVJP script immediately after <head>`
      ).toMatch(/<head>\s*<script[^>]*src="https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-WM6KDVJP"[^>]*>/i);

      // Must appear strictly once per page (prevent duplicate tags)
      const occurrences = html.match(/GTM-WM6KDVJP/g) ?? [];
      expect(
        occurrences.length,
        `${rel} must contain GTM-WM6KDVJP strictly once, found ${occurrences.length}`
      ).toBe(1);

      // Must include gtag initialization snippet
      expect(html, `${rel} must include gtag/dataLayer init`).toContain('window.dataLayer');
      expect(html, `${rel} must include gtag call`).toContain("gtag('js', new Date())");
    }
  });
});
