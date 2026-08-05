import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Secure Apify API proxy.
 * Injects APIFY_API_TOKEN server-side — never exposed to the browser.
 *
 * Vercel routes /api/apify/(.*) → /api/apify?apify_path=$1
 * The function reconstructs the full Apify URL and forwards the request.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.error('[/api/apify] APIFY_API_TOKEN not configured');
    return res.status(500).json({ error: 'APIFY_API_TOKEN not configured on server' });
  }

  // apify_path is injected by vercel.json rewrite from the URL wildcard
  const apifyPath = (req.query.apify_path as string) || '';
  if (!apifyPath) {
    return res.status(400).json({ error: 'apify_path is required' });
  }

  // Build the Apify API URL with server-side token
  const apifyUrl = new URL(`https://api.apify.com/v2/${apifyPath}`);
  apifyUrl.searchParams.set('token', apiToken);

  // Forward all other query params except our routing param and any client-sent token
  const skipParams = new Set(['apify_path', 'token']);
  for (const [key, val] of Object.entries(req.query)) {
    if (!skipParams.has(key) && typeof val === 'string') {
      apifyUrl.searchParams.set(key, val);
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apifyRes = await fetch(apifyUrl.toString(), fetchOptions);

    const contentType = apifyRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await apifyRes.json();
      return res.status(apifyRes.status).json(data);
    }

    const text = await apifyRes.text();
    return res.status(apifyRes.status).send(text);

  } catch (error: any) {
    console.error('[/api/apify] Proxy error:', error.message);
    return res.status(502).json({ error: `Apify proxy error: ${error.message}` });
  }
}
