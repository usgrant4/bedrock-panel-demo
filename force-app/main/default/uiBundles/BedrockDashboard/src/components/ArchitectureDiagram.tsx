import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Node {
  label: string;
  sub?: string;
  color?: 'agent' | 'apex' | 'data' | 'ui' | 'external' | 'control' | 'future';
}

const COLORS: Record<NonNullable<Node['color']>, string> = {
  agent: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  apex: 'border-amber-300 bg-amber-50 text-amber-900',
  data: 'border-slate-300 bg-slate-50 text-slate-900',
  ui: 'border-sky-300 bg-sky-50 text-sky-900',
  external: 'border-indigo-300 bg-indigo-50 text-indigo-900',
  control: 'border-rose-300 bg-rose-50 text-rose-900',
  future: 'border-violet-300 bg-violet-50 text-violet-900',
};

function Box({ node, className = '' }: { node: Node; className?: string }) {
  const color = COLORS[node.color ?? 'data'];
  return (
    <div
      className={`rounded-md border-2 px-3 py-2 text-center text-xs font-medium shadow-sm ${color} ${className}`}
    >
      <div className="font-mono font-semibold">{node.label}</div>
      {node.sub && <div className="mt-0.5 text-[10px] font-normal opacity-80">{node.sub}</div>}
    </div>
  );
}

function Arrow({ label, vertical = true }: { label?: string; vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex flex-col items-center text-slate-400">
        {label && <div className="mb-0.5 text-[10px] uppercase tracking-wide">{label}</div>}
        <div className="text-lg leading-none">↓</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-400">
      {label && <span className="text-[10px] uppercase tracking-wide">{label}</span>}
      <span className="text-lg leading-none">→</span>
    </div>
  );
}

