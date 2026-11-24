import { describe, it, expect } from 'vitest';
import { buildCanonicalRedirectResponse } from '../../../functions/_middleware';

describe('Cloudflare Pages Edge Middleware (Canonical & pages.dev Hiding)', () => {
  it('redirects sellercalchub.pages.dev root and subpaths with 301 and noindex to sellercalchub.com', () => {
    const rootRedirect = buildCanonicalRedirectResponse(new URL('https://sellercalchub.pages.dev/'));
    expect(rootRedirect).not.toBeNull();
    expect(rootRedirect?.status).toBe(301);
    expect(rootRedirect?.headers.get('Location')).toBe('https://sellercalchub.com/');
    expect(rootRedirect?.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

    const calcRedirect = buildCanonicalRedirectResponse(
      new URL('https://sellercalchub.pages.dev/whatnot-fee-calculator/?price=50')
    );
    expect(calcRedirect?.status).toBe(301);
    expect(calcRedirect?.headers.get('Location')).toBe(
      'https://sellercalchub.com/whatnot-fee-calculator/?price=50'
    );
    expect(calcRedirect?.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('redirects preview *.sellercalchub.pages.dev URLs with 301 and noindex', () => {
    const previewRedirect = buildCanonicalRedirectResponse(
      new URL('https://4d69b1bb.sellercalchub.pages.dev/privacy/')
    );
    expect(previewRedirect?.status).toBe(301);
    expect(previewRedirect?.headers.get('Location')).toBe('https://sellercalchub.com/privacy/');
    expect(previewRedirect?.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('consolidates www.sellercalchub.com onto canonical apex https://sellercalchub.com', () => {
    const wwwRedirect = buildCanonicalRedirectResponse(
      new URL('https://www.sellercalchub.com/ebay-fee-calculator/')
    );
    expect(wwwRedirect?.status).toBe(301);
    expect(wwwRedirect?.headers.get('Location')).toBe(
      'https://sellercalchub.com/ebay-fee-calculator/'
    );
    expect(wwwRedirect?.headers.get('X-Robots-Tag')).toBeNull();
  });

  it('passes through canonical sellercalchub.com and local dev requests untouched', () => {
    expect(buildCanonicalRedirectResponse(new URL('https://sellercalchub.com/'))).toBeNull();
    expect(buildCanonicalRedirectResponse(new URL('http://localhost:4321/'))).toBeNull();
  });
});
