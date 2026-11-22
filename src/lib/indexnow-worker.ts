/**
 * Cloudflare Worker & Edge Handler for IndexNow Ping Submissions
 *
 * Provides a lightweight serverless endpoint:
 * POST /api/indexnow
 *
 * Secures requests with an optional bearer secret (INDEXNOW_WEBHOOK_SECRET)
 * and dispatches the payload to api.indexnow.org.
 */

import {
  INDEXNOW_KEY,
  SITE_HOST,
  KEY_LOCATION,
  INDEXNOW_ENDPOINT,
  buildIndexNowPayload,
  getChangedFeeUrls,
  type IndexNowPayload,
} from '../../scripts/ping-indexnow';

export interface IndexNowWorkerEnv {
  INDEXNOW_WEBHOOK_SECRET?: string;
  INDEXNOW_KEY?: string;
}

export async function handleIndexNowRequest(
  request: Request,
  env: IndexNowWorkerEnv = {}
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }

  // Optional Secret Header Validation
  if (env.INDEXNOW_WEBHOOK_SECRET) {
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${env.INDEXNOW_WEBHOOK_SECRET}`;
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid webhook secret' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let urls: string[] = [];
  try {
    const body = await request.json().catch(() => ({}));
    if (body && Array.isArray((body as { urls?: string[] }).urls)) {
      urls = (body as { urls: string[] }).urls;
    } else if (body && typeof (body as { platform?: string }).platform === 'string') {
      urls = getChangedFeeUrls({ platform: (body as { platform: string }).platform });
    } else {
      urls = getChangedFeeUrls({ all: true });
    }
  } catch {
    urls = getChangedFeeUrls({ all: true });
  }

  if (urls.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid URLs provided to submit' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload: IndexNowPayload = {
    host: SITE_HOST,
    key: env.INDEXNOW_KEY || INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'SellerCalcHub-Worker/1.0',
      },
      body: JSON.stringify(payload),
    });

    return new Response(
      JSON.stringify({
        success: res.status === 200 || res.status === 202,
        status: res.status,
        submittedUrls: urls.length,
        host: SITE_HOST,
      }),
      {
        status: res.status === 200 || res.status === 202 ? 200 : res.status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Upstream IndexNow fetch failed',
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
