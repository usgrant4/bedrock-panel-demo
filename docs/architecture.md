# Architecture — Bedrock Proactive Service

This document is the panel's reading companion to the demo. It explains what
the demo does, how it does it, and — the part the panel is grading — how the
exact same pattern would land on Salesforce.

---

## 1. The pattern

Six steps, the same in this demo and in the production architecture:

```
   ┌──────────────┐   ┌────────────────┐   ┌────────────────┐   ┌─────────────┐
   │ 1. Fault     │   │ 2. Resolved    │   │ 3. Reasoning   │   │ 4. Action   │
   │    event     │ ─▶│    context     │ ─▶│    over policy │ ─▶│    library  │
   │              │   │  (asset 360 +  │   │  (KB-grounded) │   │             │
   │              │   │   KPI math)    │   │                │   │             │
   └──────────────┘   └────────────────┘   └────────────────┘   └─────────────┘
                                                                       │
                                                                       ▼
                                                              ┌────────────────┐
                                                              │ 5. Trust gate  │
                                                              │  autonomous /  │
                                                              │  recommend /   │
                                                              │  human         │
                                                              └────────────────┘
                                                                       │
                                                                       ▼
                                                              ┌────────────────┐
                                                              │ 6. Outcome     │
                                                              │    captured    │
                                                              │   (audit)      │
                                                              └────────────────┘
```

Every box in the demo maps to a Salesforce capability in Section 3. The mapping is
the architecture; everything else is implementation detail.

---

## 2. The demo (off-platform)

| Step | Implementation in the demo |
|---|---|
| 1. Fault event | The Streamlit sidebar simulates an inbound webhook — a row from `telemetry_events.csv` with severity = Critical and status = Open. In a real Bedrock, this is Bedrock Connect on AWS publishing to Kinesis every 30s. |
| 2. Resolved context | `data_loader.asset_360()` joins `assets` → `customers` → `contracts` → recent `telemetry`. Identity resolution is a deterministic key join on `customer_id`/`asset_id`/`serial_number`. |
| 3. Reasoning | `agent.reason()` calls Claude Opus 4.7 with the resolved context, calculated KPI facts, and the top-3 retrieved KB sections. The system prompt enforces no-hallucination + KB citation. |
| 4. Actions | `actions.py` defines seven structured payloads: open case, dispatch tech, ship part, preposition parts, draft message, stage warranty claim, escalate to engineer. Each returns a dict — the Salesforce-bound payload. |
| 5. Trust gate | `trust_policy.POLICY` maps each action to one of three postures. Unknown actions default to `human_required` (fail-safe). |
| 6. Outcome | The Streamlit UI renders the executed artifact and the action goes on a session-scoped timeline. Audit-trail surrogate. |

### Knowledge retrieval — TF-IDF, deliberately

The KB is seven sections (~1,500 words each). Embeddings would add semantic
recall on rephrased queries, but they would also add an API call, a vector
store, and a non-deterministic step in the panel demo. For seven sections,
TF-IDF is faster, cheaper, and auditable — the panel can read the retrieval
score column and see why each section was returned.

In production this becomes Data Cloud Vector Database, which is the right
choice when the KB grows past a few dozen sections, when query rephrasing
matters, or when the retrieval feeds Agentforce as a grounded data source.

### KPI calculations grounded in the data

The demo computes four numbers live, on every event:

- **Open critical faults / 30 days** for the affected customer
- **ARR at risk** — sum of annual contract value across active contracts on
  affected assets
- **Fleet MTTR (hours)** — mean of (resolved_timestamp − timestamp) on
  resolved Critical faults
- **Warranty exposure** — count of in-warranty assets with open Critical
  faults (the leakage proxy)

These tie every action recommendation back to a stated KPI.

---

## 3. Salesforce translation

The same pattern, rebuilt on Salesforce capabilities. Each row is a
defendable substitution, not a vague analogue.

