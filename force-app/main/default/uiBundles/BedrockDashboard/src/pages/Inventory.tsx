import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BEDROCK_OBJECTS,
  APEX_ACTIONS,
  AGENT_TOPOLOGY,
  KB_SECTIONS,
  ORG,
} from '@/lib/bedrock-config';

function trustBadge(trust: string) {
  const color =
    trust === 'Autonomous'
      ? 'bg-emerald-100 text-emerald-800'
      : trust === 'Recommend'
        ? 'bg-amber-100 text-amber-800'
        : trust === 'Human_Required'
          ? 'bg-rose-100 text-rose-800'
          : 'bg-slate-100 text-slate-600';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{trust}</span>;
}

export default function Inventory() {
  const totalRecords = BEDROCK_OBJECTS.reduce((acc, o) => acc + o.recordCount, 0);
  const stats = [
    { label: 'Custom objects', value: BEDROCK_OBJECTS.length.toString() },
    { label: 'Seeded records', value: totalRecords.toLocaleString() },
    { label: 'Apex @InvocableMethod actions', value: APEX_ACTIONS.length.toString() },
    { label: 'Agentforce agents', value: '1' },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Build Inventory</h1>
        <p className="mt-2 text-slate-600">
          Everything deployed in SForg under the <span className="font-mono text-xs">Bedrock_*</span> namespace.
          The agent, Apex actions, and objects are wired together: the agent calls the actions, the actions read
          and write the objects, the objects are scoped by the permission set.
        </p>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-slate-200">
              <CardContent className="pt-5">
                <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <div className="text-base font-medium font-mono text-slate-900 break-all">Bedrock_Demo_Admin</div>
              <div className="mt-1 text-xs text-slate-500">Permission set</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <div className="text-base font-medium font-mono text-slate-900 break-all">{ORG.name}</div>
              <div className="mt-1 text-xs text-slate-500">Target org · {ORG.alias}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Custom objects ({BEDROCK_OBJECTS.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {BEDROCK_OBJECTS.map((obj) => (
            <Card key={obj.apiName} className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-sm">{obj.apiName}</CardTitle>
                  <Badge variant="secondary">{obj.recordCount} records</Badge>
                </div>
                <div className="text-sm text-slate-500">{obj.label} · {obj.fields.length} fields</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  {obj.fields.map((f) => (
                    <div key={f.apiName} className="flex items-center justify-between">
                      <span className="font-mono text-slate-700">{f.apiName}</span>
                      <span className="text-slate-500">{f.type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Apex @InvocableMethod actions ({APEX_ACTIONS.length})
        </h2>
        <div className="space-y-4">
          {APEX_ACTIONS.map((act) => (
            <Card key={act.className} className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-sm">{act.className}.cls</CardTitle>
                  {trustBadge(act.trust)}
                </div>
                <div className="text-sm text-slate-600">{act.purpose}</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Inputs
                    </div>
                    <ul className="space-y-1 text-xs">
                      {act.inputs.map((i) => (
                        <li key={i.name} className="font-mono">
                          {i.name}: {i.type}{' '}
                          {i.required && <span className="text-rose-600">*</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Outputs
                    </div>
                    <ul className="space-y-1 text-xs">
                      {act.outputs.map((o) => (
                        <li key={o.name} className="font-mono">
                          {o.name}: {o.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Agent topology — Bedrock_Service_Triage
        </h2>
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="font-mono text-sm">
              <div className="font-semibold text-slate-900">{AGENT_TOPOLOGY.label}</div>
              <div className="ml-4 mt-1 space-y-1 border-l border-slate-300 pl-4 text-slate-700">
                {AGENT_TOPOLOGY.children?.map((sub) => (
                  <div key={sub.id}>
                    <div className="font-medium">{sub.label}</div>
                    {sub.children && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 text-xs">
                        {sub.children.map((act) => (
                          <div key={act.id} className="flex items-center gap-2">
                            <span>{act.label}</span>
                            {act.trust && trustBadge(act.trust)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Knowledge Base ({KB_SECTIONS.length} sections in Bedrock_KB_Section__c)
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {KB_SECTIONS.map((s) => (
            <Card key={s.number} className="border-slate-200">
              <CardContent className="pt-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Section {s.number}
                </div>
                <div className="mt-1 font-medium text-slate-900">{s.title}</div>
                <div className="mt-2 text-sm text-slate-600">{s.summary}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Permission set — Bedrock_Demo_Admin
        </h2>
        <Card className="border-slate-200">
          <CardContent className="pt-6 text-sm text-slate-700">
            <ul className="list-disc space-y-1 pl-5">
              <li>CRUD + viewAll + modifyAll on all 7 <span className="font-mono text-xs">Bedrock_*</span> objects</li>
              <li>Execute access on all 4 Apex classes</li>
              <li>Access to the <span className="font-mono text-xs">Bedrock_Service_Triage</span> agent</li>
              <li>Tab visibility on all 7 custom tabs</li>
              <li>Assigned to <span className="font-mono text-xs">ugrantiv@agentforce.com</span></li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
