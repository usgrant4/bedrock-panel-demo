import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getAccessToken } from './_sf-client.js';

const AGENT_API_BASE = process.env.AGENT_API_BASE || 'https://api.salesforce.com';

type AgentChoice = 'employee' | 'customer';

function resolveAgentId(choice: AgentChoice): { id?: string; envVar: string } {
  if (choice === 'customer') {
    return { id: process.env.AGENT_ID_CUSTOMER, envVar: 'AGENT_ID_CUSTOMER' };
  }
  return { id: process.env.AGENT_ID, envVar: 'AGENT_ID' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const requested = (req.body || {}) as { agent?: AgentChoice };
  const choice: AgentChoice = requested.agent === 'customer' ? 'customer' : 'employee';
  const { id: agentId, envVar } = resolveAgentId(choice);
  if (!agentId) {
    res.status(500).json({ error: `${envVar} env var is not set on this deployment.` });
    return;
  }

  const instanceUrl = process.env.SF_INSTANCE_URL;
  if (!instanceUrl) {
    res.status(500).json({ error: 'SF_INSTANCE_URL env var is not set.' });
    return;
  }

  try {
    const token = await getAccessToken();
    const sessionKey = randomUUID();

    const upstream = await fetch(
      `${AGENT_API_BASE}/einstein/ai-agent/v1/agents/${agentId}/sessions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalSessionKey: sessionKey,
          instanceConfig: { endpoint: instanceUrl },
          streamingCapabilities: { chunkTypes: ['Text'] },
          bypassUser: true,
        }),
      },
    );

    const text = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: `Agent API start-session failed: ${upstream.status}`,
        detail: text.slice(0, 800),
      });
      return;
    }

    const data = JSON.parse(text) as { sessionId?: string };
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ sessionId: data.sessionId, sessionKey, agent: choice });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
