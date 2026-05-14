/**
 * Static configuration mirroring what's deployed to SForg.
 * KPI values default to constants derived from the seeded dataset; live values
 * (when GraphQL is wired up) override these in the relevant pages.
 */

export type TrustPosture = 'Autonomous' | 'Recommend' | 'Human_Required';

export interface BedrockObjectSpec {
  apiName: string;
  label: string;
  recordCount: number;
  fields: { apiName: string; type: string; note?: string }[];
}

export interface BedrockApexAction {
  className: string;
  purpose: string;
  inputs: { name: string; type: string; required: boolean }[];
  outputs: { name: string; type: string }[];
  trust: TrustPosture | 'N/A — read-only';
}

export interface AgentNode {
  id: string;
  label: string;
  type: 'router' | 'subagent' | 'action';
  trust?: TrustPosture;
  children?: AgentNode[];
}

export const ORG = {
  alias: 'ugrantiv@agentforce.com',
  name: 'SForg (Developer Edition)',
  loginUrl: 'https://login.salesforce.com',
};

export const KPI_TARGETS = {
  fleetMttrHours: { current: 11.4, target: 6, unit: 'h', label: 'Fleet MTTR (Critical)' },
  warrantyCycleDays: { current: 22, target: 7, unit: 'd', label: 'Warranty cycle time' },
  arrAtRiskUsd: { current: 1_020_000, target: 0, unit: '$', label: 'ARR at risk' },
  openCriticalFaults30d: { current: 3, target: 0, unit: '', label: 'Open Critical faults (30d)' },
};

export const BEDROCK_OBJECTS: BedrockObjectSpec[] = [
  {
    apiName: 'Bedrock_Customer__c',
    label: 'Customer',
    recordCount: 10,
    fields: [
      { apiName: 'Customer_Id__c', type: 'Text (External ID)' },
      { apiName: 'Account_Name__c', type: 'Text' },
      { apiName: 'Account_Tier__c', type: 'Text' },
      { apiName: 'Service_Tier__c', type: 'Picklist: Platinum/Gold/Silver/Bronze' },
      { apiName: 'Primary_Contact_Name__c', type: 'Text' },
      { apiName: 'Primary_Contact_Email__c', type: 'Email' },
      { apiName: 'Country__c', type: 'Text' },
    ],
  },
  {
    apiName: 'Bedrock_Asset__c',
    label: 'Asset',
    recordCount: 37,
    fields: [
      { apiName: 'Asset_Id__c', type: 'Text (External ID)' },
      { apiName: 'Customer__c', type: 'Lookup → Customer' },
      { apiName: 'Model__c', type: 'Text' },
      { apiName: 'Model_Class__c', type: 'Text' },
      { apiName: 'Serial_Number__c', type: 'Text' },
      { apiName: 'Engine_Hours__c', type: 'Number' },
      { apiName: 'Contract_Status__c', type: 'Picklist' },
      { apiName: 'Warranty_Status__c', type: 'Picklist: Active/Expired/In-Service-Plan' },
      { apiName: 'Operating_Status__c', type: 'Picklist' },
      { apiName: 'Location__c', type: 'Text' },
      { apiName: 'Latitude__c', type: 'Number' },
      { apiName: 'Longitude__c', type: 'Number' },
    ],
  },
  {
    apiName: 'Bedrock_Service_Contract__c',
    label: 'Service Contract',
    recordCount: 37,
    fields: [
      { apiName: 'Contract_Id__c', type: 'Text (External ID)' },
      { apiName: 'Customer__c', type: 'Lookup → Customer' },
      { apiName: 'Asset__c', type: 'Lookup → Asset' },
      { apiName: 'Contract_Tier__c', type: 'Picklist' },
      { apiName: 'Start_Date__c', type: 'Date' },
      { apiName: 'End_Date__c', type: 'Date' },
      { apiName: 'Term_Months__c', type: 'Number' },
      { apiName: 'Annual_Value_USD__c', type: 'Currency' },
      { apiName: 'Status__c', type: 'Picklist' },
    ],
  },
  {
    apiName: 'Bedrock_Telemetry_Event__c',
    label: 'Telemetry Event',
    recordCount: 80,
    fields: [
      { apiName: 'Event_Id__c', type: 'Text (External ID)' },
      { apiName: 'Asset__c', type: 'Lookup → Asset' },
      { apiName: 'Fault_Code__c', type: 'Text' },
      { apiName: 'Severity__c', type: 'Picklist: Critical/High/Medium/Low' },
      { apiName: 'Event_Timestamp__c', type: 'DateTime' },
      { apiName: 'Resolution_Status__c', type: 'Picklist: Open/Resolved' },
      { apiName: 'Resolved_Timestamp__c', type: 'DateTime' },
      { apiName: 'RPM__c', type: 'Number' },
      { apiName: 'Coolant_Temp_C__c', type: 'Number' },
      { apiName: 'Hydraulic_Pressure_PSI__c', type: 'Number' },
      { apiName: 'Description__c', type: 'Text' },
    ],
  },
  {
    apiName: 'Bedrock_KB_Section__c',
    label: 'Knowledge Base Section',
    recordCount: 7,
    fields: [
      { apiName: 'Section_Number__c', type: 'Number' },
      { apiName: 'Body__c', type: 'Long Text (SOSL searchable)' },
      { apiName: 'Keywords__c', type: 'Text' },
    ],
  },
  {
    apiName: 'Bedrock_Service_Case__c',
    label: 'Service Case',
    recordCount: 0,
    fields: [
      { apiName: 'Name', type: 'Auto-number BSV-{00000}' },
      { apiName: 'Customer__c', type: 'Lookup → Customer' },
      { apiName: 'Asset__c', type: 'Lookup → Asset' },
      { apiName: 'Subject__c', type: 'Text' },
      { apiName: 'Description__c', type: 'Text' },
      { apiName: 'Priority__c', type: 'Picklist' },
      { apiName: 'Status__c', type: 'Picklist' },
      { apiName: 'Origin__c', type: 'Picklist' },
      { apiName: 'Fault_Code__c', type: 'Text' },
      { apiName: 'Source_Event_Id__c', type: 'Text', note: 'links to Telemetry_Event' },
    ],
  },
  {
    apiName: 'Bedrock_Warranty_Claim__c',
    label: 'Warranty Claim',
    recordCount: 0,
    fields: [
      { apiName: 'Name', type: 'Auto-number BWC-{00000}' },
      { apiName: 'Asset__c', type: 'Lookup → Asset' },
      { apiName: 'Service_Contract__c', type: 'Lookup → Service Contract' },
      { apiName: 'Fault_Code__c', type: 'Text' },
      { apiName: 'Claim_Status__c', type: 'Picklist: Staged/Submitted' },
      { apiName: 'Estimated_Cost_USD__c', type: 'Currency' },
      { apiName: 'Submitted_Timestamp__c', type: 'DateTime' },
      { apiName: 'Notes__c', type: 'Text' },
    ],
  },
];

