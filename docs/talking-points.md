# Verbatim talking points — Innovation TA panel

Use this as a starting script. Read it through twice, then start iterating —
swap phrases that don't sound like you, cut anything that doesn't earn its
time. Time budgets match [deck-outline.md](deck-outline.md). The whole
present-block is 35 min; the demo (Slide 9) is 12 of those, so spoken
slides need to come in at ~23 min total. Treat that as a hard ceiling.

Marcus's framings to lean on, in order of weight:
- **"Headless"** — every time you talk about the Vercel/REST layer.
- **"Multi-layered"** — Slide 7 explicitly; sprinkle elsewhere.
- **"Zero-copy"** — Slide 7 lead phrase. Use it where Data Cloud comes up.
- **"Generative AI layer"** — when introducing the agent.
- **Systems history** — name SAP, ServiceMax, WARRANTY-7, Snowflake at
  least once each to show you've read the brief.
- **Deployment / release management** — Slide 10 or 11.

---

## Slide 1 — Title (15 sec)

*[On screen: title, subtitle, your name, "Innovation TA panel"]*

> "Thanks for the time. I'm Ulysses Grant. What I'm going to walk you
> through is **Bedrock Heavy Equipment — Proactive Service for Connected
> Equipment**. The thesis is in the subtitle: *from event to action
> before the customer knows there is a problem*. Twelve slides, a live
> demo, and a question for you at the end. Let me start with why this
> problem is interesting."

---

## Slide 2 — Frame the problem (3 min)

*[On screen: the three beats — data is there, connective tissue isn't,
cost is countable]*

> "Three things to set up.
>
> **First, the data is there.** Bedrock has spent a decade instrumenting
> equipment. 2.4 petabytes of telemetry sitting in Snowflake, 900,000
> assets reporting every 30 seconds. That's not a starting line — that's
> the baseline. The work of getting connected equipment to *generate*
> data is already done.
>
> **Second, the connective tissue isn't.** Telemetry, contracts, parts,
> service history, warranty claims — they live in five or six different
> systems. The brief lists SAP for parts, ServiceMax for service history,
> WARRANTY-7 on a mainframe, Snowflake for the telemetry, plus whatever
> the dealer rep is keeping in their head. The result is dealers
> spending 30 to 40 percent of their time hunting for context before
> they can do anything useful.
>
> **Third, the cost is countable.** Bedrock estimates $180 million a
> year in warranty leakage — claims that fall outside the entitlement
> window. MTTR on critical faults is 11.4 hours against a 6-hour
> target. Dealer CSAT is 62 against an 80 target. Real numbers, in the
> brief.
>
> The CIO's quote in the brief lands the punch: *'The next era of
> competitive advantage is not more telemetry. It is the agent layer
> that turns telemetry into action.'* That's what I built against —
> the **generative AI layer** sitting on top of the data Bedrock already
> has, doing the connective work the existing systems don't."

---

## Slide 3 — KPIs I contracted myself to move (1 min)

*[On screen: MTTR 11.4h → ≤6h and Warranty cycle 22d → ≤7d]*

> "Two KPIs, and a quick word on why these two.
>
> **MTTR on critical faults — 11.4 hours to 6.** The fastest path to
> that number is collapsing the data-hunting time before any action
> happens. That's exactly what an agent layer is good at — it can
> resolve the asset 360 in seconds instead of half an hour.
>
> **Warranty claim cycle time — 22 days to under 7.** Same pattern,
> different surface. If the agent stages the claim at fault time,
> what was a batched 22-day workflow becomes an hours-long human
> review.
>
> Why not parts attach rate, the third KPI in the brief? It's the
> right strategic number, but it's a 12-to-18-month lift dominated by
> go-to-market — not the agent layer. I optimized for KPIs the agent
> layer is the most direct lever for. The other KPI doesn't get
> abandoned; it gets unblocked once these two are working."

---

## Slide 4 — Solution overview (3 min)

*[On screen: pattern boxes, then three subsections — Salesforce-native,
Streamlit reference, headless Vercel surface]*