| Layer | Demo | Salesforce realization |
|---|---|---|
| Telemetry stream | CSV of fault events | **Bedrock Connect (Kinesis) → Data Cloud** with **zero-copy federation** to Snowflake. The 2.4 PB stays in Snowflake; Data Cloud queries through it. Federation is the cost/latency win — see Section 4. |
| Reference data (customers, contracts, warranty status) | small CSVs | **Data Cloud DLOs → DMOs** with **identity resolution** rules on `customer_id ↔ asset_id ↔ serial_number`. Volatile-enough to ingest, small-enough that the cost is trivial. |
| Legacy systems (SAP, ServiceMax, WARRANTY-7) | not modeled | **MuleSoft Anypoint** API-led layer. SAP S/4HANA for parts, ServiceMax during the migration to Service Cloud, WARRANTY-7 as a back-end claim-staging integration. |
| Knowledge base | PDF / MD via TF-IDF | **Data Cloud Vector Database** with embeddings, exposed to **Agentforce** as a grounded data source. Citations preserved as metadata, surfaced in the agent response. |
| Reasoning engine | Claude Opus 4.7 | **Agentforce + Atlas Reasoning Engine**. Topics for sub-flows (Triage / Dispatch / Warranty). Standard + Custom Actions for execution. |
| Action: open case | dict payload | **Apex / Flow** action → **Service Cloud Case**. |
| Action: dispatch technician | dict payload | **Field Service Work Order** + Resource Optimization. |
| Action: ship part / preposition | dict payload | **MuleSoft → SAP S/4HANA** parts order. |
| Action: customer comms | drafted email body | **Marketing Cloud Engagement** journey trigger; outbound from Service Cloud Case context. |
| Action: warranty claim | staged dict | **MuleSoft → WARRANTY-7** integration, staged for service-manager review per Section 5 of the KB. |
| Dealer surface | Streamlit UI | **Experience Cloud** (LWR) for the dealer portal + an embedded **LWC** in the **Service Console** for in-app context for dealer service reps. |
| Audit / governance | session-scoped timeline | **Data Cloud Audit Trail** + **Agentforce session traces** + standard Salesforce platform audit logs. |

### Why these choices, in panel-defendable form

- **Data Cloud over Salesforce Connect (External Objects).** Salesforce
  Connect via OData is the third option for federating reference data. It
  loses to Data Cloud federation here because the customer is heavily
  invested in Snowflake AI workloads, and Data Cloud preserves the
  agent-grounding surface (prompt templates, vector search) that Connect
  doesn't expose.
- **Agentforce over a custom LangGraph in Heroku.** The KPI is dealer- and
  service-rep adoption, not pure agent capability. Agentforce wins because
  it lands inside Service Console, which is where the dealer rep already
  works. Build velocity matters less than the deployment surface.
- **MuleSoft over point integrations.** WARRANTY-7 is a mainframe; the
  parts API is SAP. Both will be touched by future use cases beyond this
  one. API-led layer is the pattern, not the shortcut.

---

## 4. Federation vs. ingestion — the trade-off

Bedrock has 2.4 PB of telemetry in Snowflake. Two options:

- **Ingest into Data Cloud.** Move the data. Simple, single source of truth,
  governed by Salesforce. **But:** copying 2.4 PB is cost-prohibitive; data
  is already governed in Snowflake; freshness matters more than
  query-locality for fault-detection workloads.
- **Federate via Data Cloud zero-copy / Snowflake share.** Leave the data in
  Snowflake; Data Cloud queries against it. **Win:** no movement cost, the
  data stays where the customer has invested in AI tooling, query-time
  freshness. **Cost:** federation latency on every query (mid-double-digit
  ms vs. single-digit on ingested data); access patterns must be
  query-friendly, not row-by-row.

**Position:** federate the telemetry, ingest the join keys.

| Dataset | Choice | Reason |
|---|---|---|
| Telemetry events (Snowflake) | **Federate** | 2.4 PB; freshness > locality; Snowflake gravity |
| SAP parts inventory | **Federate** | Transactional, lives in S/4HANA |
| WARRANTY-7 claims | **Federate via MuleSoft** | Mainframe; cannot bulk-extract |
| Customers, contracts, warranty status | **Ingest into Data Cloud** | Small, used as join keys + agent gates; staleness here = wrong agent decision |
| Dealer service history (post-ServiceMax migration) | **Ingest into Data Cloud** | Already inside Salesforce; no reason to federate |
| Read-side consumers (dashboards, BI, partner apps) | **Federate via Salesforce REST + OAuth** | Same discipline on the read path — read at query time, no parallel mirror; freshness controlled by poll cadence. See Section 6. |

The panel will likely push on the latency claim. Be honest: federation is a
read-time cost, and for sub-second agent flows you batch-prefetch the
context block once at fault time, not row-by-row during reasoning.

---

## 5. Trust posture rationale

| Posture | Actions | Why |
|---|---|---|
| **Autonomous** | open service case, draft customer message, stage warranty claim | Read-only joins, low-blast-radius writes, drafts not sends. The warranty *staging* is autonomous because the 72-hour entitlement window per KB Section 5 makes inaction the worse failure. |
| **Recommend** | dispatch technician, ship / preposition parts, send customer message, submit warranty claim | Anything with cost (parts, technician hours), customer relationship impact (outbound message), or financial commitment. Service manager approval, in the same UI surface. |
| **Human-required** | escalate to Bedrock engineer, approve warranty payout | Engineering escalation has signal-noise risk; payout approval is financial control. The default for any action not in the matrix is also `human_required` — fail-safe. |