export function GreenStateDiagram() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm">Green state — what runs today</CardTitle>
        <div className="text-xs text-slate-500">
          Two personas · two surfaces · one trust gate. Headless agent layer in production.
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-2">

          {/* Two personas + two surfaces, side by side */}
          <div className="grid w-full max-w-3xl grid-cols-2 gap-6">

            {/* LEFT COLUMN: in-org dealer service rep */}
            <div className="flex flex-col items-center gap-3">
              <Box
                node={{
                  label: 'Dealer service rep',
                  sub: 'internal · Service Cloud licensed user',
                  color: 'external',
                }}
                className="w-full"
              />
              <Arrow />
              <Box
                node={{
                  label: 'Salesforce Lightning Experience',
                  sub: 'in-org surface · SForg',
                  color: 'ui',
                }}
                className="w-full"
              />
              <Arrow />
              <Box
                node={{
                  label: 'Lightning Agentforce Panel',
                  sub: 'embedded in-org chat',
                  color: 'ui',
                }}
                className="w-full"
              />
              <Arrow label="utterance" />
              <Box
                node={{
                  label: 'Bedrock_Service_Triage',
                  sub: 'AgentforceEmployeeAgent · runs as calling user',
                  color: 'agent',
                }}
                className="w-full"
              />
            </div>

            {/* RIGHT COLUMN: off-platform consumer via Vercel */}
            <div className="flex flex-col items-center gap-3">
              <Box
                node={{
                  label: 'Off-platform consumer',
                  sub: 'fleet ops · BI · partner · no SF license required',
                  color: 'external',
                }}
                className="w-full"
              />
              <Arrow />
              <Box
                node={{
                  label: 'React SPA on Vercel',
                  sub: 'bedrock-dashboard-sand.vercel.app',
                  color: 'external',
                }}
                className="w-full"
              />
              <Arrow />
              <Box
                node={{
                  label: 'AgentChat · /api/agent-session · /api/agent-message',
                  sub: 'Vercel serverless · Client Credentials + JWT',
                  color: 'external',
                }}
                className="w-full"
              />
              <Arrow label="api.salesforce.com/einstein/ai-agent/v1" />
              <Box
                node={{
                  label: 'Bedrock_Customer_Service',
                  sub: 'AgentforceServiceAgent · runs as Agent User',
                  color: 'agent',
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Converging — both agents invoke the same Apex layer */}
          <div className="flex w-full max-w-3xl items-center justify-center gap-12 pt-1">
            <Arrow label="invokes" />
            <Arrow label="invokes" />
          </div>

          <Box
            node={{
              label: '4 Apex @InvocableMethod classes  ·  TRUST MATRIX enforced HERE',
              sub: 'BedrockAssetContext · BedrockKnowledge · BedrockOpenCase · BedrockStageWarranty',
              color: 'apex',
            }}
            className="w-full max-w-3xl"
          />

          <Arrow label="SOQL · SOSL · DML" />

          <Box
            node={{
              label: '7 Bedrock_* custom objects · 174 records',
              sub: 'Customer · Asset · Service_Contract · Telemetry_Event · KB_Section · Service_Case · Warranty_Claim',
              color: 'data',
            }}
            className="w-full max-w-3xl"
          />

          {/* Side note: the dashboard also has a separate read path */}
          <div className="w-full max-w-3xl rounded-md border border-sky-200 bg-sky-50 p-2 text-[11px] text-sky-900">
            <div className="font-semibold">Dashboard read path (separate from chat)</div>
            <div className="mt-0.5">
              The React SPA also polls <span className="font-mono">/api/recent-cases</span> and{' '}
              <span className="font-mono">/api/recent-claims</span> every 10s. Those serverless
              functions call Salesforce REST <span className="font-mono">/services/data/v66.0/query/</span>{' '}
              directly with the same JWT token — read-only, bypasses the agent because no
              writes occur. Same data layer, two access patterns: agent-mediated writes,
              direct REST reads.
            </div>
          </div>

          <div className="mt-2 grid w-full max-w-3xl grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="rounded-md border border-slate-200 p-2">
              <div className="font-semibold text-slate-800">Trust matrix (writes)</div>
              <div className="mt-0.5">Autonomous: open_service_case · stage_warranty_claim</div>
              <div>Recommend: dispatch_technician · ship_part · draft_customer_message</div>
              <div>Human: escalate_to_bedrock_engineer</div>
            </div>
            <div className="rounded-md border border-slate-200 p-2">
              <div className="font-semibold text-slate-800">Headless property</div>
              <div className="mt-0.5">
                Two personas, two surfaces, two agent types — but ONE trust gate in Apex.
                Same policy applies regardless of which surface initiates the conversation.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FutureStateDiagram() {
  return (
    <Card className="border-violet-200">
      <CardHeader>
        <CardTitle className="text-sm">Future state — MCP-mediated, Data Cloud-federated</CardTitle>
        <div className="text-xs text-slate-500">
          Same agent + same trust matrix · adds an MCP consumption controller and Data Cloud federation
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-2">
          <Box node={{ label: 'Bedrock_Service_Triage agent', color: 'agent' }} className="w-72" />
          <Arrow label="action request + budget ceiling" />
          <Box
            node={{
              label: 'MCP consumption controller',
              sub: 'per-action budget · routing policy · same shape as trust matrix, but for cost',
              color: 'future',
            }}
            className="w-full max-w-2xl"
          />
          <div className="grid w-full max-w-2xl grid-cols-3 gap-4 pt-1">
            <div className="flex flex-col items-center gap-2">
              <Arrow label="cheap" />
              <Box
                node={{
                  label: 'Cached SOQL',
                  sub: 'stale-OK reads · zero DC quota',
                  color: 'data',
                }}
                className="w-full"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Arrow label="bounded" />
              <Box
                node={{
                  label: 'Data Cloud vector search',
                  sub: 'KB embeddings refreshed on update only',
                  color: 'future',
                }}
                className="w-full"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Arrow label="metered" />
              <Box
                node={{
                  label: 'Data Cloud federation',
                  sub: 'zero-copy → Snowflake (2.4 PB)',
                  color: 'future',
                }}
                className="w-full"
              />
            </div>
          </div>
          <Arrow />
          <Box
            node={{
              label: 'Pub/Sub API push events',
              sub: 'replaces 10s polling · sub-second freshness on the dashboard',
              color: 'future',
            }}
            className="w-full max-w-2xl"
          />
          <div className="mt-2 grid w-full max-w-2xl grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="rounded-md border border-violet-200 bg-violet-50 p-2">
              <div className="font-semibold text-violet-900">Why MCP, not raw Data Cloud</div>
              <div className="mt-0.5">DC charges per row ingested, per query, per identity stitch (Flex Credits).</div>
              <div>Without a controller, agent loops can burn the monthly budget in days.</div>
              <div>MCP enforces the budget the same way the trust matrix enforces blast radius.</div>
            </div>
            <div className="rounded-md border border-violet-200 bg-violet-50 p-2">
              <div className="font-semibold text-violet-900">When MCP routes to DC vs cache</div>
              <div className="mt-0.5">get_asset_context → cached SOQL (no DC).</div>
              <div>retrieve_knowledge → DC only if KB updated since last index.</div>
              <div>fleet_mttr_rollup → DC on dashboard load, never per agent turn.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