> "The pattern, six steps: *event → resolved context → KB-grounded
> reasoning → action library → trust gate → outcome*. Every box maps
> to a Salesforce capability, which I'll walk in Slide 6.
>
> I built this twice, intentionally.
>
> **The primary artifact is Salesforce-native.** Seven custom objects,
> 59 fields, four Apex `@InvocableMethod` action classes, and two
> Agentforce agents — `Bedrock_Service_Triage` as the internal
> Employee Agent for the dealer service rep, and `Bedrock_Customer_Service`
> as the customer-facing Service Agent twin. Same Agent Script,
> same KB grounding, same trust matrix — they differ only in agent
> type, which controls which surfaces the runtime exposes them on.
> 174 sample records loaded. Real records created at runtime — Cases
> and Warranty Claims, not payload previews.
>
> **The reference design is off-platform** — a Streamlit + Claude API
> implementation of the same pattern. That answers the panel's
> *'what would you build outside Salesforce?'* question without me
> having to imagine it.
>
> **And there's a third surface — a *headless* agent layer on Vercel.**
> This is the proof point I want you to walk away with. The Vercel
> dashboard both reads records and **invokes the agent itself** over
> REST. Reads go through `/services/data/v66.0/query/`. Writes go
> through the public Agentforce Agent API at
> `api.salesforce.com/einstein/ai-agent/v1`. Authenticated via OAuth
> Client Credentials with JWT-issued tokens. The same agent answers
> from the Lightning panel, from the Agent Builder Preview, and from
> this off-platform SPA. *Headless* — decoupled from any one UI surface.
>
> What I deliberately did **not** build: cohort fault clustering,
> dedup on noisy sensors, a second subagent for ad-hoc knowledge,
> outbound message *send* — I kept the agent narrow on one
> well-defined journey rather than spreading it thin. Drafts only,
> never sends."

---

## Slide 5 — Three pillars (2 min)

*[On screen: three pillars — grounded reasoning, trust posture, Salesforce translation]*

> "Three pillars hold the build up.
>
> **One: grounded reasoning, not generation.** Every recommendation
> the agent makes cites a KB section. If a fact isn't in the resolved
> context or the retrieved KB, the agent omits it. That's enforced
> in the system prompt, not hoped for. You'll see this in the demo —
> part numbers and SLA windows come out verbatim from the KB.
>
> **Two: trust posture is data, not vibes.** Every action lives in a
> matrix the panel can read. Autonomous where the cost of being
> wrong is low and the cost of inaction is real. Recommend where
> there's cost or relationship impact. Human-required where the
> action is financial or escalatory. Default-deny on unknown actions.
> I'll defend three of these rows on Slide 8.
>
> **Three: the Salesforce translation is in the UI.** You don't have
> to imagine how this lands on platform. I rendered the architecture
> as the fourth tab of the dashboard — every custom object, every
> Apex class, the agent topology, the trust matrix, all visible."

---

## Slide 6 — Architecture & data model (4 min)

*[On screen: the Section 1 diagram from architecture.md. Tell the panel to also
read the Section 3 Salesforce translation table while you talk]*

> "Show this diagram and the Section 3 translation table in architecture.md
> together — the diagram is the verbal walkthrough; the table is the
> evidence. Read both.
>
> Four things I want to walk:
>
> **First, identity resolution.** Asset to customer to contract to
> recent telemetry — joined deterministically on external IDs:
> `Customer_Id__c`, `Asset_Id__c`, `Serial_Number__c`. In my build
> this lives in one Apex class — `BedrockAssetContext` — as a single
> SOQL with relationship traversal. At Bedrock scale this is **Data
> Cloud Identity Resolution** rules. Same pattern, declarative runtime.
>
> **Second, context assembly.** One Apex action returns the full asset
> 360 — customer, contract, warranty status, the last ten telemetry
> events, *and* the customer-level KPIs: open critical faults in the
> last 30 days, ARR at risk. The agent gets facts, not raw data. That's
> a deliberate inversion of what you usually see — most agent demos
> dump JSON and ask the LLM to summarize. I do the math before the
> LLM reasons.
>
> **Third, retrieval.** SOSL over seven `Bedrock_KB_Section__c`
> records, with a 'return all sections' fallback when the index hasn't
> built. Cheap, deterministic, auditable. The panel can read the
> retrieval score column. Production swaps this for Data Cloud Vector
> Database — same retrieval contract, different implementation.
>
> **Fourth, agent runtime split.** Agent Script has two phases —
> deterministic resolution, then LLM reasoning. I inject the per-tier
> SLA windows in the deterministic phase, so the LLM *never* sees
> the question of 'what's the Platinum SLA?' It only sees the answer.
> That's how I keep the demo consistent across runs."

---

## Slide 7 — Integration strategy: multi-layered, zero-copy-led (2 min)

*[On screen: the four-layer table — Data Cloud zero-copy, headless REST
APIs, MCPs, Apex/Flow — with built vs recommended for each]*

