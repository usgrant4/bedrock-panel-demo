import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * One-time OAuth callback handler.
 *
 * Workflow:
 *   1. User has already set SF_CLIENT_ID and SF_CLIENT_SECRET in Vercel env vars.
 *   2. User visits the Salesforce authorize URL with response_type=code.
 *   3. Salesforce redirects here with ?code=AUTH_CODE.
 *   4. This handler exchanges code → refresh_token via OAuth web-server flow.
 *   5. Renders the refresh_token + instance_url for the user to copy into Vercel env vars.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error, error_description } = req.query as Record<string, string | undefined>;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (error) {
    res.status(400).send(renderHtml({
      title: 'OAuth error',
      body: `<p>${escape(error)}</p><p>${escape(error_description ?? '')}</p>`,
    }));
    return;
  }

  if (!code || typeof code !== 'string') {
    res.status(400).send(renderHtml({
      title: 'Missing authorization code',
      body: `<p>Salesforce did not return a <code>code</code> query parameter. Re-run the OAuth flow.</p>`,
    }));
    return;
  }

  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send(renderHtml({
      title: 'Missing env vars',
      body: `<p>Set <code>SF_CLIENT_ID</code> and <code>SF_CLIENT_SECRET</code> in Vercel project settings, redeploy, then retry the OAuth flow.</p>`,
    }));
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: 'https://bedrock-dashboard-sand.vercel.app/api/oauth-callback',
  });

  const tokenResponse = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = (await tokenResponse.json()) as Record<string, string>;

  if (!tokenResponse.ok) {
    res.status(400).send(renderHtml({
      title: 'Token exchange failed',
      body: `<pre style="background:#f3f4f6;padding:12px;border-radius:4px;overflow-x:auto;">${escape(JSON.stringify(data, null, 2))}</pre>`,
    }));
    return;
  }

  res.status(200).send(renderHtml({
    title: 'OAuth success — copy these to Vercel',
    body: `
      <p>Add the two values below as <strong>Production environment variables</strong> in the Vercel dashboard
      (Settings → Environment Variables for the <code>bedrock-dashboard</code> project), then redeploy.</p>

      <h3>SF_REFRESH_TOKEN</h3>
      <pre style="background:#f3f4f6;padding:12px;border-radius:4px;word-break:break-all;white-space:pre-wrap;">${escape(data.refresh_token ?? '(missing — re-check that the Connected App has the RefreshToken scope)')}</pre>

      <h3>SF_INSTANCE_URL</h3>
      <pre style="background:#f3f4f6;padding:12px;border-radius:4px;">${escape(data.instance_url ?? '')}</pre>

      <h3>What to do next</h3>
      <ol>
        <li>Vercel → bedrock-dashboard → Settings → Environment Variables</li>
        <li>Add <code>SF_REFRESH_TOKEN</code> = (value above)</li>
        <li>Add <code>SF_INSTANCE_URL</code> = (value above)</li>
        <li>Confirm <code>SF_CLIENT_ID</code> and <code>SF_CLIENT_SECRET</code> are already set</li>
        <li>Redeploy (Vercel will redeploy automatically on next push, or run <code>npx vercel --prod</code>)</li>
      </ol>
    `,
  }));
}

function renderHtml({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(title)}</title></head>
<body style="font-family:ui-sans-serif,system-ui;max-width:780px;margin:48px auto;padding:0 16px;color:#0f172a;">
  <h1>${escape(title)}</h1>
  ${body}
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