export const APEX_ACTIONS: BedrockApexAction[] = [
  {
    className: 'BedrockAssetContext',
    purpose: 'Resolve customer 360 (asset + contract + warranty + KPI rollups) for agent grounding.',
    inputs: [{ name: 'assetId', type: 'String', required: true }],
    outputs: [
      { name: 'found', type: 'Boolean' },
      { name: 'customerId', type: 'String' },
      { name: 'customerName', type: 'String' },
      { name: 'serviceTier', type: 'String' },
      { name: 'warrantyActive', type: 'Boolean' },
      { name: 'contractId', type: 'String' },
      { name: 'annualContractValueUsd', type: 'Decimal' },
      { name: 'openCriticalFaults30d', type: 'Integer' },
      { name: 'arrAtRiskUsd', type: 'Decimal' },
      { name: 'contextJson', type: 'String' },
    ],
    trust: 'N/A — read-only',
  },
  {
    className: 'BedrockKnowledge',
    purpose: 'SOSL retrieval over KB sections; returns top-K with citations.',
    inputs: [
      { name: 'query', type: 'String', required: true },
      { name: 'topK', type: 'Integer', required: false },
    ],
    outputs: [
      { name: 'sectionsJson', type: 'String' },
      { name: 'citations', type: 'String' },
      { name: 'hitCount', type: 'Integer' },
    ],
    trust: 'N/A — read-only',
  },
  {
    className: 'BedrockOpenCase',
    purpose: 'Open a Bedrock_Service_Case__c record for a triaged fault.',
    inputs: [
      { name: 'assetId', type: 'String', required: true },
      { name: 'customerId', type: 'String', required: true },
      { name: 'faultCode', type: 'String', required: true },
      { name: 'severity', type: 'String', required: true },
      { name: 'description', type: 'String', required: true },
      { name: 'sourceEventId', type: 'String', required: false },
    ],
    outputs: [
      { name: 'caseId', type: 'Id' },
      { name: 'caseNumber', type: 'String' },
      { name: 'subject', type: 'String' },
      { name: 'status', type: 'String' },
    ],
    trust: 'Autonomous',
  },
  {
    className: 'BedrockStageWarranty',
    purpose: 'Stage a warranty claim inside the 72h KB Section 5 entitlement window. Submission stays human-required.',
    inputs: [
      { name: 'assetId', type: 'String', required: true },
      { name: 'faultCode', type: 'String', required: true },
      { name: 'contractId', type: 'String', required: true },
      { name: 'estimatedCostUsd', type: 'Decimal', required: true },
      { name: 'notes', type: 'String', required: false },
    ],
    outputs: [
      { name: 'claimId', type: 'Id' },
      { name: 'claimNumber', type: 'String' },
      { name: 'status', type: 'String' },
    ],
    trust: 'Autonomous',
  },
];