> "This is the slide where you'll get questions about scale. I want to
> pre-empt them.
>
> The architecture is **multi-layered** by design. Four integration
> vectors, each carrying the load it's best suited for. I'll say what
> I built and what I'm recommending — the distinction matters.
>
> **Layer one: Data Cloud zero-copy federation.** This is the lead.
> 2.4 petabytes stays in Snowflake; Data Cloud queries through it.
> Customers, contracts, warranty status get ingested because they're
> small and volatile and used as agent gates. The latency cost on
> federated reads is real — mid-double-digit milliseconds — but the
> mitigation is a single prefetch at fault time, not row-by-row
> reasoning. *Zero-copy where data has gravity* is the framing.
> This is the recommendation; on a Developer Edition org I can't
> demo Data Cloud federation, but the architecture is built for it.
>
> **Layer two: headless REST APIs.** This is what I built and what
> you'll see live in the demo. The Vercel dashboard invokes the
> `Bedrock_Customer_Service` agent via the public Agent API. Creates
> real records on platform. *Headless* — because the agent layer is
> decoupled from any one UI surface. Same agent invocable from the
> Lightning panel, Agent Builder Preview, MIAW, Experience Cloud,
> *and* this off-platform SPA. Proof, not diagram.
>
> **Layer three: MCPs — Model Context Protocol.** Standardized
> agent-to-tool wiring across vendors. This is the next vector worth
> investing in. Means Bedrock's own asset-telemetry MCP server, or
> a third-party logistics MCP, plugs into the agent without bespoke
> Apex per tool. Not built today. Salesforce is shipping MCP support
> across Agentforce now, and because my tools are already a small
> set of named `@InvocableMethod` classes, adopting MCPs is a small
> refactor, not a rewrite.
>
> **Layer four: Apex and Flow.** This is where the trust matrix has
> to live. It's the only layer where Salesforce can enforce policy
> regardless of which surface initiated the conversation. Built.
>
> Headline: don't pick one. The architecture works because each layer
> does what it's best at."

---

## Slide 8 — Design choices & trust boundary (3 min)

*[On screen: the Section 5 trust matrix from architecture.md]*

> "Show the trust matrix. I want to walk three rows — these are the
> defenses you should test me on.
>
> **`stage_warranty_claim` is Autonomous.** This is the row that
> usually gets pushback. Why is the agent allowed to *stage* a
> warranty claim without a human in the loop? Because KB Section 5
> sets a 72-hour entitlement window. After 72 hours, the dealer can
> still submit, but at reduced reimbursement. Bedrock estimates that
> window costs them $180 million a year in warranty leakage. So the
> cost of *inaction* is higher than the cost of a wrong staging —
> a service manager rejecting a staged claim is cheap; missing the
> window is expensive. Therefore staging is autonomous and submission
> stays human-required. That's the override-AI example I'll cite again
> in Slide 10.
>
> **`dispatch_technician` is Recommend.** Dispatch costs are real and
> asymmetric — sending a tech to the wrong site is hours of labor
> wasted plus a customer-relationship cost. The agent surfaces the
> right recommendation with rationale, the human approves the cost.
> Same agent capability, different posture, because the consequence
> profile is different.
>
> **`escalate_to_bedrock_engineer` is Human-required.** Engineering
> escalation is the most precious filter Bedrock owns. If the agent
> escalates autonomously, the signal-to-noise on engineering's queue
> degrades. So this one is human-only, period.
>
> One thing I deliberately left out: autonomous customer outbound.
> Drafts only, never sends. Production gates send through Marketing
> Cloud journey — template-locked, governed, not in the agent's
> trust matrix at all."

---

## Slide 9 — Live demo (12 min)

*[On screen: the Lightning Agentforce panel pinned open on the right]*