The **failure mode I am least happy with**: autonomous case-open is correct
when the fault is unambiguous, but a noisy sensor (e.g., a known stuck
transducer on engine_hours > 15,000) could open repeated cases. The
mitigation is a deduplication step *before* the agent — Data Cloud
streaming aggregations or a lightweight Flow that suppresses cases on the
same `asset_id + fault_code` within a configurable window. I would build
that in week 2.

---

## 6. Off-platform consumer surface — the headless agent layer

The agent layer in this build is **headless**: callable from anywhere over
REST, not bound to any single UI surface. The Lightning Agentforce panel,
Agent Builder Preview, MIAW channels, Experience Cloud, and the off-platform
Vercel dashboard are all clients of the *same* agent logic, running through
the *same* Section 5 trust matrix in Apex. This section walks the off-platform
surface — a Vite/React SPA on Vercel — because it's the clearest proof of
the headless property and demonstrates how downstream systems (BI tools,
partner apps, customer-facing portals) would reach the generative AI layer
without taking a Salesforce dependency on the read or write paths.

The dashboard ([force-app/main/default/uiBundles/BedrockDashboard](../force-app/main/default/uiBundles/BedrockDashboard))
is a single SPA + Vercel-serverless backend that exercises **two integration
vectors into Salesforce** — both authenticated with the same OAuth
Connected App via Client Credentials + JWT-issued access tokens:

```
                                                              ┌────────────────────────┐
   ┌──────────────────────┐    ┌───────────────────────┐  ┌─▶ │ Salesforce REST        │
   │ React SPA (Vercel)   │    │ Vercel serverless     │  │   │  <my-domain>/services/ │
   │  Triage Console      │ ─▶ │  /api/recent-cases    │ ─┘   │  data/v66.0/query/     │
   │  10 s poll · CreatedDate    /api/recent-claims    │      │  (SOQL · read path)    │
   │  recency pulse       │    │                       │      └────────────────────────┘
   │  detail dialogs      │    │                       │
   │                      │    │                       │      ┌────────────────────────┐
   │  AgentChat component │ ─▶ │  /api/agent-session   │  ┌─▶ │ Agent API (Einstein)   │
   │  session + bubbles   │    │  /api/agent-message   │ ─┘   │  api.salesforce.com/   │
   │  trust-color cues    │    │  Client-Credentials + │      │  einstein/ai-agent/v1  │
   └──────────────────────┘    │  JWT token cache      │      │  (REST · GenAI write)  │
                               └───────────────────────┘      └────────────────────────┘
```

Two paths, one trust gate. The read path consumes records the agent created
on platform; the write path invokes the agent itself. Both terminate in
Apex governed by the Section 5 trust matrix.

Defensible properties:

- **Headless agent layer.** The agent (`Bedrock_Customer_Service`,
  `AgentforceServiceAgent` type) is invoked via the public Agent API at
  `api.salesforce.com/einstein/ai-agent/v1/agents/{id}/sessions` →
  `/messages`. Same agent runs from Lightning today, an Experience Cloud
  site tomorrow, a MIAW channel after that. The dashboard is the proof
  point — the Salesforce dependency on the consumer side reduces to a
  bearer token and an HTTP client.
- **No client-side secrets.** OAuth client id/secret live in Vercel env
  vars; the JWT access token is minted server-side and never reaches the
  browser. The SPA only sees the fields the serverless function chooses
  to project — same posture a MuleSoft System API would take when wrapping
  this REST boundary.
- **Polling for reads, request/response for writes.** Record rails poll
  every 10 s and use CreatedDate recency for the "new row" pulse. The
  agent chat is synchronous request/response (`POST .../messages`). The
  UI labels both honestly — "auto-polling" in the rail headers, "Agent
  thinking…" while a message is in flight. The streaming SSE variant
  (`POST .../messages/stream`) is available on the same endpoint when
  latency / progressive-rendering becomes worth the complexity.
- **Writes go through the agent, not around it.** The off-platform chat
  cannot create records directly. It can only invoke the agent, which
  executes its Apex actions (`BedrockOpenCase`, `BedrockStageWarranty`,
  etc.) under the Section 5 trust matrix. The trust gate is enforced in Apex
  regardless of which surface initiated the conversation. This inverts
  the usual "off-platform = risky" framing: the customer-facing surface
  is read-and-invoke only; the policy lives where it can be enforced.
- **Token discipline — Client Credentials + JWT.** The Agent API gateway
  at `api.salesforce.com` requires JWT-format access tokens; opaque
  bearer tokens from refresh-token / web-server grants return bare 404
  at the gateway. The serverless function mints a JWT token via
  `grant_type=client_credentials` against
  `<my-domain>/services/oauth2/token`
  ([api/_sf-client.ts](../force-app/main/default/uiBundles/BedrockDashboard/api/_sf-client.ts))
  and caches it for the lambda lifetime. Same token is used for both
  the REST query path and the Agent API path.