export const TRUST_MATRIX: { action: string; posture: TrustPosture; rationale: string }[] = [
  {
    action: 'open_service_case',
    posture: 'Autonomous',
    rationale: 'Creating a case is reversible and grounds downstream activity; agent should not wait on humans for this.',
  },
  {
    action: 'stage_warranty_claim',
    posture: 'Autonomous',
    rationale: 'Staging (not submitting) protects the 72h entitlement window per KB Section 5. Human approves submission.',
  },
  {
    action: 'dispatch_technician',
    posture: 'Recommend',
    rationale: 'Field labor commitment; surface recommendation with rationale, require dispatcher approval.',
  },
  {
    action: 'ship_part',
    posture: 'Recommend',
    rationale: 'Parts inventory + freight cost; recommend the SKUs from KB Section 1 and let logistics confirm.',
  },
  {
    action: 'preposition_parts_to_dealer',
    posture: 'Recommend',
    rationale: 'Useful pattern for fleet sweeps; dealer ops should choose timing and quantity.',
  },
  {
    action: 'draft_customer_message',
    posture: 'Recommend',
    rationale: 'Customer-facing copy; agent drafts, account rep edits and sends.',
  },
  {
    action: 'escalate_to_bedrock_engineer',
    posture: 'Human_Required',
    rationale: 'Cross-org escalation; never automatic. Surfaces the case and waits for a named owner.',
  },
];

export const AGENT_TOPOLOGY: AgentNode = {
  id: 'agent_router',
  label: 'Bedrock_Service_Triage (router)',
  type: 'router',
  children: [
    {
      id: 'fault_triage',
      label: 'fault_triage (subagent)',
      type: 'subagent',
      children: [
        { id: 'capture_fault_details', label: 'capture_fault_details', type: 'action' },
        { id: 'get_asset_context', label: 'get_asset_context → BedrockAssetContext', type: 'action' },
        { id: 'retrieve_knowledge', label: 'retrieve_knowledge → BedrockKnowledge', type: 'action' },
        { id: 'open_service_case', label: 'open_service_case → BedrockOpenCase', type: 'action', trust: 'Autonomous' },
        { id: 'stage_warranty_claim', label: 'stage_warranty_claim → BedrockStageWarranty', type: 'action', trust: 'Autonomous' },
      ],
    },
    {
      id: 'off_topic',
      label: 'off_topic (subagent)',
      type: 'subagent',
    },
  ],
};

export const KB_SECTIONS = [
  { number: 1, title: 'Fault Code Reference', summary: 'Critical codes (HYD-447, COOL-220, ENG-105, VIB-654) + parts (HYD-MP-9912, HYD-RV-2204, COOL-RC-7700, ENG-OPS-1180).' },
  { number: 2, title: 'Service Contract Entitlements by Tier', summary: 'What each tier (Platinum / Gold / Silver / Bronze) is entitled to: response times, included parts, escalation paths.' },
  { number: 3, title: 'Response SLAs', summary: 'SLA grid: Critical 4h Platinum → best-effort Bronze. Medium 24h Platinum → 5d target Silver.' },
  { number: 4, title: 'Parts Logistics', summary: 'Dealer-stocked vs centrally-shipped parts, freight tiers, preposition rules for known seasonal fault sweeps.' },
  { number: 5, title: 'Warranty Claim Workflow', summary: '72-hour staging window after first fault detection. Agent stages; service ops submits within 7 days.' },
  { number: 6, title: 'Escalation Rules', summary: 'When to escalate to Bedrock engineering. Cross-org; always human-routed.' },
  { number: 7, title: 'Operating Guardrails', summary: 'What the agent must NOT do: dispatch without approval, ship parts on its own, message customers directly.' },
];

