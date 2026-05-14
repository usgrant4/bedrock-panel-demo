import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TRUST_COLOR_TOKENS,
  caseProvenance,
  claimProvenance,
} from '@/lib/trust-colors';

export interface ServiceCaseDetail {
  Id: string;
  Name: string;
  Subject__c?: string | null;
  Description__c?: string | null;
  Fault_Code__c?: string | null;
  Status__c?: string | null;
  Priority__c?: string | null;
  Origin__c?: string | null;
  Source_Event_Id__c?: string | null;
  CreatedDate: string;
  LastModifiedDate?: string | null;
  Customer__r?: {
    Account_Name__c?: string | null;
    Customer_Id__c?: string | null;
    Service_Tier__c?: string | null;
    Account_Tier__c?: string | null;
    Primary_Contact_Name__c?: string | null;
    Primary_Contact_Email__c?: string | null;
  } | null;
  Asset__r?: {
    Asset_Id__c?: string | null;
    Model__c?: string | null;
    Model_Class__c?: string | null;
    Serial_Number__c?: string | null;
    Warranty_Status__c?: string | null;
    Operating_Status__c?: string | null;
    Location__c?: string | null;
  } | null;
  lightningUrl: string;
}

export interface WarrantyClaimDetail {
  Id: string;
  Name: string;
  Fault_Code__c?: string | null;
  Claim_Status__c?: string | null;
  Estimated_Cost_USD__c?: number | null;
  CreatedDate: string;
  LastModifiedDate?: string | null;
  Submitted_Timestamp__c?: string | null;
  Notes__c?: string | null;
  Asset__r?: {
    Asset_Id__c?: string | null;
    Model__c?: string | null;
    Model_Class__c?: string | null;
    Serial_Number__c?: string | null;
    Warranty_Status__c?: string | null;
    Customer__r?: {
      Account_Name__c?: string | null;
      Service_Tier__c?: string | null;
    } | null;
  } | null;
  Service_Contract__r?: {
    Contract_Id__c?: string | null;
    Contract_Tier__c?: string | null;
    Annual_Value_USD__c?: number | null;
    Start_Date__c?: string | null;
    End_Date__c?: string | null;
    Status__c?: string | null;
  } | null;
  lightningUrl: string;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function formatCurrency(n: number | null | undefined): string {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function Field({ label, value, mono = false, multiline = false }: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? 'col-span-2' : ''}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 text-sm text-slate-900 ${mono ? 'font-mono' : ''} ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value ?? <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  );
}

function tierBadge(tier?: string | null) {
  if (!tier) return null;
  const color =
    tier === 'Platinum'
      ? 'bg-slate-700'
      : tier === 'Gold'
        ? 'bg-amber-500'
        : tier === 'Silver'
          ? 'bg-slate-400'
          : 'bg-amber-800';
  return <Badge className={`${color} text-white`}>{tier}</Badge>;
}

