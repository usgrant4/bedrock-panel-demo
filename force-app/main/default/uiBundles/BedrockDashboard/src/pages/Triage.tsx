import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveRecordsCard } from '@/components/LiveRecordsCard';
import { AgentChat } from '@/components/AgentChat';
import {
  CaseDetailDialog,
  ClaimDetailDialog,
  type ServiceCaseDetail,
  type WarrantyClaimDetail,
} from '@/components/RecordDetailDialog';
import { TRUST_MATRIX, DEMO_NARRATIVE } from '@/lib/bedrock-config';
import {
  TRUST_COLOR_TOKENS,
  caseProvenance,
  claimProvenance,
} from '@/lib/trust-colors';

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return `${Math.max(1, Math.floor(diffMs / 1000))}s ago`;
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function trustBadge(posture: 'Autonomous' | 'Recommend' | 'Human_Required') {
  const t = TRUST_COLOR_TOKENS[posture];
  return <Badge className={t.solid}>{t.label}</Badge>;
}

export default function Triage() {
  const [selectedCase, setSelectedCase] = useState<ServiceCaseDetail | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimDetail | null>(null);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Triage Console</h1>
        <p className="mt-2 text-slate-600">
          Live <span className="font-mono text-xs">Bedrock_Service_Triage</span> agent embedded in this surface.
          The trust matrix on the right governs which actions the agent runs autonomously vs which it surfaces
          for human approval — same policy whether you exercise it from this page or from the Lightning
          Agentforce panel.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Agentforce conversation</CardTitle>
              <div className="text-xs text-slate-500">
                Live <span className="font-mono">Bedrock_Customer_Service</span> agent (AgentforceServiceAgent type)
                invoked off-platform via the public Agent API at <span className="font-mono">api.salesforce.com/einstein/ai-agent/v1</span>.
                Bearer token minted by the Vercel serverless function using OAuth 2.0 Client Credentials with
                JWT issuance. Same Agent Script logic and §5 trust matrix as the in-org <span className="font-mono">Bedrock_Service_Triage</span> Employee Agent.
              </div>
            </CardHeader>
            <CardContent>
              <AgentChat />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Trust matrix</CardTitle>
              <div className="text-xs text-slate-500">
                Color-keyed to the rail rows below — green border = action created the record autonomously per the §5 trust matrix.
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TRUST_MATRIX.map((row) => {
                  const t = TRUST_COLOR_TOKENS[row.posture];
                  const firedThisSession =
                    row.action === 'open_service_case' || row.action === 'stage_warranty_claim';
                  return (
                    <div
                      key={row.action}
                      className={`rounded-md border border-l-4 ${t.accentBorder} ${t.tintedBg} p-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-800">{row.action}</span>
                        <div className="flex items-center gap-1.5">
                          {firedThisSession && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${t.solid}`}>
                              ● Active
                            </span>
                          )}
                          {trustBadge(row.posture)}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">{row.rationale}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LiveRecordsCard<ServiceCaseDetail>
          title="Recent Bedrock_Service_Case__c"
          endpoint="/api/recent-cases"
          emptyMessage="No cases yet. Run a triage in the agent to create one."
          getKey={(c) => c.Id}
          getCreatedAt={(c) => c.CreatedDate}
          renderRow={(c, isNew) => {
            const prov = caseProvenance();
            const t = TRUST_COLOR_TOKENS[prov.posture];
            return (
              <button
                type="button"
                onClick={() => setSelectedCase(c)}
                className={`block w-full text-left rounded-md border border-l-4 border-slate-200 ${t.accentBorder} p-3 transition-colors hover:bg-slate-50 ${isNew ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-900">{c.Name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.solid}`}>
                      {t.label}
                    </span>
                  </div>
                  <span className={`text-xs ${isNew ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}>
                    {isNew && '● NEW · '}{relativeTime(c.CreatedDate)}
                  </span>
                </div>
                <div className="mt-1.5 text-sm text-slate-700">{c.Subject__c}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  {c.Asset__r?.Asset_Id__c && <span className="font-mono">{c.Asset__r.Asset_Id__c}</span>}
                  {c.Fault_Code__c && <span className="font-mono">{c.Fault_Code__c}</span>}
                  {c.Priority__c && <span>Priority: {c.Priority__c}</span>}
                  {c.Status__c && <span>Status: {c.Status__c}</span>}
                </div>
                {c.Customer__r?.Account_Name__c && (
                  <div className="mt-1 text-xs text-slate-400">{c.Customer__r.Account_Name__c}</div>
                )}
                <div className={`mt-1.5 text-[10px] ${t.text}`}>↳ created by {prov.action} · click for full record</div>
              </button>
            );
          }}
        />

        <LiveRecordsCard<WarrantyClaimDetail>
          title="Recent Bedrock_Warranty_Claim__c"
          endpoint="/api/recent-claims"
          emptyMessage="No staged claims yet. Triage an in-warranty asset to stage one."
          getKey={(w) => w.Id}
          getCreatedAt={(w) => w.CreatedDate}
          renderRow={(w, isNew) => {
            const prov = claimProvenance(w.Submitted_Timestamp__c);
            const t = TRUST_COLOR_TOKENS[prov.posture];
            return (
              <button
                type="button"
                onClick={() => setSelectedClaim(w)}
                className={`block w-full text-left rounded-md border border-l-4 border-slate-200 ${t.accentBorder} p-3 transition-colors hover:bg-slate-50 ${isNew ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-900">{w.Name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.solid}`}>
                      {t.label}
                    </span>
                  </div>
                  <span className={`text-xs ${isNew ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}>
                    {isNew && '● NEW · '}{relativeTime(w.CreatedDate)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  {w.Asset__r?.Asset_Id__c && <span className="font-mono">{w.Asset__r.Asset_Id__c}</span>}
                  {w.Fault_Code__c && <span className="font-mono">{w.Fault_Code__c}</span>}
                  {w.Claim_Status__c && <span>Status: {w.Claim_Status__c}</span>}
                  {typeof w.Estimated_Cost_USD__c === 'number' && (
                    <span>${w.Estimated_Cost_USD__c.toLocaleString()}</span>
                  )}
                </div>
                {w.Asset__r?.Customer__r?.Account_Name__c && (
                  <div className="mt-1 text-xs text-slate-400">{w.Asset__r.Customer__r.Account_Name__c}</div>
                )}
                {w.Notes__c && (
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">{w.Notes__c}</div>
                )}
                <div className={`mt-1.5 text-[10px] ${t.text}`}>↳ created by {prov.action} · click for full record</div>
              </button>
            );
          }}
        />
      </div>

      <Card className="border-slate-200 bg-slate-900 text-slate-100">
        <CardContent className="pt-6 text-sm">
          <div className="text-xs uppercase tracking-wide text-slate-400">Demo scenario</div>
          <div className="mt-1 text-base font-medium">{DEMO_NARRATIVE.scenario}</div>
          <div className="mt-2 text-slate-300">
            Customer: {DEMO_NARRATIVE.customer} · Asset: {DEMO_NARRATIVE.headlineAsset} · Fault: {DEMO_NARRATIVE.headlineFault}
          </div>
        </CardContent>
      </Card>

      <CaseDetailDialog record={selectedCase} onClose={() => setSelectedCase(null)} />
      <ClaimDetailDialog record={selectedClaim} onClose={() => setSelectedClaim(null)} />
    </div>
  );
}
