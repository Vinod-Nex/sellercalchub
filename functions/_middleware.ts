/**
 * Cloudflare Pages Edge Middleware
 * - Prevents duplicate indexing & SEO dilution from *.pages.dev hostnames by issuing
 *   an immediate 301 permanent redirect to https://sellercalchub.com alongside an
 *   X-Robots-Tag: noindex, nofollow header.
 * - Consolidates www.sellercalchub.com onto the canonical apex domain https://sellercalchub.com.
 */
export interface MiddlewareContext {
  request: Request;
  next: () => Promise<Response>;
}

const CANONICAL_ORIGIN = 'https://sellercalchub.com';

/**
 * Evaluates an incoming request URL and returns a canonical 301 redirect response
 * when accessed via *.pages.dev or www.sellercalchub.com, or null to proceed normally.
 */
export function buildCanonicalRedirectResponse(requestUrl: URL): Response | null {
  const hostname = requestUrl.hostname.toLowerCase();

  if (hostname.endsWith('.pages.dev') || hostname === 'www.sellercalchub.com') {
    const targetUrl = `${CANONICAL_ORIGIN}${requestUrl.pathname}${requestUrl.search}`;
    const headers: Record<string, string> = {
      Location: targetUrl,
      'Cache-Control': 'public, max-age=3600',
    };

    if (hostname.endsWith('.pages.dev')) {
      headers['X-Robots-Tag'] = 'noindex, nofollow';
    }

    return new Response(null, {
      status: 301,
      headers,
    });
  }

  return null;
}

export async function onRequest(context: MiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);
  const redirectResponse = buildCanonicalRedirectResponse(url);
  if (redirectResponse) {
    return redirectResponse;
  }

  return context.next();
}