export const DEMO_NARRATIVE = {
  scenario: 'Bedrock Heavy Equipment — Proactive Service for Connected Equipment',
  customer: 'Pinnacle Mining Group (CUST-10001)',
  headlineAsset: 'ASSET-50101 (HT-797 Haul Truck)',
  headlineFault: 'HYD-447 Critical hydraulic pressure spike',
  panel: 'Salesforce Innovation Technical Architect',
};

export const ARCHITECTURE_NARRATIVE = `
**Federation vs Ingestion** — Bedrock has 2.4 PB of telemetry in Snowflake on AWS. Federate via
Data Cloud zero-copy rather than ingest; pay only for the slices the agent actually reads at decision time.

**Six-step pattern**:
1. Event arrives (telemetry webhook) — surfaced to the dealer service rep.
2. Context assembly — Apex \`BedrockAssetContext\` joins Customer / Asset / Service Contract / recent Telemetry.
3. Reasoning — Agentforce agent with KB grounding via \`BedrockKnowledge\` (SOSL over Bedrock_KB_Section__c).
4. Action — \`BedrockOpenCase\` (autonomous) + \`BedrockStageWarranty\` (autonomous if in 72h window).
5. Trust gate — Recommend / Human-required actions wait for the rep's hand on the wheel.
6. Outcome — Case + claim records; MTTR clock starts; warranty entitlement preserved.

**Federation losers on cost/latency**: full-text scans across cold tiers, ad-hoc analyst exploration, model
training on multi-year history. Those still ingest. Per-fault triage reads, which are sparse and time-windowed,
are the federation sweet spot.

**Trade-off least happy with**: TF-IDF KB retrieval in the off-platform Streamlit version is brittle for
synonymy. In the Salesforce build it's SOSL (good enough for keyword recall) + plan to upgrade to Data Cloud
vector search once volume justifies it.
`.trim();

export interface DemoAsset {
  assetId: string;
  model: string;
  modelClass: string;
  serial: string;
  engineHours: number;
  warrantyStatus: 'Active' | 'Expired';
  operatingStatus: 'Operational' | 'Faulted' | 'Maintenance';
  location: string;
  customer: {
    id: string;
    name: string;
    accountTier: string;
    serviceTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    primaryContact: string;
  };
  contract: {
    id: string;
    tier: string;
    annualValueUsd: number;
    endDate: string;
    status: string;
  };
  recentTelemetry: {
    eventId: string;
    timestamp: string;
    faultCode: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    resolution: 'Open' | 'Resolved';
    rpm: number;
    coolantC: number;
    hydPressurePsi: number;
    description: string;
  }[];
  whyDemo: string;
}

