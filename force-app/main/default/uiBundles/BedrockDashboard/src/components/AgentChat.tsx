import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Off-platform chat surface for the Bedrock_Customer_Service agent (the
 * AgentforceServiceAgent type). Invocation goes through the public Agent
 * API at api.salesforce.com via /api/agent-session and /api/agent-message,
 * authenticated via Client Credentials + JWT.
 *
 * The Employee Agent (Bedrock_Service_Triage) is intentionally NOT
 * surfaced here — Employee Agents run as the calling user and require
 * in-org surfaces (Lightning Agentforce panel). The /api/agent-session
 * endpoint still accepts `agent: 'employee'` for future re-enablement on
 * an entitled org, but the UI is locked to the Service Agent.
 */
const AGENT_LABEL = 'Bedrock_Customer_Service';
const AGENT_SUB = 'AgentforceServiceAgent — customer-facing surface, invoked off-platform via Agent API';

interface ChatBubble {
  role: 'user' | 'agent' | 'system';
  text: string;
  toolCount?: number;
}

interface AgentApiMessage {
  type?: string;
  message?: string;
  result?: unknown[];
  citedReferences?: unknown[];
}

interface AgentApiResponse {
  messages?: AgentApiMessage[];
  error?: string;
  detail?: string;
}

export function AgentChat({ seedUtterance }: { seedUtterance?: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState(seedUtterance ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sequenceRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const r = await fetch('/api/agent-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'customer' }),
    });
    const data = (await r.json()) as { sessionId?: string; error?: string; detail?: string };
    if (!r.ok || !data.sessionId) {
      throw new Error(data.error ? `${data.error}${data.detail ? ` — ${data.detail}` : ''}` : `start-session failed: ${r.status}`);
    }
    setSessionId(data.sessionId);
    return data.sessionId;
  }

  async function send() {
    const utterance = input.trim();
    if (!utterance || sending) return;
    setInput('');
    setError(null);
    setBubbles((b) => [...b, { role: 'user', text: utterance }]);
    setSending(true);
    try {
      const sid = await ensureSession();
      const seq = sequenceRef.current++;
      const r = await fetch('/api/agent-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, sequenceId: seq, text: utterance }),
      });
      const data = (await r.json()) as AgentApiResponse;
      if (!r.ok) {
        throw new Error(data.error ? `${data.error}${data.detail ? ` — ${data.detail}` : ''}` : `send-message failed: ${r.status}`);
      }
      const newBubbles: ChatBubble[] = [];
      for (const m of data.messages ?? []) {
        if (m.message) {
          newBubbles.push({
            role: 'agent',
            text: m.message,
            toolCount: m.result?.length,
          });
        }
      }
      if (newBubbles.length === 0) {
        newBubbles.push({ role: 'system', text: '(agent returned no text — see network tab for raw response)' });
      }
      setBubbles((b) => [...b, ...newBubbles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  function resetSession() {
    setSessionId(null);
    setBubbles([]);
    setError(null);
    sequenceRef.current = 1;
  }

  return (
    <div className="flex h-[540px] flex-col rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <div className="text-xs text-slate-500">
          <div className="font-mono text-sm text-slate-800">{AGENT_LABEL}</div>
          <div>{AGENT_SUB}</div>
        </div>
        <div className="text-right text-xs text-slate-500">
          {sessionId ? (
            <>Session <span className="font-mono">{sessionId.slice(0, 8)}…</span> · live</>
          ) : (
            <>No session yet</>
          )}
          {sessionId && (
            <button
              onClick={resetSession}
              className="ml-2 text-slate-500 underline-offset-2 hover:underline"
              type="button"
            >
              New
            </button>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {bubbles.length === 0 && (
          <div className="text-center text-xs text-slate-400">
            Type an utterance below to start. The session opens against the published <span className="font-mono">{AGENT_LABEL}</span> agent in your org via the public Agent API.
          </div>
        )}
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={
              b.role === 'user'
                ? 'ml-auto max-w-[80%] rounded-md bg-emerald-600 px-3 py-2 text-sm text-white'
                : b.role === 'agent'
                  ? 'mr-auto max-w-[80%] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900'
                  : 'mx-auto max-w-[80%] rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900'
            }
          >
            <div className="whitespace-pre-wrap">{b.text}</div>
            {b.toolCount ? (
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
                {b.toolCount} tool result{b.toolCount === 1 ? '' : 's'}
              </div>
            ) : null}
          </div>
        ))}
        {sending && (
          <div className="mr-auto max-w-[80%] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <span className="animate-pulse">Agent thinking…</span>
          </div>
        )}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-slate-100 px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          disabled={sending}
          placeholder="e.g. We have a Critical HYD-447 on ASSET-50101…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-50"
        />
        <Button onClick={() => void send()} disabled={sending || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