> *(This is mostly action, not slides. Below is the verbatim narration
> for each demo step. See deck-outline.md Slide 9 for the click-by-click
> sequence; reproduced here as spoken voice.)*
>
> **Setup framing (15 sec):**
> > "This is the dealer service rep's actual surface — Lightning
> > Experience with the Agentforce panel embedded. In production,
> > when Bedrock Connect detects a critical fault, the rep can ask
> > the agent to triage in plain language. The agent is published
> > and activated in this org — not a developer preview."
>
> **After pasting the headline utterance and watching the trace (30 sec):**
> > "Five tools fire — you can see them in the trace. Capture fault
> > details, get asset context, retrieve knowledge, open service
> > case, stage warranty claim. The last two are the autonomous
> > actions. The trust policy already decided they're safe; the
> > agent isn't *deciding* to run them — it's executing what the
> > policy declared autonomous."
>
> **Walking the response (1 min):**
> > "Three things to point at. The part numbers — `HYD-MP-9912` and
> > `HYD-RV-2204` — those are verbatim from KB Section 1, not
> > hallucinated. The 'pressure variance >8% after relief test'
> > threshold — specific operational guidance from the KB. And the
> > 4-hour Platinum SLA — that number comes from a *deterministic
> > prompt injection*. Agent Script evaluates the resolved service
> > tier before the LLM reasons, so the LLM never sees a question
> > of '4 or 8 hours' — it only sees 'Platinum is 4 hours.' That's
> > how I keep the demo consistent run-to-run."
>
> **Switching to the Lightning record tabs (1 min):**
> > "This isn't a fake payload. The agent created a real Service Case
> > in Salesforce — same record the service console would route. And
> > here's the staged warranty claim — KB Section 5's 72-hour window
> > made inaction the more expensive failure, so staging is autonomous;
> > submission still requires service-manager approval. That's the
> > override-AI moment I talked about on the trust slide."
>
> **The trust-boundary variant — ASSET-50203 (1 min):**
> > "Same fault code, different asset. Granite Construction, Gold tier,
> > warranty expired. Watch the trace — `stage_warranty_claim` does
> > NOT fire. And the SLA quoted shifts from 4-hour Platinum to
> > 8-hour Gold. Same agent, same KB, same trust matrix. But the
> > matrix gates on real data — it's not theatrical."
>
> **Switching to the Vercel dashboard (60 sec) — the headless beat:**
> > "Now switch gears. This is **not** the Lightning panel. This is a
> > Vite/React SPA on Vercel — no Salesforce dependency on the client
> > side. Two integration paths through one Connected App: the rails
> > consume Salesforce REST for reads, and the chat invokes the public
> > Agentforce Agent API at `api.salesforce.com/einstein/ai-agent/v1`.
> > Authentication is OAuth Client Credentials plus JWT — the gateway
> > requires JWT format, not opaque bearer tokens. *This is the
> > headless agent layer.* The same agent that just ran in Lightning
> > is now running from an off-platform SPA. Let me prove it." *(Type
> > the headline utterance in the chat. Watch the rail.)*
> >
> > *(When the BSV pulses):*
> > "There. A real `BSV-*` case, created on platform, pulsing on the
> > rail. The rails poll every 10 seconds. The pulse is
> > CreatedDate-recency based — any record within the last 60 seconds,
> > regardless of when the page loaded. The trust-color stripe — green
> > because `open_service_case` is autonomous — makes the Section 5 policy
> > legible inline."
> >
> > *(Click a row to open the modal):*
> > "Detail dialog opens in-app — Subject, fault code, asset, customer,
> > service tier, the timeline. The footer says 'created by
> > `open_service_case`' so the provenance is visible. Two surfaces,
> > one source of truth, no Salesforce license needed on the consumer
> > side. This is how a fleet-ops director or a BI tool or a partner
> > app would read what the agent produced."
>
> **Closing the demo with the architecture diagram (30 sec):**
> > "Two more things — one, the architecture diagram in
> > architecture.md, which is how this lands in a Bedrock-scale
> > deployment against the 2.4 PB Snowflake telemetry. Two, the
> > Streamlit reference design — same pattern, off-platform,
> > Claude API instead of Agentforce — kept as a backup if you want
> > to see how the pieces connect outside the platform."

---

## Slide 10 — How I used AI (1 min)

*[On screen: tools used, what AI generated, what I directed, the override]*

> "The brief asks me to disclose this honestly, so I will.
>
> **Tools.** Claude Code — Anthropic's CLI — running Claude Opus 4.7.
>
> **What AI generated end-to-end.** The two-side build: both the
> Streamlit reference design and the Salesforce-native demo —
> custom objects, fields, Apex action classes, the Agent Script
> bundle, permission set, list views, tabs, data import. AI also
> caught the bugs as we tested: a Body__c FLS gap that silently
> dropped KB content, an SLA hallucination drift before I added
> the deterministic prompt injection, a `lightning__integerType`
> vs `numberType` schema mismatch on Apex outputs.
>
> **What I directed.** The KPI choice — MTTR and warranty cycle,
> not parts attach. The trust posture matrix — every row defended
> by hand. The federation-vs-ingestion position on Snowflake. The
> decision to scope the agent narrowly to fault triage rather than
> spread it across all dealer service queries. The framing for the
> panel: *headless*, *multi-layered*, *zero-copy*.
>
> **One override.** AI's first draft of the trust policy made
> `stage_warranty_claim` a Recommend posture. I read KB Section 5,
> saw the 72-hour entitlement window and the $180M annual warranty
> leakage, and inverted the posture to Autonomous. The reason lives
> in the data: when the cost of inaction exceeds the cost of a
> wrong action, staging should happen by default. That's now a
> hard-coded 'MUST execute' rule in the agent's instructions with
> the KB citation as the justification."

