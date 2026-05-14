import { KpiCard } from '@/components/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPI_TARGETS, DEMO_NARRATIVE, PERSONAS } from '@/lib/bedrock-config';

export default function Home() {
  return (
    <div className="space-y-8">
      <section>
        <div className="text-xs uppercase tracking-wide text-slate-500">{DEMO_NARRATIVE.panel}</div>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          {DEMO_NARRATIVE.scenario}
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Four numbers drive every architectural choice in this build. Five teams change their
          day-to-day the week it ships. The headline scenario is{' '}
          <span className="font-medium text-slate-800">{DEMO_NARRATIVE.customer}</span>,
          asset <span className="font-medium text-slate-800">{DEMO_NARRATIVE.headlineAsset}</span>,
          fault <span className="font-medium text-slate-800">{DEMO_NARRATIVE.headlineFault}</span>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          The four numbers
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={KPI_TARGETS.fleetMttrHours.label}
            current={KPI_TARGETS.fleetMttrHours.current}
            target={KPI_TARGETS.fleetMttrHours.target}
            unit={KPI_TARGETS.fleetMttrHours.unit}
            betterIs="lower"
          />
          <KpiCard
            label={KPI_TARGETS.warrantyCycleDays.label}
            current={KPI_TARGETS.warrantyCycleDays.current}
            target={KPI_TARGETS.warrantyCycleDays.target}
            unit={KPI_TARGETS.warrantyCycleDays.unit}
            betterIs="lower"
          />
          <KpiCard
            label={KPI_TARGETS.arrAtRiskUsd.label}
            current={KPI_TARGETS.arrAtRiskUsd.current}
            target={0}
            unit={KPI_TARGETS.arrAtRiskUsd.unit}
            betterIs="lower"
            formatter={(v) => `$${(v / 1_000_000).toFixed(2)}M`}
          />
          <KpiCard
            label={KPI_TARGETS.openCriticalFaults30d.label}
            current={KPI_TARGETS.openCriticalFaults30d.current}
            target={0}
            unit=""
            betterIs="lower"
          />
        </div>
        <p className="mt-3 max-w-3xl text-xs text-slate-500">
          Each KPI is computed from real seeded data. MTTR target ≤6h is the briefing's stated service goal
          on Critical faults. The 22d→≤7d warranty cycle is protected by the 72-hour entitlement window in KB §5.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Who wins, and how
        </h2>
        <p className="mb-3 text-xs text-slate-500">
          Five teams change their day-to-day the same week this ships.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => (
            <Card key={p.role} className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm">{p.role}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-700">{p.changeToday}</div>
                <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">How:</span> {p.how}
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-400">{p.buildPiece}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="border-slate-200 bg-slate-900 text-slate-100">
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wide text-slate-400">Reading order for the panel</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-200">
              <li><span className="font-medium">Triage</span> — live agent + the trust matrix. Run a fault; new cases and claims appear here within 10s.</li>
              <li><span className="font-medium">Asset 360</span> — the same object graph the agent assembles via BedrockAssetContext.</li>
              <li><span className="font-medium">Architecture</span> — green state today, MCP-mediated future, why not Data Cloud yet.</li>
              <li><span className="font-medium">Inventory</span> — every object, field, Apex action, and the agent topology, if the panel wants to drill in.</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
