# Execution Handoff: Proactive Service Agent for Connected Heavy Equipment

Prepared by Ulysses Grant IV for the implementation team. Reference build: github.com/usgrant4/bedrock-panel-demo (synthetic data, production pattern).

## 1. Decision and owner

- Business owner: VP Dealer Service (CSAT, MTTR) with CFO sponsorship (warranty leakage)
- Decision requested: fund a 12 week build to move MTTR on critical faults from 11.4h to 6h or less and warranty claim cycle from 22d to 7d or less
- Path to value: week 4 shadow mode (agent recommends, humans act), week 8 autonomous case open and claim staging for one dealer region, week 12 fleet rollout
- Investment gate: shadow mode must show 70%+ of agent recommendations accepted without edit before autonomy is enabled

## 2. Scope

In scope
- Agentforce service and employee agents sharing one Agent Script, KB grounding, and trust matrix
- Apex actions as the only write path: open case, stage warranty claim
- Data 360 as the identity and grounding layer: ingest customers, contracts, warranty status; federate telemetry
- Headless consumption over Agent API and REST for dealer and fleet ops surfaces without Salesforce licenses
- MuleSoft API layer to SAP S/4HANA (parts) and WARRANTY-7 (claims)

Out of scope for this phase
- Autonomous dispatch, parts shipment, outbound customer send, claim submission, payout approval
- Cohort level fault reasoning across assets
- Dealer parts prepositioning
- MCP as an agent facing tool layer

## 3. System interfaces

| Interface | Direction | Protocol and auth | Owner | Status |
|---|---|---|---|---|
| Telemetry stream to Data 360 | Snowflake to Data 360 | Zero copy federation | Customer data platform team | Designed |
| Reference data to Data 360 | SAP and CRM to DMOs | Batch ingest, identity resolution on customer_id, asset_id, serial_number | Customer data platform team | Designed |
| Agent to records | Agentforce to Apex to objects | InvocableMethod, runs as agent user | Salesforce build team | Built and tested |
| External consumer to agent | Vercel or any HTTP client to Agent API | OAuth client credentials, JWT, server side only | Customer app team | Built, live |
| External consumer to records | HTTP client to Salesforce REST | Same Connected App, read only | Customer app team | Built, live |
| Parts order | Apex to MuleSoft to SAP S/4HANA | Named Credential, API led | Customer integration team | Designed |
| Claim staging and submission | Apex to MuleSoft to WARRANTY-7 | Named Credential, mainframe adapter | Customer integration team | Designed |
| KB grounding | Data 360 vector store to Agentforce | Native retriever | Salesforce build team | Designed (TF IDF in reference build) |

## 4. Ownership lines

| Concern | Salesforce owns | Customer owns |
|---|---|---|
| Agent behavior, actions, trust matrix in Apex | Yes | Reviews policy |
| Customer, contract, warranty identity | Data 360 resolution rules | Source system accuracy |
| Telemetry storage and governance | No | Snowflake |
| Parts, pricing, inventory | No | SAP |
| Claim adjudication and payout | No | WARRANTY-7 and finance |
| Dealer and fleet ops UI outside Salesforce | No | Customer app team |
| Agent evaluation, traces, acceptance metrics | Yes | Consumes reports |

## 5. Architectural assumptions

- Telemetry stays in Snowflake. 2.4 PB is cost prohibitive to copy and already governed there.
- Context is prefetched once at fault time, not queried row by row during reasoning, to absorb federation latency.
- Eligibility is read from the record, never from the request. No Apex action exists for high cost actions, so no prompt can trigger them.
- The agent runs as a scoped integration user. Human operators and build time tools (MCP connector) run under their own permissions and are not agent surfaces.
- Warranty staging is autonomous because the 72 hour entitlement window makes inaction the costlier failure. Submission stays human.

## 6. Known risks

| Risk | Impact | Mitigation | Owner |
|---|---|---|---|
| Noisy sensors open duplicate cases | Alert fatigue, CSAT | Dedup on asset_id plus fault_code within a window, built before autonomy is enabled | Salesforce build team |
| Federation latency exceeds synchronous triage budget | Falls back to ingesting hot telemetry window | Measure p95 in week 1 against a 2s budget; ingest last 24h if exceeded | Data platform team |
| Stale warranty status in Data 360 | Wrong autonomous staging | Daily ingest minimum, event driven on contract change | Data platform team |
| Agent carries entitlement across conversation turns | Ineligible write attempts | Enforced in Apex, pinned by BedrockStageWarrantyTest; add eval case to regression suite | Salesforce build team |
| WARRANTY-7 mainframe cannot support staging API | Claim staging stays manual | MuleSoft adapter spike in week 1 | Integration team |

## 7. Unknowns to resolve before build

- Actual federation latency from Data 360 to Snowflake for the asset context query
- Whether the customer owns MuleSoft or needs an alternative API layer
- Data residency constraints on telemetry
- Agentforce conversation volume and cost at fleet scale (900K assets, 30s cadence)
- KB size and whether vector retrieval is required at launch

## 8. Exit conditions for build

- All five actions covered by Apex tests with per request gating in batched calls
- Eval suite of 30+ scenarios including expired warranty, unknown asset, mixed batch, and prompt coercion attempts, passing at 100% on gated actions
- Federation latency measured and within budget, or ingestion fallback implemented
- Dedup live before autonomy is enabled
- Agent traces and action outcomes flowing to observability with acceptance rate reporting
- Shadow mode acceptance rate at 70% or higher