export const DEMO_ASSETS: DemoAsset[] = [
  {
    assetId: 'ASSET-50101',
    model: 'HT-797',
    modelClass: 'Haul Truck',
    serial: 'PMG-77234',
    engineHours: 3420,
    warrantyStatus: 'Active',
    operatingStatus: 'Faulted',
    location: 'Bingham Canyon Mine, UT',
    customer: {
      id: 'CUST-10001',
      name: 'Pinnacle Mining Group',
      accountTier: 'Strategic',
      serviceTier: 'Platinum',
      primaryContact: 'Sarah Chen',
    },
    contract: {
      id: 'CON-50101',
      tier: 'Platinum',
      annualValueUsd: 515_000,
      endDate: '2025-10-03',
      status: 'Active',
    },
    recentTelemetry: [
      { eventId: 'EVT-202605090618-50101', timestamp: '2026-05-09 06:18', faultCode: 'HYD-447', severity: 'Critical', resolution: 'Open', rpm: 2160, coolantC: 102, hydPressurePsi: 4280, description: 'Hydraulic pressure spike — main pump output beyond 4250 psi for 47s' },
      { eventId: 'EVT-202604271200-50101', timestamp: '2026-04-27 12:00', faultCode: 'COOL-220', severity: 'Critical', resolution: 'Resolved', rpm: 1767, coolantC: 119, hydPressurePsi: 2026, description: 'Coolant temperature elevated — sustained >118C for 6+ minutes' },
      { eventId: 'EVT-202603251900-50101', timestamp: '2026-03-25 19:00', faultCode: 'COOL-220', severity: 'Critical', resolution: 'Open', rpm: 1896, coolantC: 123, hydPressurePsi: 2074, description: 'Coolant temperature elevated — sustained >118C for 6+ minutes' },
    ],
    whyDemo: 'Headline demo asset — Pinnacle Mining Platinum tier, active warranty, open Critical HYD-447. Triggers all 5 agent tools and produces both a Service Case and a Warranty Claim record.',
  },
  {
    assetId: 'ASSET-50203',
    model: 'WL-988',
    modelClass: 'Wheel Loader',
    serial: 'GCP-98801',
    engineHours: 12_200,
    warrantyStatus: 'Expired',
    operatingStatus: 'Operational',
    location: 'Tucson Yard, AZ',
    customer: {
      id: 'CUST-10002',
      name: 'Granite Construction Partners',
      accountTier: 'Strategic',
      serviceTier: 'Gold',
      primaryContact: 'Marcus Holloway',
    },
    contract: {
      id: 'CON-50203',
      tier: 'Gold',
      annualValueUsd: 305_000,
      endDate: '2025-06-07',
      status: 'Active',
    },
    recentTelemetry: [
      { eventId: 'EVT-203-DEMO', timestamp: '2026-05-08 14:22', faultCode: 'HYD-447', severity: 'Critical', resolution: 'Open', rpm: 1980, coolantC: 96, hydPressurePsi: 4310, description: 'Hydraulic pressure spike — replacement parts ordered earlier this quarter' },
    ],
    whyDemo: 'Trust-boundary demo — same fault as ASSET-50101 but warranty EXPIRED. Agent must skip stage_warranty_claim and quote the Gold-tier 8h SLA instead of Platinum 4h. Proves the trust matrix is not theatre.',
  },
  {
    assetId: 'ASSET-50105',
    model: 'D-9000',
    modelClass: 'Dozer',
    serial: 'PMG-90119',
    engineHours: 2870,
    warrantyStatus: 'Active',
    operatingStatus: 'Faulted',
    location: 'Bingham Canyon Mine, UT',
    customer: {
      id: 'CUST-10001',
      name: 'Pinnacle Mining Group',
      accountTier: 'Strategic',
      serviceTier: 'Platinum',
      primaryContact: 'Sarah Chen',
    },
    contract: {
      id: 'CON-50105',
      tier: 'Platinum',
      annualValueUsd: 505_000,
      endDate: '2025-08-21',
      status: 'Active',
    },
    recentTelemetry: [
      { eventId: 'EVT-105-COOL', timestamp: '2026-05-07 09:11', faultCode: 'COOL-220', severity: 'Critical', resolution: 'Open', rpm: 1640, coolantC: 121, hydPressurePsi: 2050, description: 'Coolant temperature alarm — preposition cooler radiator (KB Section 1)' },
    ],
    whyDemo: 'Backup headline if ASSET-50101 has issues — same customer, same Platinum tier, different fault family (COOL-220).',
  },
  {
    assetId: 'ASSET-50403',
    model: 'D-9000',
    modelClass: 'Dozer',
    serial: 'NBQ-90410',
    engineHours: 11_850,
    warrantyStatus: 'Expired',
    operatingStatus: 'Maintenance',
    location: 'Sudbury Quarry, ON',
    customer: {
      id: 'CUST-10004',
      name: 'Northbridge Quarry Inc',
      accountTier: 'Enterprise',
      serviceTier: 'Silver',
      primaryContact: 'Ryan Becker',
    },
    contract: {
      id: 'CON-50403',
      tier: 'Silver',
      annualValueUsd: 130_000,
      endDate: '2025-04-30',
      status: 'Expired',
    },
    recentTelemetry: [],
    whyDemo: 'Dual-expired edge case — both warranty and service contract have lapsed. Tests the cleanest version of "out of all entitlements" reasoning.',
  },
  {
    assetId: 'ASSET-50801',
    model: 'BL-650',
    modelClass: 'Backhoe Loader',
    serial: 'RBC-65240',
    engineHours: 4720,
    warrantyStatus: 'Expired',
    operatingStatus: 'Operational',
    location: 'Memphis Site, TN',
    customer: {
      id: 'CUST-10008',
      name: 'Riverbend Construction',
      accountTier: 'Mid-Market',
      serviceTier: 'Silver',
      primaryContact: 'Carl Jensen',
    },
    contract: {
      id: 'CON-50801',
      tier: 'Silver',
      annualValueUsd: 130_000,
      endDate: '2026-02-16',
      status: 'Active',
    },
    recentTelemetry: [
      { eventId: 'EVT-801-BRK', timestamp: '2026-05-06 11:00', faultCode: 'BRK-512', severity: 'Medium', resolution: 'Open', rpm: 1820, coolantC: 92, hydPressurePsi: 2400, description: 'Medium-severity brake wear alert — schedule next service interval' },
    ],
    whyDemo: 'Non-critical severity demo — Medium BRK-512. Agent should quote Silver Medium SLA ("5 d target") verbatim from KB Section 3 and stay out of autonomous mode.',
  },
];