---

## Slide 11 — Outcomes & next steps (3 min)

*[On screen: KPI deltas and the week-2 build list]*

> "Map back to the KPIs.
>
> **MTTR.** The agent collapses the data-hunting wedge. 30 to 40
> percent of dealer-rep time recovered — that's a meaningful slice
> of the 11.4 to 6-hour delta. The rest comes from prepositioning
> parts and pre-staged dispatch, which I scoped out and would build
> in week 2.
>
> **Warranty cycle time.** Stage at fault time, review in 72 hours,
> submit in hours rather than weeks. The architecture is what closes
> the gap. The agent's autonomous staging is the load-bearing
> mechanism.
>
> **Week 2 build plan:**
> 1. **Cohort fault retrieval** — Data Cloud Vector DB + similarity
>    search. 'This fault pattern preceded a major failure on four
>    other assets in the last 90 days.'
> 2. **Dedup / suppression Flow** — a lightweight Flow that
>    suppresses repeated cases on the same `asset_id + fault_code`
>    within a configurable window. Handles the noisy-sensor failure
>    mode I called out in Slide 8.
> 3. **Dealer prepositioning recommendation** — nightly Flow + Data
>    Cloud aggregation, surfaced as an action.
> 4. **Real Marketing Cloud outbound** — template-locked, journey-
>    gated send instead of drafted text.
> 5. **MCP adoption** — wrap the Apex actions behind an MCP server
>    so Bedrock can plug third-party tools (logistics, parts
>    catalogs) into the same agent without bespoke wiring.
>
> **Deployment and release management** — worth a sentence. This
> build is deployed via standard `sf project deploy start`. The
> permset is reusable. The agent topology is data-driven, not
> hand-wired. Adding the second agent for Bedrock_Customer_Service
> was a single bundle deploy plus a manual Topic-wiring step in
> Agent Builder. The release shape is repeatable.
>
> **What I would *not* build.** A custom LangGraph orchestrator.
> Agentforce plus Atlas is the right runtime for the deployment
> surface — Service Console. Don't reinvent."

---

## Slide 12 — One question for the panel (30 sec)

*[On screen: three options]*

> "I have one question for you — pick the one that fits the time you
> have.
>
> *(Default — pick this if no clear signal which is better:)*
>
> > "For multi-cloud customers like Bedrock with Snowflake as their
> > data gravity center, where do you see Data Cloud federation
> > losing to Snowflake-native AI workloads today, and how does that
> > shape your guidance to customers?"
>
> *(If the panel was technical / leaned into architecture:)*
>
> > "When you walk into an account like this, what's the smallest
> > first agent you've seen drive measurable KPI movement in 90 days?"
>
> *(If the panel was sales-leaning / wants framing advice:)*
>
> > "What do candidates for this role most often *underweight* when
> > they map a build like this to Salesforce?"
>
> The briefing rewards asking *a* question, not picking the perfect
> one. Don't overthink it; commit, listen, follow up."

---

## End-of-presentation cue (5 sec)

> "That's the build. Happy to go anywhere — into the trust matrix,
> the federation argument, the headless layer, the override — whatever
> the panel wants to push on."

---

## Iteration notes

After your first dry-run, look for these tells:

- **Words that don't sound like you.** Rewrite to your voice. The above
  is a starting point, not a script you owe verbatim.
- **Sentences over 25 words.** Break them in two when speaking — your
  brain pauses for breath naturally.
- **Anywhere you stumble repeatedly.** That's where the logic isn't
  sharp enough in your own head. Rewrite the bullet, not just the words.
- **Slide that runs long in rehearsal.** Cut a beat, not pace. Time
  budget is hard.
- **A panelist's question pulls you off-script.** Good — answer their
  question, then route back to the next slide with *"…which actually
  ties into the next slide…"*.

Two full dry-runs minimum before the recording. One with the timer on,
one with the timer off. The timer-on one is for pacing; the timer-off
one is for catching where your voice goes flat.