- **Connected App must carry the right runtime user.** The Run As user
  on Client Credentials Flow must have the **Salesforce Integration**
  user license (or the `API Only User` permission). On SForg the
  configured user is `bedrock-integration@...` with the `Bedrock_Demo_Admin`
  permset. Standard admin users mint tokens but the Agent API rejects
  them (`no client credentials user enabled`).
- **Session lifecycle is client-driven.** The SPA holds the `sessionId`
  in React state, increments a `sequenceId` per message, and offers a
  "New" reset that drops the session. Sessions auto-expire server-side;
  we don't currently call `DELETE /sessions/{id}` on unmount.
- **Service Agents only over public API; Employee Agents in-org only.**
  `Bedrock_Customer_Service` (`AgentforceServiceAgent`) is the agent
  invoked from the dashboard — it has an auto-provisioned Agent User
  that the API's `bypassUser:true` routes to. `Bedrock_Service_Triage`
  (`AgentforceEmployeeAgent`) is exercised exclusively from the
  in-org Lightning Agentforce panel; Employee Agents run as the calling
  user and have no Agent User to bypass to on the public API. Both
  agents share the **same Agent Script verbatim** — same five actions,
  same KB grounding, same trust posture. The agent type is a
  declaration of intent that determines which surfaces the runtime
  exposes them on.

### How this fits a multi-layered integration strategy

The Vercel surface is one option in a multi-layered approach Bedrock
would adopt at scale:

| Integration layer | Use case | What it solves |
|---|---|---|
| **Data Cloud zero-copy federation** (Section 4) | Telemetry, SAP, WARRANTY-7 reads | Volume that can't move; freshness; existing investment |
| **Headless REST APIs — Salesforce REST + Agentforce Agent API** (this section) | Headless invocation of the GenAI layer + record reads from any consumer over HTTP | Decouples the agent from any one UI surface; proven live via the Vercel dashboard |
| **MCPs (Model Context Protocol)** *(extension path, not built)* | Pluggable tool routing for the agent itself — e.g., calling Bedrock's own asset-telemetry MCP server, or third-party logistics MCPs | Standardized agent-to-tool wiring across vendors |
| **Apex / Flow** (on-platform) | Trust gate, action execution, audit | Where policy is canonical and enforceable |

The headline argument to a panel or customer: don't pick *one* of these.
The architecture works because each layer carries the load it's best
suited for. Zero-copy where data has gravity, REST/Agent API where the
GenAI layer needs to be reachable, MCPs where tool composition is the
real value, Apex/Flow where the trust gate has to live.

**Why this is in the architecture, not just the build log.** It proves the
federation-vs-ingestion choice from Section 4 applies to consumers as well as
producers, AND it makes the agent layer a true peer of the data layer —
not a UI feature glued onto Service Cloud. Fleet ops directors, BI tools,
partner apps, customer-facing portals — any downstream reader or invoker
— interacts with this build through HTTP, no Salesforce license required
on their side.

**What this is not.** A replacement for Experience Cloud LWR or an
embedded LWC in Service Console; those remain the on-platform surfaces
(Section 3, "Dealer surface"). This is the off-platform analogue, for consumers
in a different trust boundary or without a Salesforce license.

---

## 7. Out of scope (and what I would build next)

- **Cohort-level reasoning.** Single-event today. Next: vector retrieval
  over the fault corpus to surface "this fault pattern preceded a major
  failure on 4 other assets in the last 90 days."
- **Dedup / suppression.** Per Section 5.
- **Dealer prepositioning recommendations.** The KB describes the pattern
  (HYD-447 cluster on HT-797 above 2,000 hours); the demo doesn't yet
  generate the recommendation. A nightly Flow + Data Cloud aggregation.
- **Outbound message send (vs. draft).** The current trust matrix recommends
  send, doesn't autonomously send. Production policy: same posture, but
  template-locked outbound through Marketing Cloud journey.

---

## 8. What AI wrote vs. what I wrote

In one place: this codebase was scaffolded with Claude Code (Anthropic's CLI)
and Claude Opus 4.7. AI was strong on the action library shapes, the data
loader skeleton, and the KB retrieval pipeline. I wrote the trust policy and
the federation-vs-ingestion argument by hand because both are judgment
calls, not pattern-matching.

**One override I made.** AI's first draft of the trust policy made
`stage_warranty_claim` a `Recommend` (human-staged). I overrode it to
`Autonomous` after re-reading KB Section 5 — the 72-hour entitlement window
inverts the default. Inaction is the more expensive failure, so the agent
should stage proactively and the human reviews-and-submits, not
reviews-and-stages. That is a small example of the pattern the panel asks
about: the rationale lives in the data, not the default.