export interface Persona {
  role: string;
  changeToday: string;
  how: string;
  buildPiece: string;
}

export const PERSONAS: Persona[] = [
  {
    role: 'Dealer service rep',
    changeToday: '~30 min of context-gathering collapses to under a minute. Case opens autonomously when the agent reasons over a Critical fault.',
    how: 'BedrockAssetContext pre-assembles the customer + asset + contract + 30d fault rollup in one Apex call.',
    buildPiece: 'BedrockAssetContext · BedrockOpenCase (Autonomous)',
  },
  {
    role: 'Warranty admin',
    changeToday: 'Warranty cycle compresses from 22d to ≤7d. The 72-hour entitlement window is never lost.',
    how: 'BedrockStageWarranty is Autonomous within the KB Section 5 staging window; admin only approves submission.',
    buildPiece: 'BedrockStageWarranty · KB Section 5 rule',
  },
  {
    role: 'Parts logistics ops',
    changeToday: 'Zero wrong-part dispatches on known fault codes. Exact part numbers surface in every case.',
    how: 'BedrockKnowledge quotes part numbers (HYD-MP-9912, HYD-RV-2204) from KB Section 1 directly in the agent response.',
    buildPiece: 'BedrockKnowledge · Bedrock_KB_Section__c',
  },
  {
    role: 'Fleet ops director',
    changeToday: 'First live fleet-wide view of MTTR, ARR-at-risk, and open Critical fault count. Drill to any case in one click.',
    how: 'Dashboard polls /api/recent-cases + /api/recent-claims every 10s; each card opens the Salesforce record in a new tab.',
    buildPiece: 'Vercel API routes · React polling',
  },
  {
    role: 'Bedrock Salesforce team',
    changeToday: 'New fault scenarios added by extending the KB, not rewriting code. Trust matrix + KPI tie-back become the template for the next agent.',
    how: '4 small focused Apex classes; agent topology is data-driven; permset is reusable.',
    buildPiece: 'All 4 Apex actions · agent topology · Bedrock_Demo_Admin permset',
  },
];

export const HOW_I_USED_AI = [
  { what: 'Data model — 7 custom objects + 59 fields', who: 'AI drafted; I edited validation rules and required field flags.' },
  { what: 'Apex @InvocableMethod classes (4)', who: 'AI generated initial classes; I refactored BedrockAssetContext to compute KPI rollups inline so the agent gets value math in a single call.' },
  { what: 'Agentforce .agent topology (router + 2 subagents + 5 actions)', who: 'I wrote the trust matrix and topology by hand; AI filled in action descriptions and example utterances.' },
  { what: 'KB content (7 sections)', who: 'I wrote the SLA grid and 72h warranty rule because those are the load-bearing controls; AI helped with fault code descriptions.' },
  { what: 'This dashboard', who: 'AI scaffolded the React UI bundle and shadcn components; I designed the page structure, KPI framing, and decision narrative.' },
  { what: 'Override example', who: 'AI proposed `lightning__doubleType` for Decimal Apex outputs per its training; it failed in this org. I overrode to `lightning__numberType`, which the runtime accepted.' },
];
