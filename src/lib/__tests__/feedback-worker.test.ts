import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleFeedbackRequest,
  resetTestStore,
  inMemoryReports,
  isRateLimited,
  validateFeedbackInput,
} from '../feedback-worker';

describe('Feedback Worker & Rate Reporter (Phase 29)', () => {
  beforeEach(() => {
    resetTestStore();
    vi.restoreAllMocks();
  });

  it('rejects non-POST methods with 405 Method Not Allowed', async () => {
    const getReq = new Request('https://sellercalchub.com/api/report-fee', { method: 'GET' });
    const res = await handleFeedbackRequest(getReq);
    expect(res.status).toBe(405);
  });

  it('handles OPTIONS preflight with 204 No Content', async () => {
    const optReq = new Request('https://sellercalchub.com/api/report-fee', { method: 'OPTIONS' });
    const res = await handleFeedbackRequest(optReq);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('rejects malformed or invalid JSON payloads', async () => {
    const badReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      body: 'invalid-json{{{',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await handleFeedbackRequest(badReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON payload.');
  });

  it('detects and immediately rejects honeypot spam bot submissions', async () => {
    const spamReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'ebay-us',
        feeType: 'referral',
        expectedRate: '12%',
        details: 'Valid length details message here',
        turnstileToken: 'TEST_TURNSTILE_PASS_TOKEN',
        honeypot: 'http://spam-link-bot.com', // Filled honeypot
      }),
    });

    const res = await handleFeedbackRequest(spamReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Spam submission detected.');
    expect(inMemoryReports.length).toBe(0);
  });

  it('rejects submissions with missing or failing Turnstile tokens', async () => {
    // Missing token
    const missingTokenReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'whatnot',
        feeType: 'commission',
        expectedRate: '8.0%',
        details: 'Official fee update on Whatnot policy page',
      }),
    });
    const missingRes = await handleFeedbackRequest(missingTokenReq);
    expect(missingRes.status).toBe(400);

    // Failing token
    const failTokenReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'whatnot',
        feeType: 'commission',
        expectedRate: '8.0%',
        details: 'Official fee update on Whatnot policy page',
        turnstileToken: 'TEST_TURNSTILE_FAIL_TOKEN',
      }),
    });
    const failRes = await handleFeedbackRequest(failTokenReq);
    expect(failRes.status).toBe(403);
    const failData = await failRes.json();
    expect(failData.error).toContain('Verification challenge failed');
  });

  it('validates required fields: platform, feeType, expectedRate, and details min length', () => {
    const check1 = validateFeedbackInput({
      platform: '',
      feeType: 'referral',
      expectedRate: '13.25%',
      details: 'Long enough details text here',
      turnstileToken: 'valid-token',
    });
    expect(check1.isValid).toBe(false);
    expect(check1.errors).toContain('Platform is required.');

    const check2 = validateFeedbackInput({
      platform: 'ebay-us',
      feeType: 'referral',
      expectedRate: '13.25%',
      details: 'Too short', // Under 10 chars
      turnstileToken: 'valid-token',
    });
    expect(check2.isValid).toBe(false);
    expect(check2.errors[0]).toContain('at least 10 characters');

    const check3 = validateFeedbackInput({
      platform: 'ebay-us',
      feeType: 'referral',
      expectedRate: '13.25%',
      sourceUrl: 'not-a-valid-url',
      details: 'Long enough details text here',
      turnstileToken: 'valid-token',
    });
    expect(check3.isValid).toBe(false);
    expect(check3.errors[0]).toContain('must begin with http:// or https://');
  });

  it('accepts a valid report, stores it, and guarantees ZERO personal data leakage', async () => {
    const mockPut = vi.fn().mockResolvedValue(undefined);
    const mockWebhook = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('challenges.cloudflare.com')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true })));
      }
      return mockWebhook();
    });

    const validReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.195', // IP should NOT be attached to report
        'User-Agent': 'Mozilla/5.0 TestBrowser',
      },
      body: JSON.stringify({
        platform: 'ebay-us',
        feeType: 'Musical Instruments',
        expectedRate: '6.35% + $0.30 instead of 6.0%',
        sourceUrl: 'https://pages.ebay.com/seller-center/service-and-payments/fees-and-features/fees.html',
        details: 'Guitar categories recently changed from 6.0% to 6.35% for the first $7,500.',
        turnstileToken: 'TEST_TURNSTILE_PASS_TOKEN',
      }),
    });

    const env = {
      FEEDBACK_KV: { put: mockPut, get: vi.fn() },
      NOTIFICATION_WEBHOOK_URL: 'https://webhook.internal/test',
    };

    const res = await handleFeedbackRequest(validReq, env);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.reportId).toMatch(/^fee_\d+_/);
    expect(body.message).toContain('received and queued');

    // Verify stored report
    expect(inMemoryReports.length).toBe(1);
    const stored = inMemoryReports[0];
    expect(stored.platform).toBe('ebay-us');
    expect(stored.feeType).toBe('Musical Instruments');
    expect(stored.expectedRate).toContain('6.35%');
    expect(stored.sourceUrl).toContain('ebay.com');
    expect(stored.details).toContain('Guitar categories');

    // STRICT ZERO PII CHECK: Ensure no IP, cookies, or user agent stored in report
    const storedKeys = Object.keys(stored);
    expect(storedKeys).not.toContain('ip');
    expect(storedKeys).not.toContain('remoteIp');
    expect(storedKeys).not.toContain('userAgent');
    expect(storedKeys).not.toContain('cookie');
    expect(storedKeys).not.toContain('email');

    // Verify KV put called
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith(
      `report:${stored.id}`,
      JSON.stringify(stored),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
  });

  it('enforces sliding-window rate limiting to block spam floods', async () => {
    const client = 'test_flood_client';
    // Max 3 requests per 60 sec
    expect(isRateLimited(client, 3, 60)).toBe(false); // 1
    expect(isRateLimited(client, 3, 60)).toBe(false); // 2
    expect(isRateLimited(client, 3, 60)).toBe(false); // 3
    expect(isRateLimited(client, 3, 60)).toBe(true);  // 4 -> Blocked!

    // HTTP 429 response check
    const floodReq = new Request('https://sellercalchub.com/api/report-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '198.51.100.42',
      },
      body: JSON.stringify({
        platform: 'etsy',
        feeType: 'listing',
        expectedRate: '$0.20',
        details: 'Testing rate limits',
        turnstileToken: 'TEST_TURNSTILE_PASS_TOKEN',
      }),
    });

    const env = { FEEDBACK_RATE_LIMIT_MAX: 1 };
    // First request passes
    const res1 = await handleFeedbackRequest(floodReq, env);
    expect(res1.status).toBe(200);

    // Second request blocked with 429
    const res2 = await handleFeedbackRequest(floodReq, env);
    expect(res2.status).toBe(429);
    const data = await res2.json();
    expect(data.error).toContain('Too many submissions');
  });
});
