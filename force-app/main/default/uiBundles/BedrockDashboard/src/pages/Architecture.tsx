import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GreenStateDiagram, FutureStateDiagram } from '@/components/ArchitectureDiagram';
import { ARCHITECTURE_NARRATIVE, HOW_I_USED_AI, KPI_TARGETS } from '@/lib/bedrock-config';

const FEDERATION_TABLE = [
  { layer: 'Telemetry events (2.4 PB)', demoStack: 'Seeded into Bedrock_Telemetry_Event__c (80 records)', salesforceStack: 'Data Cloud zero-copy federation to Snowflake', stance: 'Federate (future)' },
  { layer: 'Asset / Customer / Contract', demoStack: 'pandas join in data_loader.py', salesforceStack: 'Custom objects (Bedrock_*__c) with lookups', stance: 'Ingest' },
  { layer: 'Knowledge Base', demoStack: 'Markdown + TF-IDF in knowledge.py', salesforceStack: 'Bedrock_KB_Section__c + SOSL (upgrade: DC vector search)', stance: 'Ingest' },
  { layer: 'Reasoning', demoStack: 'Claude API call in agent.py', salesforceStack: 'Agentforce agent (Bedrock_Service_Triage) calling Apex invocables', stance: 'Salesforce-native' },
  { layer: 'Actions', demoStack: 'Python dicts in actions.py', salesforceStack: 'Apex @InvocableMethod classes writing custom objects', stance: 'Salesforce-native' },
  { layer: 'Trust policy', demoStack: 'Python enum in trust_policy.py', salesforceStack: 'Agent action posture + permission set', stance: 'Salesforce-native' },
  { layer: 'Consumption policy', demoStack: '— (none)', salesforceStack: 'MCP consumption controller (future)', stance: 'Future' },
  { layer: 'UI', demoStack: 'Streamlit (off-platform)', salesforceStack: 'React Vercel + SF Web Tab (UIBundle Beta blocked); future: native UI Bundle', stance: 'Hybrid today' },
];

const KPI_MAP = [
  {
    kpi: 'Fleet MTTR (Critical)',
    target: `${KPI_TARGETS.fleetMttrHours.current}h → ≤${KPI_TARGETS.fleetMttrHours.target}h`,
    moves: [
      'BedrockAssetContext returns customer + asset + contract + 30d-fault rollup in one call → agent skips context-gathering',
      'BedrockKnowledge names exact parts (HYD-MP-9912, HYD-RV-2204) → no false-start dispatches',
      'BedrockOpenCase is Autonomous → MTTR clock starts immediately',
    ],
  },
  {
    kpi: 'Warranty cycle time',
    target: `${KPI_TARGETS.warrantyCycleDays.current}d → ≤${KPI_TARGETS.warrantyCycleDays.target}d`,
    moves: [
      'BedrockStageWarranty is Autonomous within the 72h KB §5 entitlement window',
      'Agent stages; human approves submission within 7d',
      'Submission timestamp is captured for cycle-time measurement',
    ],
  },
  {
    kpi: 'ARR at risk',
    target: `$${(KPI_TARGETS.arrAtRiskUsd.current / 1_000_000).toFixed(2)}M visible`,
    moves: [
      'Computed from Bedrock_Service_Contract__c.Annual_Value_USD__c on assets with open Critical faults',
      'Surfaced both to the agent (KPI context) and the dashboard Home page',
      'Makes business value visible to the rep at decision time',
    ],
  },
  {
    kpi: 'Open Critical faults (30d)',
    target: `${KPI_TARGETS.openCriticalFaults30d.current} → 0`,
    moves: [
      'Real-time count from Bedrock_Telemetry_Event__c',
      'Drives the fleet-level risk view on the dashboard',
      'Falls automatically as the agent triages each fault end-to-end',
    ],
  },
];

export default function Architecture() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Architecture</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          How the off-platform demo maps to a Salesforce-native deployment, what runs today, and
          what the next iteration adds. The headline architectural call is federation-vs-ingestion —
          and the under-told corollary is <em>consumption control</em> via MCP.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Every component maps to a stated KPI
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {KPI_MAP.map((row) => (
            <Card key={row.kpi} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm">{row.kpi}</CardTitle>
                <div className="text-xs font-mono text-slate-600">{row.target}</div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">
                  {row.moves.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Green state vs future state
        </h2>
        <div className="space-y-4">
          <GreenStateDiagram />
          <FutureStateDiagram />
        </div>
      </section>

      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">Why not Data Cloud (yet)</CardTitle>
            <div className="text-xs text-slate-500">
              Federation is correct. Federation today is premature.
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <div className="font-semibold text-slate-900">Scale doesn't justify it yet</div>
                <p className="mt-1 text-xs">
                  Demo runs at 174 records. Data Cloud break-even is millions of records / TB-scale.
                  Today's data fits natively in custom objects with single-digit-ms SOQL latency.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Consumption is billable</div>
                <p className="mt-1 text-xs">
                  Data Cloud is priced on <strong>Flex Credits</strong> — per row ingested, per query,
                  per CDP segment refresh, per identity stitch. Without controls, an agent that calls
                  retrieval on every utterance burns credits fast.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-900">Current cost model is defensible</div>
                <p className="mt-1 text-xs">
                  Vercel free tier hosts the dashboard + serverless API. Salesforce REST API is
                  included in the org license. OAuth refresh-token grant: <strong>zero net-new
                  license cost</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">Layer-by-layer mapping</CardTitle>
            <div className="text-xs text-slate-500">From src/salesforce_mapping.py + docs/architecture.md</div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Layer</th>
                  <th className="py-2 pr-3 font-medium">Demo stack</th>
                  <th className="py-2 pr-3 font-medium">Salesforce stack</th>
                  <th className="py-2 font-medium">Stance</th>
                </tr>
              </thead>
              <tbody>
                {FEDERATION_TABLE.map((row) => (
                  <tr key={row.layer} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-900">{row.layer}</td>
                    <td className="py-2 pr-3 text-slate-600">{row.demoStack}</td>
                    <td className="py-2 pr-3 text-slate-600">{row.salesforceStack}</td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.stance.startsWith('Federate')
                            ? 'bg-sky-100 text-sky-800'
                            : row.stance === 'Ingest'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.stance.startsWith('Future')
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {row.stance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">Narrative</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-slate-700">
              {ARCHITECTURE_NARRATIVE.split('\n').map((line, i) => (
                <p key={i} className="my-2">
                  {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                    part.startsWith('**') ? (
                      <strong key={j}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">How I used AI</CardTitle>
            <div className="text-xs text-slate-500">
              Required briefing slide. Includes one explicit override example.
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {HOW_I_USED_AI.map((row) => (
                <li key={row.what} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="font-medium text-slate-900">{row.what}</div>
                  <div className="mt-1 text-sm text-slate-600">{row.who}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
