# Deck outline — Innovation TA panel

Target: ~35 minutes, six sections, demo is the hero. Slide counts are
suggestions; cut anything that doesn't earn its time.

---

## Slide 1 — Title (15 seconds)

- **Bedrock Heavy Equipment — Proactive Service for Connected Equipment**
- *From event to action before the customer knows there is a problem*
- Your name · the date · "Innovation TA panel"

---

## Slide 2 — Frame the problem (3 min)

Don't recite the case study. Three beats:

1. **The data is there.** 2.4 PB telemetry in Snowflake, 900K assets
   reporting every 30s. Bedrock has spent a decade instrumenting.
2. **The connective tissue is not.** Telemetry, contracts, parts, service
   history, warranty are in 5+ systems. Dealers spend 30–40% of their time
   data-hunting.
3. **The cost is countable.** $180M/year warranty leakage, MTTR 11.4h vs.
   ≤6h target, dealer CSAT 62 vs. 80 target.

Land on the CIO quote: *"The next era of competitive advantage is not more
telemetry. It is the agent layer that turns telemetry into action."*

---

## Slide 3 — KPIs I contracted myself to move (1 min)

The two I picked, and why:

- **MTTR on critical faults · 11.4 h → ≤6 h.** The fastest path to it is
  collapsing the data-hunting time before action. That is exactly what an
  agent layer does.
- **Warranty claim cycle time · 22 d → ≤7 d.** Same pattern, different
  surface. Staging the claim at fault time turns a 22-day batched workflow
  into an hours-long human-in-the-loop review.

Why not parts attach rate (47% → 65%)? It is the right strategic KPI but it
is a 12–18 month lift dominated by go-to-market, not the agent layer. I
optimized for KPIs the agent layer is the most direct lever for.

---

## Slide 4 — Solution overview (3 min)

The pattern, six boxes:

```
event → resolved context → KB-grounded reasoning → action library → trust gate → outcome
```

What I built — and notably, I built it TWICE:

**Primary artifact: Salesforce-native**
- 7 custom objects, 59 fields, 4 Apex `@InvocableMethod` action classes
- **Two Agentforce agents** sharing the same Agent Script, KB grounding,
  and trust matrix:
  - `Bedrock_Service_Triage` — `AgentforceEmployeeAgent` for the dealer
    service rep (internal Lightning panel)
  - `Bedrock_Customer_Service` — `AgentforceServiceAgent` twin for
    customer-facing surfaces (Experience Cloud / MIAW eligible)
- Both wire `capture_fault_details`, `get_asset_context`,
  `retrieve_knowledge`, `open_service_case`, and `stage_warranty_claim`
- 174 sample records loaded into a Developer Edition org
- Deterministic prompt injection of per-tier SLA windows so the LLM cannot
  drift on critical numbers between runs
- Real records created by the agents (Cases, Warranty Claims) — every
  recommendation produces an artifact, not a payload preview

**Reference design: off-platform**
- A Streamlit + Claude API implementation of the exact same pattern
- Side-by-side it answers the panel's "what would you build outside
  Salesforce?" question without me having to imagine it

