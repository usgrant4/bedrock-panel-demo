import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TelemetryChart } from '@/components/TelemetryChart';
import { DEMO_ASSETS } from '@/lib/bedrock-config';

export default function Asset360() {
  const [selectedId, setSelectedId] = useState(DEMO_ASSETS[0].assetId);
  const asset = DEMO_ASSETS.find((a) => a.assetId === selectedId) ?? DEMO_ASSETS[0];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Asset 360</h1>
        <p className="mt-2 text-slate-600">
          Customer, contract, warranty and telemetry context for the demo assets. This is the same
          object graph the agent assembles through <span className="font-mono text-xs">BedrockAssetContext</span>.
          Live data will populate from <span className="font-mono text-xs">Bedrock_Asset__c</span> via GraphQL once the
          schema fetch step is complete; until then this surface shows the canonical demo assets seeded into SForg.
        </p>
      </section>

      <section>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Asset
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mt-1 block w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        >
          {DEMO_ASSETS.map((a) => (
            <option key={a.assetId} value={a.assetId}>
              {a.assetId} — {a.model} {a.modelClass} ({a.customer.name}, {a.customer.serviceTier})
            </option>
          ))}
        </select>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-mono text-base">{asset.assetId}</CardTitle>
                <div className="text-sm text-slate-600">
                  {asset.model} · {asset.modelClass} · S/N {asset.serial}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant={asset.warrantyStatus === 'Active' ? 'default' : 'secondary'}
                  className={
                    asset.warrantyStatus === 'Active'
                      ? 'bg-emerald-600'
                      : 'bg-slate-500 text-white'
                  }
                >
                  Warranty {asset.warrantyStatus}
                </Badge>
                <Badge
                  variant={asset.operatingStatus === 'Faulted' ? 'default' : 'secondary'}
                  className={
                    asset.operatingStatus === 'Faulted'
                      ? 'bg-rose-600'
                      : asset.operatingStatus === 'Maintenance'
                        ? 'bg-amber-500'
                        : 'bg-slate-400 text-white'
                  }
                >
                  {asset.operatingStatus}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Engine hours</div>
                <div className="font-medium">{asset.engineHours.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Location</div>
                <div className="font-medium">{asset.location}</div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Why this asset matters for the demo</div>
              <p className="mt-1 text-slate-700">{asset.whyDemo}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">Customer & Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Customer</div>
              <div className="font-medium">{asset.customer.name}</div>
              <div className="text-xs text-slate-500">
                {asset.customer.id} · {asset.customer.accountTier} · contact {asset.customer.primaryContact}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">Service tier</div>
              <Badge className="mt-1 bg-slate-900 text-white">{asset.customer.serviceTier}</Badge>
            </div>
            <div className="border-t border-slate-100 pt-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">Contract</div>
              <div className="font-mono text-xs">{asset.contract.id}</div>
              <div className="text-xs text-slate-600">
                {asset.contract.tier} · {asset.contract.status}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Annual value: ${asset.contract.annualValueUsd.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Ends {asset.contract.endDate}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Recent telemetry — Bedrock_Telemetry_Event__c</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TelemetryChart data={asset.recentTelemetry} />
          {asset.recentTelemetry.length > 0 && (
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Timestamp</th>
                  <th className="py-2 pr-3 font-medium">Fault</th>
                  <th className="py-2 pr-3 font-medium">Severity</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">RPM</th>
                  <th className="py-2 pr-3 font-medium">Coolant °C</th>
                  <th className="py-2 pr-3 font-medium">Hyd PSI</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {asset.recentTelemetry.map((t) => (
                  <tr key={t.eventId} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-slate-700">{t.timestamp}</td>
                    <td className="py-2 pr-3 font-mono">{t.faultCode}</td>
                    <td className="py-2 pr-3">
                      <Badge
                        className={
                          t.severity === 'Critical'
                            ? 'bg-rose-600'
                            : t.severity === 'High'
                              ? 'bg-amber-500'
                              : 'bg-slate-500 text-white'
                        }
                      >
                        {t.severity}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          t.resolution === 'Open'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }
                      >
                        {t.resolution}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono">{t.rpm}</td>
                    <td className="py-2 pr-3 font-mono">{t.coolantC}</td>
                    <td className="py-2 pr-3 font-mono">{t.hydPressurePsi}</td>
                    <td className="py-2 text-slate-600">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
