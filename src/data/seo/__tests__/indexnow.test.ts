import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  INDEXNOW_KEY,
  SITE_HOST,
  KEY_LOCATION,
  buildIndexNowPayload,
  getChangedFeeUrls,
  submitToIndexNow,
  PLATFORM_URLS,
} from '../../../../scripts/ping-indexnow';
import { handleIndexNowRequest } from '../../../lib/indexnow-worker';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

describe('Phase 45: IndexNow Protocol & Search Engine Integration', () => {
  it('validates IndexNow key files exist and match specification', () => {
    const keyFile = path.join(PUBLIC_DIR, `${INDEXNOW_KEY}.txt`);
    const backupKeyFile = path.join(PUBLIC_DIR, 'indexnow-key.txt');

    expect(fs.existsSync(keyFile), `${INDEXNOW_KEY}.txt must exist in public/`).toBe(true);
    expect(fs.existsSync(backupKeyFile), 'indexnow-key.txt must exist in public/').toBe(true);

    const keyContent = fs.readFileSync(keyFile, 'utf-8').trim();
    expect(keyContent).toBe(INDEXNOW_KEY);
    expect(keyContent.length).toBe(32); // 32 hex chars
  });

  it('builds compliant IndexNow JSON payload according to indexnow.org standard', () => {
    const sampleUrls = [
      `https://${SITE_HOST}/fee-changes/`,
      `https://${SITE_HOST}/ebay-fee-calculator/`,
    ];

    const payload = buildIndexNowPayload(sampleUrls);

    expect(payload.host).toBe(SITE_HOST);
    expect(payload.key).toBe(INDEXNOW_KEY);
    expect(payload.keyLocation).toBe(KEY_LOCATION);
    expect(payload.urlList).toEqual(sampleUrls);
    expect(payload.urlList.length).toBe(2);
  });

  it('derives accurate changed fee URLs from platform mapping and changelog', () => {
    // 1. Single platform test
    const ebayUrls = getChangedFeeUrls({ platform: 'ebay-us' });
    expect(ebayUrls).toContain(`https://${SITE_HOST}/fee-changes/`);
    expect(ebayUrls).toContain(`https://${SITE_HOST}/ebay-fee-calculator/`);
    expect(ebayUrls).toContain(`https://${SITE_HOST}/ebay-shipping-fee-calculator/`);

    // 2. All platforms test
    const allUrls = getChangedFeeUrls({ all: true });
    expect(allUrls.length).toBeGreaterThan(10);
    expect(allUrls).toContain(`https://${SITE_HOST}/whatnot-fee-calculator/`);
    expect(allUrls).toContain(`https://${SITE_HOST}/depop-fee-calculator/`);
    expect(allUrls).toContain(`https://${SITE_HOST}/tiktok-shop-fee-calculator/`);
    expect(allUrls).toContain(`https://${SITE_HOST}/twitch-bits-to-usd/`);

    // 3. Default changelog-driven derivation
    const defaultUrls = getChangedFeeUrls();
    expect(defaultUrls).toContain(`https://${SITE_HOST}/fee-changes/`);
    expect(defaultUrls).toContain(`https://${SITE_HOST}/marketplace-fee-calculators/`);
    expect(defaultUrls.length).toBeGreaterThanOrEqual(2);
  });

  it('verifies submitToIndexNow succeeds in dryRun mode', async () => {
    const urls = [`https://${SITE_HOST}/fee-changes/`];
    const payload = buildIndexNowPayload(urls);

    const result = await submitToIndexNow(payload, { dryRun: true });
    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.message).toContain('Dry Run');
  });

  it('verifies Cloudflare Worker endpoint (handleIndexNowRequest)', async () => {
    // 1. Method Not Allowed
    const getReq = new Request('https://sellercalchub.com/api/indexnow', { method: 'GET' });
    const getRes = await handleIndexNowRequest(getReq);
    expect(getRes.status).toBe(405);

    // 2. Unauthorized without secret if secret configured
    const postReq = new Request('https://sellercalchub.com/api/indexnow', {
      method: 'POST',
      body: JSON.stringify({ urls: [`https://${SITE_HOST}/fee-changes/`] }),
    });
    const unauthRes = await handleIndexNowRequest(postReq, { INDEXNOW_WEBHOOK_SECRET: 'super-secret-key' });
    expect(unauthRes.status).toBe(401);

    // 3. Authorized request (simulated with mock fetch)
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      const authReq = new Request('https://sellercalchub.com/api/indexnow', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer super-secret-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: [`https://${SITE_HOST}/fee-changes/`] }),
      });

      const authRes = await handleIndexNowRequest(authReq, { INDEXNOW_WEBHOOK_SECRET: 'super-secret-key' });
      expect(authRes.status).toBe(200);
      const data = await authRes.json();
      expect(data.success).toBe(true);
      expect(data.submittedUrls).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('validates sitemaps are ready for Google Search Console and Bing Webmaster Tools', () => {
    const sitemapIndex = path.join(DIST_DIR, 'sitemap-index.xml');
    const sitemapDirect = path.join(DIST_DIR, 'sitemap.xml');

    expect(fs.existsSync(sitemapIndex), 'sitemap-index.xml must exist in dist/').toBe(true);
    expect(fs.existsSync(sitemapDirect), 'sitemap.xml must exist in dist/').toBe(true);

    const indexContent = fs.readFileSync(sitemapIndex, 'utf-8');
    expect(indexContent).toContain('<?xml');
    expect(indexContent).toContain('sitemapindex');

    const directContent = fs.readFileSync(sitemapDirect, 'utf-8');
    expect(directContent).toContain('<?xml');
    expect(directContent).toContain('sitemapindex');
  });
});
