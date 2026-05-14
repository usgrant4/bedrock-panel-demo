import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAccessToken } from './_sf-client.js';

const AGENT_API_BASE = process.env.AGENT_API_BASE || 'https://api.salesforce.com';

interface AgentMessageBody {
  sessionId?: string;
  sequenceId?: number;
  text?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { sessionId, sequenceId, text: utterance } = (req.body || {}) as AgentMessageBody;
  if (!sessionId || typeof sequenceId !== 'number' || !utterance) {
    res.status(400).json({
      error: 'Body must include sessionId (string), sequenceId (number), text (string).',
    });
    return;
  }

  try {
    const token = await getAccessToken();
    const upstream = await fetch(
      `${AGENT_API_BASE}/einstein/ai-agent/v1/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: { sequenceId, type: 'Text', text: utterance },
          variables: [],
        }),
      },
    );

    const text = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: `Agent API send-message failed: ${upstream.status}`,
        detail: text.slice(0, 800),
      });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