export function CaseDetailDialog({
  record,
  onClose,
}: {
  record: ServiceCaseDetail | null;
  onClose: () => void;
}) {
  const prov = caseProvenance();
  const t = TRUST_COLOR_TOKENS[prov.posture];
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-h-[90vh] max-w-3xl overflow-y-auto border-t-4 ${t.accentBorder.replace('border-l-', 'border-t-')}`}>
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-lg pr-8">{record.Name}</DialogTitle>
              <DialogDescription>
                Bedrock_Service_Case__c · Read-only consumer view via Salesforce REST
              </DialogDescription>
              <div className="flex items-center gap-2 pt-1">
                {record.Priority__c && (
                  <Badge variant="outline">{record.Priority__c}</Badge>
                )}
                {record.Status__c && (
                  <Badge>{record.Status__c}</Badge>
                )}
              </div>
              <div className={`mt-3 rounded-md border ${t.tintedBg} p-3`}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.solid}`}>
                    {t.label}
                  </span>
                  <span className="font-mono text-xs text-slate-700">created by {prov.action}</span>
                </div>
                {prov.detail && (
                  <div className={`mt-1 text-xs ${t.text}`}>{prov.detail}</div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <Section title="Fault details">
                <Field label="Fault Code" value={record.Fault_Code__c} mono />
                <Field label="Origin" value={record.Origin__c} />
                <Field label="Subject" value={record.Subject__c} multiline />
                <Field label="Description" value={record.Description__c} multiline />
                <Field label="Source Event Id" value={record.Source_Event_Id__c} mono />
              </Section>

              <Section title="Asset">
                <Field label="Asset Id" value={record.Asset__r?.Asset_Id__c} mono />
                <Field label="Model" value={record.Asset__r?.Model__c} />
                <Field label="Model Class" value={record.Asset__r?.Model_Class__c} />
                <Field label="Serial Number" value={record.Asset__r?.Serial_Number__c} mono />
                <Field label="Warranty Status" value={record.Asset__r?.Warranty_Status__c} />
                <Field label="Operating Status" value={record.Asset__r?.Operating_Status__c} />
                <Field label="Location" value={record.Asset__r?.Location__c} multiline />
              </Section>

              <Section title="Customer">
                <Field label="Account" value={record.Customer__r?.Account_Name__c} />
                <Field label="Customer Id" value={record.Customer__r?.Customer_Id__c} mono />
                <Field
                  label="Service Tier"
                  value={tierBadge(record.Customer__r?.Service_Tier__c) ?? record.Customer__r?.Service_Tier__c}
                />
                <Field label="Account Tier" value={record.Customer__r?.Account_Tier__c} />
                <Field label="Primary Contact" value={record.Customer__r?.Primary_Contact_Name__c} />
                <Field label="Contact Email" value={record.Customer__r?.Primary_Contact_Email__c} mono />
              </Section>

              <Section title="Timeline">
                <Field label="Created" value={formatDateTime(record.CreatedDate)} />
                <Field label="Last Modified" value={formatDateTime(record.LastModifiedDate)} />
              </Section>
            </div>

            <DialogFooter>
              <Button variant="outline" asChild>
                <a href={record.lightningUrl} target="_blank" rel="noopener noreferrer">
                  Open in Salesforce ↗
                </a>
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ClaimDetailDialog({
  record,
  onClose,
}: {
  record: WarrantyClaimDetail | null;
  onClose: () => void;
}) {
  const prov = claimProvenance(record?.Submitted_Timestamp__c);
  const t = TRUST_COLOR_TOKENS[prov.posture];
  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-h-[90vh] max-w-3xl overflow-y-auto border-t-4 ${t.accentBorder.replace('border-l-', 'border-t-')}`}>
        {record && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-lg pr-8">{record.Name}</DialogTitle>
              <DialogDescription>
                Bedrock_Warranty_Claim__c · Read-only consumer view via Salesforce REST
              </DialogDescription>
              <div className="flex items-center gap-2 pt-1">
                {typeof record.Estimated_Cost_USD__c === 'number' && (
                  <Badge variant="outline">{formatCurrency(record.Estimated_Cost_USD__c)}</Badge>
                )}
                {record.Claim_Status__c && (
                  <Badge>{record.Claim_Status__c}</Badge>
                )}
              </div>
              <div className={`mt-3 rounded-md border ${t.tintedBg} p-3`}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.solid}`}>
                    {t.label}
                  </span>
                  <span className="font-mono text-xs text-slate-700">created by {prov.action}</span>
                </div>
                {prov.detail && (
                  <div className={`mt-1 text-xs ${t.text}`}>{prov.detail}</div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <Section title="Fault details">
                <Field label="Fault Code" value={record.Fault_Code__c} mono />
                <Field label="Estimated Cost" value={formatCurrency(record.Estimated_Cost_USD__c)} />
                <Field label="Notes" value={record.Notes__c} multiline />
              </Section>

              <Section title="Asset">
                <Field label="Asset Id" value={record.Asset__r?.Asset_Id__c} mono />
                <Field label="Model" value={record.Asset__r?.Model__c} />
                <Field label="Model Class" value={record.Asset__r?.Model_Class__c} />
                <Field label="Serial Number" value={record.Asset__r?.Serial_Number__c} mono />
                <Field label="Warranty Status" value={record.Asset__r?.Warranty_Status__c} />
              </Section>

              <Section title="Customer">
                <Field label="Account" value={record.Asset__r?.Customer__r?.Account_Name__c} />
                <Field
                  label="Service Tier"
                  value={tierBadge(record.Asset__r?.Customer__r?.Service_Tier__c) ?? record.Asset__r?.Customer__r?.Service_Tier__c}
                />
              </Section>

              <Section title="Service Contract">
                <Field label="Contract Id" value={record.Service_Contract__r?.Contract_Id__c} mono />
                <Field
                  label="Contract Tier"
                  value={tierBadge(record.Service_Contract__r?.Contract_Tier__c) ?? record.Service_Contract__r?.Contract_Tier__c}
                />
                <Field label="Annual Value" value={formatCurrency(record.Service_Contract__r?.Annual_Value_USD__c)} />
                <Field label="Status" value={record.Service_Contract__r?.Status__c} />
                <Field label="Start" value={formatDate(record.Service_Contract__r?.Start_Date__c)} />
                <Field label="End" value={formatDate(record.Service_Contract__r?.End_Date__c)} />
              </Section>

              <Section title="Timeline">
                <Field label="Created" value={formatDateTime(record.CreatedDate)} />
                <Field label="Last Modified" value={formatDateTime(record.LastModifiedDate)} />
                <Field label="Submitted" value={formatDateTime(record.Submitted_Timestamp__c)} />
              </Section>
            </div>

            <DialogFooter>
              <Button variant="outline" asChild>
                <a href={record.lightningUrl} target="_blank" rel="noopener noreferrer">
                  Open in Salesforce ↗
                </a>
              </Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