**Headless agent layer: off-platform Vercel dashboard** *(architecture rationale in [architecture.md §6](architecture.md#6-off-platform-consumer-surface--the-headless-agent-layer))*
- A React/Vite SPA on Vercel that **both reads records and invokes the
  agent itself** over REST — proving the agent layer is headless, callable
  from anywhere via API, not tied to any one UI surface
- **Read path**: serverless `/api/recent-cases` and `/api/recent-claims`
  call Salesforce REST (`<my-domain>/services/data/v66.0/query/`) every 10s;
  detail dialogs in-app, no jump-out to Salesforce
- **Write path**: serverless `/api/agent-session` + `/api/agent-message`
  call the public Agentforce Agent API at
  `api.salesforce.com/einstein/ai-agent/v1` — invoking
  `Bedrock_Customer_Service` (`AgentforceServiceAgent`) with the same
  Agent Script logic, KB grounding, and §5 trust matrix as the in-org
  Employee Agent. Records created on platform appear on the rail within ~60s.
- Authentication is **OAuth Client Credentials + JWT-issued access
  tokens** (the gateway requires JWT format), Run As an `Integration User`
  with `Bedrock_Demo_Admin` permset
- This is one layer of a **multi-layered integration strategy** detailed
  in Slide 7: **headless REST APIs with Vercel is what I built** (this
  bullet — the agent layer callable from anywhere over HTTP); **Data
  Cloud zero-copy** is the recommendation for the 2.4 PB telemetry (§4);
  **MCPs** are the future tool-composition vector worth investing in;
  **Apex / Flow** is where the trust gate lives. Each layer carries the
  load it's best suited for — don't pick one

What I did **not** build, deliberately:
- Cohort-level fault clustering (would be Data Cloud aggregation in prod)
- Dedup / suppression on noisy sensors (a Flow in prod)
- A second subagent for ad-hoc knowledge queries — kept the agent narrow
  to one well-defined journey rather than spreading thin
- Outbound message send (only drafts; production gates send through
  Marketing Cloud)

---

## Slide 5 — Three pillars (2 min)

1. **Grounded reasoning, not generation.** The agent cites a KB section for
   every recommendation. If a fact is not in the resolved context or the
   KB, it is omitted. This is enforced by the system prompt, not hoped for.
2. **Trust posture is data, not vibes.** Every action has a posture in a
   matrix the panel can read. Autonomous when the cost of being wrong is
   low; recommend when there's cost or relationship impact; human-required
   when the action is financial or escalatory. Default-deny on unknown
   actions.
3. **Salesforce translation is in the UI.** The panel doesn't have to
   imagine the Salesforce architecture. I rendered it as the fourth tab.

---

## Slide 6 — Architecture & data model (4 min)

Show the diagram from `docs/architecture.md` §1.

**Tell the panel to read [docs/architecture.md §3](architecture.md#3-salesforce-translation) while you talk** — it's the demo-to-Salesforce translation table (telemetry, reference data, KB, reasoning, every action, comms, dealer surface, audit). That table is the architectural argument; this slide is the verbal walkthrough of it.

Walk four things:

1. **Identity resolution.** Asset → customer via deterministic external-id
   join (`Customer_Id__c`, `Asset_Id__c`, `Serial_Number__c`). On Salesforce
   this lives in my `BedrockAssetContext` Apex class as one SOQL with
   relationship traversal; in production-scale Bedrock this is Data Cloud
   Identity Resolution rules — same pattern, declarative runtime.
2. **Context assembly.** One Apex action (`get_asset_context`) returns the
   full asset 360, the active contract, the last 10 telemetry events, AND
   the customer-level KPIs (open Critical faults / 30d, ARR at risk). The
   agent gets *facts*, not raw data.
3. **Retrieval.** SOSL over the 7 `Bedrock_KB_Section__c` records, with a
   "return all sections" fallback when the index hasn't built. Cheap,
   deterministic, auditable. Production = Data Cloud Vector DB; same
   retrieval contract, swap implementations.
4. **Agent runtime split.** Agent Script has two phases — deterministic
   resolution then LLM reasoning. I inject the per-tier SLA windows
   (Critical-Platinum-4h, Critical-Gold-8h, etc.) in the deterministic
   phase, so the LLM never sees a question of "what's the Platinum SLA?"
   — it only sees the answer. This is how I keep the demo consistent
   across runs.

---

## Slide 7 — Integration strategy: multi-layered, zero-copy-led (2 min)

This is a panel-favorite question — "how does this scale?" Pre-empt it.

Lead with the **multi-layered framing**: don't pick one integration model.
Each layer carries the load it's best suited for. State which layers I
*built* and which I'm *recommending* — the panel rewards architecture
breadth and honesty about scope.

| Layer | Purpose | This build |
|---|---|---|
| **Data Cloud zero-copy federation** | Telemetry, SAP parts inventory, WARRANTY-7 mainframe reads at scale | **Recommended** — theoretical for this DE-org demo, but it's the lead recommendation in §4 |
| **Headless REST APIs — Salesforce REST + Agentforce Agent API** | Decouple the agent layer from any one UI surface; reads and writes from any consumer over HTTP | **Built and live** — Vercel/Vite SPA (§6); same agent invocable from Lightning, Builder Preview, MIAW, Experience Cloud, or this off-platform chat |
| **MCPs (Model Context Protocol)** | Standardized agent-to-tool wiring — Bedrock's own asset-telemetry MCP, third-party logistics MCPs | **Recommended** — extension path, not built today |
| **Apex / Flow (on-platform)** | Trust gate enforcement, action execution, audit | **Built** — four Apex `@InvocableMethod` classes (§3) |

Headline beats:

- **Zero-copy where data has gravity** (§4 federation table). 2.4 PB
  stays in Snowflake; Data Cloud queries through it. Customers,
  contracts, warranty status → ingested. Small, volatile, used as join
  keys + agent gates. Latency cost is real; mitigation is one prefetch
  at fault time, not row-by-row during reasoning. *This is the single
  biggest cost-and-realism win and the architecture decision Marcus
  flagged should lead any Data Cloud sales conversation.*
- **Headless REST APIs via Vercel is what I built.** "Headless" because
  the agent layer is decoupled from any one UI surface — same
  `Bedrock_Customer_Service` agent (Service Agent type) invocable from
  the Lightning panel, Agent Builder Preview, MIAW, Experience Cloud,
  *and* an off-platform Vite/React SPA on Vercel. The Vercel chat
  creates real `BSV-*` cases and `BWC-*` warranty claims via the public
  Agent API at `api.salesforce.com/einstein/ai-agent/v1`. Authenticated
  via OAuth Client Credentials + JWT-issued tokens. Proof, not diagram.
- **MCPs** are the next vector worth investment — standardized
  agent-to-tool wiring across vendors. Means Bedrock's own
  asset-telemetry MCP server (or a third-party logistics MCP) plugs
  into the agent without bespoke Apex per tool. Salesforce is shipping
  MCP support across Agentforce; this build is positioned to adopt it
  with minimal rework because the tools are already a small set of
  named `@InvocableMethod` classes today.
- **Apex / Flow** is where the trust matrix has to live — the only
  layer where Salesforce can enforce policy regardless of which
  surface initiated the conversation.

What's intentionally *not* on this slide: ingest-everything. That's not
on the table for Bedrock's data shape; the 2.4 PB telemetry doesn't move.

---

## Slide 8 — Design choices & trust boundary (3 min)

Show the trust matrix from `docs/architecture.md` §5.

Walk three rows out loud:

- **`stage_warranty_claim` is Autonomous** — because KB §5 says missing the
  72-hour window forfeits entitlement, and inaction is the more expensive
  failure. (This is your override-AI example.)
- **`dispatch_technician` is Recommend** — because dispatch costs are real
  and asymmetric. The agent surfaces the right recommendation; the human
  approves the cost.
- **`escalate_to_bedrock_engineer` is Human-required** — engineering signal
  is the most precious filter Bedrock owns. Eroding it with autonomous
  escalation breaks the human-of-last-resort.

What I deliberately left out: autonomous customer outbound. Drafted, never
sent.

---

## Slide 9 — Live demo (12 min)

Drive the demo through **Agent Builder Conversation Preview** in the SForg
org. Goal: under 5 minutes for the end-to-end loop, then dwell on what the
panel reacts to. Have the Streamlit demo open in a separate tab as backup.

### Demo path — Lightning Agentforce panel primary

1. **Open a Lightning Experience app** (Service or Sales — doesn't matter)
   with the **Agentforce panel pinned open on the right**. The agent selector
   should already be set to **"Bedrock Service Triage"**. Have one Lightning
   tab open to **Bedrock Service Cases → All** and another to **Bedrock
   Warranty Claims → All** so you can switch in real time.

2. **Frame the inbound event** (15 sec). *"This is the dealer service rep's
   actual surface — Lightning Experience with the Agentforce panel embedded.
   In production, when Bedrock Connect detects a critical fault, the rep
   can ask the agent to triage it in plain language. The agent is published
   and activated as BotVersion 1 in this org — it's not a developer preview."*

3. **Type the trigger utterance** (in the Agentforce panel input):
   ```
   We have a Critical HYD-447 hydraulic fault on ASSET-50101. Please triage and recommend next steps.
   ```

4. **Narrate the trace as actions fire** (30 sec). Point to each tool in the
   preview pane as it executes:
   - `capture_fault_details` — LLM extracts the structured payload
   - `get_asset_context` — Apex SOQL resolves Pinnacle, Platinum, warranty Active
   - `retrieve_knowledge` — SOSL grounds the agent in KB §1, §2, §3
   - `open_service_case` — autonomous, creates a real Case
   - `stage_warranty_claim` — autonomous, real Claim record. *"This is the
     override-AI moment — I'll come back to it in a second."*

5. **Walk the response** (1 min). Highlight in the chat output:
   - The two part numbers (`HYD-MP-9912`, `HYD-RV-2204`) — *"verbatim from
     KB §1, not hallucinated."*
   - The *"pressure variance >8% after relief test"* threshold — *"that's
     specific operational guidance from KB §1."*
   - The 4-hour Platinum SLA — *"and that number comes from a deterministic
     prompt injection — Agent Script evaluates the resolved service tier
     before the LLM reasons, so it can't drift on 4h vs 8h between runs."*
   - The KPI line — *"3 open Critical faults / 30 days, $1.02M ARR at risk.
     That's the briefing's value calculation, surfaced live."*

6. **Switch to Lightning tab — Bedrock Service Cases → All** (30 sec). Click
   the new `BSV-*` case. *"This isn't a fake payload. The agent created a
   real Service Case in Salesforce. In production the Case routes to
   Service Console for the rep; in your case Service Cloud handles the
   workflow."*

7. **Switch to Bedrock Warranty Claims → All** (30 sec). Click the new
   `BWC-*` claim. *"And this is the staged warranty claim — KB §5 says the
   72-hour entitlement window makes inaction the more expensive failure,
   so staging is autonomous; submission still requires service-manager
   approval. That's the override-AI example I'll talk about on the next
   slide."*

8. **Run a trust-boundary variant** (1 min). Fresh conversation, paste:
   ```
   Critical HYD-447 fault on ASSET-50203. What should we do?
   ```
   *"Same fault code, different asset — Granite Construction, Gold tier,
   warranty expired."* When the response renders, point to the fact that
   `stage_warranty_claim` did NOT fire in the trace, and the SLA quoted is
   now 8-hour Gold. *"Same agent, same KB, but the trust matrix gates on
   real data — it's not theatrical."*

9. **Switch to the Vercel dashboard tab** (60 sec) — *full architecture rationale in [architecture.md §6](architecture.md#6-off-platform-consumer-surface--the-headless-agent-layer); point the panel there if they push on the consumer-side trust argument or want the headless framing.* Open
   `https://bedrock-dashboard-sand.vercel.app/triage` (Triage Console).
   Within 60 seconds of the on-platform triage from step 5, the `BSV-*`
   case and `BWC-*` claim pulse green in the "Recent
   Bedrock_Service_Case__c" and "Recent Bedrock_Warranty_Claim__c" rails
   below the chat. **Then run a second triage from the dashboard's own
   embedded chat** — same fault, same asset, but this time invoking
   `Bedrock_Customer_Service` (`AgentforceServiceAgent`) off-platform via
   the public Agent API. Watch a fresh `BSV-*` pulse on the rail as proof
   the loop closed. Narrate:
   *"This is the headless agent layer. The Lightning panel and Agent
   Builder Preview I just showed are surfaces; this is a Vite/React SPA
   on Vercel, no Salesforce dependency on the client side. Two integration
   paths through one Connected App: the rails consume Salesforce REST
   (`/services/data/v66.0/query/`) for reads, and the chat invokes the
   public Agentforce Agent API at
   `api.salesforce.com/einstein/ai-agent/v1` for the GenAI layer.
   Authentication is OAuth Client Credentials + JWT — the gateway
   requires JWT format, not opaque bearer tokens. The agent runs as
   its assigned Integration User; writes still happen through the §5
   Apex actions because the agent is the only thing this surface can
   ask to write — the trust gate is enforced on platform regardless of
   which surface initiated the conversation."*
   On the read path: *"The rails poll
   `/api/recent-cases` and `/api/recent-claims` every 10 seconds. It is
   polling, not streaming — I want to be precise about the mechanism. The
   `● NEW` pulse is CreatedDate-recency based: any record within the last
   60 s, regardless of when the page loaded. Cohesive with how a panel
   demo actually unfolds."* Click one of the pulsing rows; the dashboard
   opens an **in-app detail modal** (Subject, fault code, asset, customer,
   service tier, timeline, KB-tagged provenance — "↳ created by
   open_service_case", color-keyed to the §5 trust matrix). *"Two surfaces,
   one source of truth, no Salesforce license needed on the consumer
   side. This is how a fleet-ops director or a downstream BI tool reads
   what the agent produced — and the trust-color stripe makes the
   §5 policy legible inline."*

10. **Open the architecture diagram** in [docs/architecture.md](architecture.md)
   (30 sec). Land on the federation-vs-ingestion table. *"Two more things
   worth showing — first, the architecture diagram, which is how this lands
   in a real Bedrock deployment with the 2.4 PB Snowflake telemetry; second,
   the off-platform reference design in Streamlit, which is the same pattern
   without the Salesforce runtime, kept as a backup if you want to see how
   the pieces connect outside the platform."*

If something breaks, narrate the recovery — they're watching for that.

### Backup paths if something fails

- **Lightning Agentforce panel doesn't respond.** Switch to Agent Builder
  Conversation Preview tab — same agent, same actions, developer surface
  but functionally identical.
- **Agent Builder also fails.** Switch to the CLI wrapper:
  `python tools/agent_chat.py <session-id> "..."` — same agent.
- **All Salesforce paths fail.** Switch to the Streamlit demo (`streamlit
  run app/streamlit_app.py`). Frame it as: *"same architecture, off-platform
  reference design — Claude API instead of Agentforce, but every action and
  trust gate is identical."*
- **Browser/network issue.** Open `docs/architecture.md` and walk the
  diagram by reading it out loud. The architecture story stands on its own
  without the live demo.

---

## Slide 10 — How I used AI (1 min)

Mandatory per the briefing. *Revise this with your real timeline and
override example before the panel — what's here is a strawman.*

- **Tools.** Claude Code (Anthropic's CLI) running Claude Opus 4.7.
- **What AI generated end-to-end.** The two-side build — both the
  Streamlit reference design and the Salesforce-native demo (custom
  objects, fields, Apex action classes, Agent Script bundle, permission
  set, list views, tabs, data import flows, deterministic seed data).
  AI also caught the bugs as we tested: the Body__c FLS gap that
  silently dropped KB content, the SLA hallucination drift, the
  `lightning__integerType` vs `lightning__numberType` schema mismatch.
- **What I directed.** The KPI choice (MTTR and warranty cycle, not
  parts attach). The trust posture matrix — which actions run autonomous
  versus recommend versus human-required, defended row by row. The
  federation-vs-ingestion position on Snowflake. The decision to scope
  the agent narrowly to fault triage rather than spread it across all
  dealer service queries.
- **One override.** AI's first trust-policy draft made
  `stage_warranty_claim` a Recommend posture. I read KB §5, saw the
  72-hour entitlement window and the $180M annual warranty leakage, and
  inverted the posture to Autonomous. The reason is in the data: when
  the cost of inaction (forfeited entitlement) exceeds the cost of a
  wrong action (a service manager rejecting a staged claim), staging
  should happen by default. This is now hard-coded in the agent's
  instructions as a "MUST execute" rule with the KB §5 citation as the
  justification.

---

## Slide 11 — Outcomes & next steps (3 min)

Map back to the KPIs:

- **MTTR.** The agent collapses the data-hunting wedge. 30–40% of dealer
  rep time recovered = a meaningful slice of the 11.4 → 6h delta. The rest
  comes from prepositioning, which I scoped out and would build in week 2.
- **Warranty cycle time.** Stage at fault time, review in 72h, submit in
  hours not weeks. The architecture is what closes the gap.

What I would build next (week 2 plan):

1. Cohort fault retrieval (Data Cloud Vector DB + similarity search)
2. Dedup / suppression Flow on the same `asset_id + fault_code`
3. Dealer prepositioning recommendation (a nightly Flow + Data Cloud
   aggregation, surfaced as an action)
4. Real Marketing Cloud outbound (template-locked) instead of drafted text

What I would *not* build:
- A custom LangGraph orchestrator. Agentforce + Atlas is the right runtime
  for the deployment surface (Service Console).

---

## Slide 12 — One question for the panel (30 sec)

Pick one. *Asking* a question — not the brilliance of the question — is
what the briefing rewards.

Option A (strong, ties to your federation argument):
> "For multi-cloud customers like Bedrock with Snowflake as gravity, where
> do you see Data Cloud federation losing to Snowflake-native AI workloads
> today, and how does that shape your guidance to customers?"

Option B (more delivery-focused):
> "When you walk into an account like this, what's the smallest first
> agent you've seen drive measurable KPI movement in 90 days?"

Option C (most open-ended, reads as humble):
> "What do candidates for this role most often *underweight* when they map
> a build like this to Salesforce?"

---

## Backup slides (don't show unless asked)

- B1. Schema diagram of the four datasets + KB
- B2. Worked example: ASSET-50101 (Pinnacle haul truck) end-to-end with the
  exact JSON payloads at each step
- B3. The trust matrix as a deeper table — every action, every posture,
  every reason
- B4. What I considered for stack and rejected (LangGraph, n8n, plain
  OpenAI function-calling)

---

## Time budget

| # | Section | Target | Cumulative |
|---|---|---|---|
| 1 | Title | 0:15 | 0:15 |
| 2 | Frame the problem | 3:00 | 3:15 |
| 3 | KPIs I picked | 1:00 | 4:15 |
| 4 | Solution overview | 3:00 | 7:15 |
| 5 | Three pillars | 2:00 | 9:15 |
| 6 | Architecture & data model | 4:00 | 13:15 |
| 7 | Federation vs. ingestion | 2:00 | 15:15 |
| 8 | Design choices & trust | 3:00 | 18:15 |
| 9 | Live demo | 12:00 | 30:15 |
| 10 | How I used AI | 1:00 | 31:15 |
| 11 | Outcomes & next | 3:00 | 34:15 |
| 12 | Panel question | 0:30 | ~35:00 |

Run a real timer end-to-end at least twice before the panel.