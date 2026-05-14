/**
 * Shared Salesforce REST helpers for the Vercel API routes.
 *
 * Mints an access token via the OAuth **Client Credentials** flow against the
 * org's MY_DOMAIN URL. The Connected App must have:
 *   - "Enable Client Credentials Flow" checked
 *   - "Issue JWT Web Token (JWT)-based access tokens for named users" checked
 *   - A "Run As" user assigned (under Manage → Edit Policies → Client Credentials Flow)
 *
 * The JWT-format access token is required by the Einstein Agent API gateway
 * at api.salesforce.com — opaque tokens from refresh_token / web-server grant
 * return bare 404 there. The same JWT token also works for standard REST
 * (/services/data/...) so SOQL calls continue to function.
 */

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-memory cache (per warm Lambda instance). Cold starts re-mint.
let cached: CachedToken | null = null;

export async function getAccessToken(): Promise<string> {
  const instanceUrl = process.env.SF_INSTANCE_URL;
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!instanceUrl || !clientId || !clientSecret) {
    throw new Error(
      'Missing SF OAuth env vars. Required: SF_INSTANCE_URL, SF_CLIENT_ID, SF_CLIENT_SECRET.'
    );
  }

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch(`${instanceUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    throw new Error(`Client-credentials grant failed: ${tokenResponse.status} ${detail}`);
  }

  const json = (await tokenResponse.json()) as { access_token: string; expires_in?: number };
  // Client-credentials tokens typically expire in 30 min; default 25 min if missing.
  const ttlMs = (json.expires_in ?? 1500) * 1000;
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + ttlMs,
  };
  return cached.token;
}

export async function soqlQuery<T>(query: string): Promise<T[]> {
  const instanceUrl = process.env.SF_INSTANCE_URL!;
  const token = await getAccessToken();
  const url = `${instanceUrl}/services/data/v66.0/query/?q=${encodeURIComponent(query.trim().replace(/\s+/g, ' '))}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SOQL query failed: ${response.status} ${detail}`);
  }

  const json = (await response.json()) as { records: T[] };
  return json.records ?? [];
}

/**
 * Build a Lightning record-page URL for an SObject.
 * Used by API routes to enrich records with a clickable URL so the frontend
 * doesn't need to know the org's instance URL.
 */
export function lightningUrlFor(objectType: string, recordId: string): string {
  const instanceUrl = process.env.SF_INSTANCE_URL!;
  return `${instanceUrl}/lightning/r/${objectType}/${recordId}/view`;
}
