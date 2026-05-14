# Verbatim talking points — Innovation TA panel

Slide-by-slide script for the 35-minute present block. Per slide:
**Time** (hard ceiling) · **Talking points during** (verbatim) · **Likely
interrupts** (with answers) · **Transition** · **Pitfalls** (the things
not to do). Rehearse twice; iterate the voice; commit.

Marcus's framings to lean on, in order of weight:
- **"Headless"** — every time the Vercel/REST surface comes up.
- **"Multi-layered"** — Slide 7 explicitly; sprinkle elsewhere.
- **"Zero-copy"** — Slide 7 lead phrase. Use it where Data Cloud comes up.
- **"Generative AI layer"** — when introducing the agent.
- **Systems history** — name SAP, ServiceMax, WARRANTY-7, Snowflake at
  least once each to show you've read the brief.
- **Deployment / release management** — Slide 10 or 11.

---

## Slide 1 — Title

**Time: 15 seconds. Not more.**

**Talking points during:**

> "Bedrock Heavy Equipment, proactive service for connected equipment.
> The frame is in the subtitle: from event to action before the customer
> knows there is a problem. That is the architecture story today. I'll
> spend about 35 minutes total, weighted toward the demo. Interrupt me
> whenever something is worth going deeper on."

**Transition:**

> "Let's start with the problem, because it shapes every architectural
> call I made."

**Pitfalls:**
- Don't introduce yourself by resume. The panel has read it. Twenty
  seconds of yourself max if you do anything.
- Don't apologize for anything. Not for time, not for build scope, not
  for being new to Salesforce.

---

## Slide 2 — Frame the problem

**Time: 90 seconds.**

**Talking points during:**

> "Bedrock has spent a decade instrumenting its fleet. The telemetry
> exists. 2.4 petabytes of it. 900,000 assets reporting every 30 seconds.
> The instrumentation investment is real.
>
> What is missing is the connective tissue. Telemetry, contracts, parts,
> service history, and warranty all live in five or more separate
> systems. The dealer service rep spends 30 to 40 percent of their day
> data-hunting before they can take a single action. That is not a UX
> problem. That is an architecture problem.
>
> The cost is countable. 180 million dollars a year in warranty leakage.
> MTTR of 11.4 hours against a 6-hour target. Dealer CSAT at 62 against
> an 80 target. These are auditable line items, not estimates.
>
> The CIO has framed it well: the next era of competitive advantage is
> not more telemetry, it is the agent layer that turns telemetry into
> action."

**Likely interrupts:**

| Q | A |
|---|---|
| *"Why this customer? Why this framing?"* | "Bedrock represents the pattern that shows up across heavy industry, oil and gas, utilities, manufacturing. Telemetry without activation. The architectural problem is structural across the vertical." |
| *"How did you validate the 30-40% data-hunting number?"* | "It's from the briefing materials, and it tracks with what I've seen at industrial clients in my consulting work at InCycle. The specific percentage is less important than the pattern, which is that human time spent assembling context dwarfs the time spent acting on it." |

**Transition:**

> "I picked two KPIs to contract myself against. Let me show you which
> ones and why."

**Pitfalls:**
- Don't read the slide aloud verbatim. Reference the numbers, add the
  architectural framing the slide doesn't have.

---

## Slide 3 — KPIs I contracted myself to move

**Time: 75 seconds.**

**Talking points during:**

> "Two KPIs. MTTR on critical faults, 11.4 hours to under 6. Warranty
> claim cycle time, 22 days to under 7.
>
> Both are agent-direct levers. MTTR moves because the agent collapses
> the data-hunting wedge in front of every fault. The dealer rep walks
> into a fault with resolved context, not raw signal. Warranty cycle
> moves because the agent stages the claim at fault time, which converts
> a 22-day batched workflow into an hours-long human-in-the-loop review.
>
> I deliberately did not contract against parts attach rate. It's the
> right strategic KPI for Bedrock, but it's an 18-month lift dominated
> by go-to-market motion, not the agent layer. Picking it would have
> been ambitious and dishonest. I optimized for the KPIs where the
> agent is the most direct lever."

**Likely interrupts:**

| Q | A |
|---|---|
| *"What about CSAT or contract renewals?"* | "Same logic. Second-order outcomes that follow from the first two. The architecture that moves MTTR and warranty cycle creates the conditions for CSAT recovery, but that's a downstream measurement, not an agent-direct lever. I'd target it explicitly in a phase 3 build with Service Cloud Voice and CSAT instrumentation." |
| *"How confident are you in the MTTR delta?"* | "Confident in the architectural mechanism. The size of the delta depends on how much of the 11.4 hours is data-hunting versus actual repair time. The briefing materials say 30 to 40 percent is data-hunting. That's the band the agent can close. Whether MTTR lands at 5 hours or 7 depends on the dealer adoption curve and the operational discipline around the new workflow. The architecture is the lever. The execution is what determines how far it pulls." |

**Transition:**

> "Here is the pattern I built against those KPIs, and the two
> implementations of it."

**Pitfalls:**
- Don't oversell certainty on KPI numbers. The architect's voice on
  numbers is "confident in the mechanism, calibrated on the magnitude."

---

## Slide 4 — Solution Overview · the pattern and what I built

**Time: 2 minutes. This is the architectural anchor of the deck. Slow down here.**

**Talking points during:**

> "The pattern, six steps. Inbound event. Resolved context. KB-grounded
> reasoning. Action library. Trust gate. Outcome captured. Every
> agentic system worth deploying does some version of this. The
> variation is in which layer is rigorous and which is hand-waved.
>
> I built this pattern twice. The Salesforce-native primary artifact is
> what runs in the demo. Seven custom objects, 59 fields, four Apex
> InvocableMethod action classes, and two Agentforce agents that share
> an agent script, a knowledge base, and a trust matrix. The Bedrock
> Service Triage agent serves the dealer service rep through the
> Lightning panel. The Bedrock Customer Service agent is the
> customer-facing version, deployable to Experience Cloud or messaging
> surfaces.
>
> 174 sample records are loaded. Real Cases and Warranty Claims get
> created on every run. These are artifacts, not payload previews. The
> dealer rep sees actual records, not mock JSON.
>
> The off-platform reference design is a Streamlit application running
> on Claude API directly. Same pattern, no Salesforce runtime. It
> answers a question I expected to get: what would you build outside
> Salesforce, and why is Salesforce the right place to build this? The
> Streamlit version is the honest comparison. Same trust matrix, same
> KB grounding, no platform-enforced governance underneath. It's how I
> show why the platform matters without disparaging the alternative.
>
> The Vercel single-page app is the third surface. It reads via
> Salesforce REST every 10 seconds and writes by invoking the public
> Agentforce Agent API. OAuth client credentials, JWT-issued tokens,
> integration user with a scoped permission set. Records created on the
> platform appear on the dashboard within about 60 seconds. The
> architectural point: the agent layer is callable from anywhere over
> HTTP. Lightning, Builder Preview, MIAW, Experience Cloud, or
> off-platform. **Headless** by design."

**Likely interrupts:**

| Q | A |
|---|---|
| *"Why two agents instead of one?"* | "Separation of trust postures. The dealer-facing agent can stage warranty claims and open service cases autonomously because the rep is the immediate human reviewer. The customer-facing agent never writes to the warranty record because the customer is the subject of the warranty, not its reviewer. Same script foundation, different action scopes. That's the right pattern for multi-channel agent deployments." |
| *"Why also build off-platform?"* | "Two reasons. First, it forces me to defend why Salesforce is the right runtime for this use case rather than asserting it. Second, it proves the pattern is portable. The agent design isn't locked to one runtime. That's the kind of architectural decoupling that customers appreciate when they're evaluating long-term platform commitments." |
| *"What's in the four Apex actions?"* | "Get asset context, retrieve knowledge, open service case, stage warranty claim. Each is an InvocableMethod the agent calls via the Topics framework. The asset context one does the heavy lifting: one SOQL with relationship traversal returns customer, active contract, last 10 telemetry events, and customer-level KPIs like ARR at risk." |

**Transition:**

> "Three design pillars hold the whole architecture together. Let me
> walk through them."

**Pitfalls:**
- Don't speed through this slide. It establishes credibility for
  everything that follows.
- Don't apologize for the Vercel piece being outside the platform.
  Frame it as deliberate proof of headless callability.

---

## Slide 5 — Three design pillars

**Time: 75 seconds.**

**Talking points during:**

> "Three pillars. Each one is a design constraint I enforced, not a
> claim I made.
>
> First, **grounded reasoning, not generation.** The agent cites a KB
> section for every recommendation. If a fact isn't in the resolved
> context or the knowledge base, it's omitted. Not inferred, not
> approximated. Enforced by the system prompt, not hoped for. Every
> diagnostic recommendation traces back to a KB article section
> verbatim. This is the hallucination defense at the architectural
> level, not the prompt level.
>
> Second, **trust posture is data, not vibes.** Every action has an
> explicit posture in a matrix the panel can read. Autonomous when the
> cost of being wrong is low. Recommend when there's cost or
> relationship impact. Human-required when the action is financial or
> escalatory. Default-deny on unknown actions. The policy is legible
> and auditable. It's not buried in a prompt.
>
> Third, **the Salesforce translation is in the UI.** The panel doesn't
> have to imagine the Salesforce architecture. The demo-to-platform
> translation table is rendered as the fourth tab of the dashboard.
> Telemetry, reference data, KB, reasoning, every action, comms, dealer
> surface, audit. The architectural argument is visible, not described."

**Likely interrupts:**

| Q | A |
|---|---|
| *"How do you enforce 'grounded reasoning, not generation' technically?"* | "Two mechanisms. The system prompt explicitly forbids inference outside the resolved context. The Apex action returns structured facts, not raw data, so the LLM is reasoning over a fact set, not synthesizing from a data dump. In production, you'd add eval gates that score recommendations against KB citations and reject ones that drift." |
| *"What's an example of 'data, not vibes' in the trust matrix?"* | "Stage warranty claim. The matrix says autonomous, justified by KB Section 5, which specifies a 72-hour entitlement window. The 'why' is a citation, not an opinion. That's auditable. A future architect can read the matrix and either confirm the citation still applies or change the posture based on new evidence." |

**Transition:**

> "Let me get specific on the architecture and data model."

---

## Slide 6 — Architecture and data model

**Time: 2 minutes. Slow down again.**

**Talking points during:**

> "Four architectural decisions that make this production-credible, not
> just demo-credible.
>
> **Identity resolution.** Asset to customer via deterministic
> external-ID join on Customer_Id, Asset_Id, and Serial_Number. In this
> build, that's one SOQL with relationship traversal in the
> BedrockAssetContext Apex class. In a production-scale Bedrock
> deployment, the same logical pattern runs through Data Cloud's
> Identity Resolution rules. Declarative runtime, same outcome. The
> agent doesn't care which mechanism resolves identity. The
> architecture is the same.
>
> **Context assembly.** One Apex action returns the full asset 360.
> Active contract, last 10 telemetry events, and customer-level KPIs
> including open critical faults over 30 days and ARR at risk. The
> agent receives facts, not raw data. That's the difference between a
> demo and a production system. The reasoning surface isn't asked to
> synthesize numbers it could get wrong. The numbers are pre-calculated
> and presented.
>
> **Retrieval.** SOSL over seven KB section records with a 'return all
> sections' fallback when the index hasn't built. Cheap, deterministic,
> auditable. The production swap is Data Cloud Vector Database. Same
> retrieval contract, different implementation. The agent calls
> retrieve_knowledge regardless of the substrate behind it.
>
> **Agent runtime split.** The agent script runs two phases:
> deterministic resolution first, then LLM reasoning. Per-tier SLA
> windows are injected in the deterministic phase. Critical-Platinum
> is 4 hours. Critical-Gold is 8 hours. The LLM never sees a question
> about SLA. It only sees the answer. This is how I guarantee demo
> consistency across runs. The LLM can't drift on something it never
> reasons about."

**Likely interrupts:**

| Q | A |
|---|---|
| *"Why not just put SLA in the prompt?"* | "Because that's exactly where LLM drift happens. Numerics in prompts are unstable across model versions. If I move from one model version to the next and the SLA window suddenly becomes 6 hours instead of 4 because the model interpreted the prompt slightly differently, that's a defect that's invisible until a customer hits it. The deterministic phase removes the surface area for that defect." |
| *"How does this scale to thousands of agents and millions of assets?"* | "The data model scales horizontally. SOQL relationship traversal becomes Data Cloud calculated insights. The retrieval substrate moves from SOSL to vector search. The Apex actions stay the same in shape and become the contract between agent and platform. Scaling the agent runtime is Salesforce's problem, not the customer's. That's part of the value of building on the platform rather than a custom orchestrator." |

**Transition:**

> "On integration: I didn't pick one model. Each layer carries the load
> it's best suited for."

---

## Slide 7 — Integration strategy · multi-layered, zero-copy-led

**Time: 90 seconds. This is the slide the architecture panelists will care about most.**

**Talking points during:**

> "Four integration layers. Each carries a specific load.
>
> **Data Cloud zero-copy federation.** The 2.4 petabytes of telemetry
> stays in Snowflake. Data Cloud queries through it. The customer
> master, contracts, and warranty status get ingested because they're
> small, volatile, and used as join keys and agent gates. This is the
> lead architecture recommendation. It's theoretical in this DE-org
> demo, but it's the architecture decision that should anchor any Data
> Cloud sales conversation for a customer with Snowflake as data
> gravity. The principle: respect what the customer has built.
> Bedrock's Snowflake investment is real. The architecture works with
> it, not against it.
>
> **Headless REST APIs.** Built and live. The Vercel SPA proves the
> agent layer is callable from anywhere over HTTP. OAuth client
> credentials plus JWT. Integration user with a scoped permission set.
> The architectural point is decoupling the agent from any one UI
> surface.
>
> **Model Context Protocol — MCPs.** Not built in this demo, but
> architecturally positioned for. Standardized agent-to-tool wiring.
> Bedrock's own asset telemetry MCP, third-party logistics MCPs, plug
> in without bespoke Apex per tool. The extension path that
> future-proofs the integration estate.
>
> **Apex and Flow on-platform.** Trust gate enforcement, action
> execution, audit trail. The only layer where Salesforce enforces
> policy regardless of which surface initiated the conversation.
> Built: four Apex InvocableMethod classes.
>
> The 2.4 petabytes does not move. That's the single biggest
> cost-and-realism win in the architecture."

**Likely interrupts:**

| Q | A |
|---|---|
| *"What about latency on federated queries?"* | "Right, federation has higher latency than native Data Cloud queries. The mitigation is the two-tier ingestion pattern. The high-volume telemetry stays federated because queries against it are episodic, triggered by fault events. The low-latency reference data — customers, contracts, warranty status — gets ingested so the agent's context assembly stays fast. Federate the cold and large, ingest the hot and small. That's the cost-and-latency-aware split." |
| *"What about Snowflake's own AI, like Cortex?"* | "Cortex is a strong analytical AI capability. It runs LLM functions over warehouse tables, builds embeddings, executes batch inference at scale. The architectural separation is that Cortex does AI to the data, Agentforce does AI for the customer. They coexist well: Cortex generates analytical features in Snowflake, those features flow back into Data Cloud as calculated insights, Agentforce reasons over them during customer interactions. Different parts of the AI stack, both valuable." |
| *"Why MCPs instead of standard APIs?"* | "MCPs give you a standardized agent-to-tool contract that's portable across runtimes. The agent doesn't care if it's Agentforce or another runtime calling the tool. That portability matters for customers who are thinking about long-term agent strategy beyond any one platform." |

**Transition:**

> "The trust matrix is the design choice I want to defend most explicitly."

**Pitfalls:**
- Don't disparage Snowflake or Cortex. Frame as complementary.
- Don't say "Salesforce is better than" anything. Say "the architecture
  works because" of how the pieces compose.

---

## Slide 8 — Design choices and trust boundary

**Time: 90 seconds.**

**Talking points during:**

> "Three rows tell the architectural story.
>
> **Stage warranty claim, Autonomous.** KB Section 5 specifies a
> 72-hour entitlement window. Missing it forfeits the claim. Inaction
> is the more expensive failure. The cost of a service manager
> rejecting a staged claim is near-zero. The cost of forfeited
> entitlement is material. This is the override-AI moment in my build.
> AI's first draft made this a Recommend posture. I read the data,
> saw the asymmetric cost of inaction, and inverted it. Now it's
> hard-coded as a must-execute rule with the KB Section 5 citation as
> the justification.
>
> **Dispatch technician, Recommend.** Dispatch costs are real and
> asymmetric. The agent surfaces the right recommendation. The human
> approves the cost. The agent is never wrong about the recommendation.
> The human owns the economic decision. That's the right division of
> labor for actions with financial consequences.
>
> **Escalate to Bedrock engineer, Human-required.** The engineering
> escalation signal is the most precious filter Bedrock owns. Eroding
> it with autonomous escalation breaks the human-of-last-resort model.
> Every autonomous escalation that turns out to be a false positive
> degrades the channel that matters most. The posture protects the
> signal.
>
> What I deliberately left out: autonomous customer outbound. The agent
> drafts the message. It never sends. In production, customer comms
> route through Marketing Cloud with template locks. That's the right
> place for the send authority, not the agent."

**Likely interrupts:**

| Q | A |
|---|---|
| *"How did you decide which posture is right for which action?"* | "Two questions. First, what's the cost of being wrong? Second, what's the cost of inaction? When the cost of inaction exceeds the cost of being wrong, the action goes Autonomous. When the cost of being wrong is material — financial impact, customer relationship damage, reputational risk — the action goes Recommend or Human-required. The warranty claim case is the clearest illustration of that calculus." |
| *"What's the audit trail for the autonomous actions?"* | "Every agent invocation logs the resolved context, the KB citations referenced, the action selected, and the timestamp. In production with Einstein Trust Layer, you add dynamic masking, zero-data-retention with the model provider, and prompt-completion audit. The trust matrix is the policy. The audit is the proof of policy enforcement." |

**Transition:**

> "Let's see this run."

---

## Slide 9 — Live demo · end-to-end triage loop

**Time: 12 minutes of actual demo, plus narration.**

**Pre-demo statement (do this every time):**

> "I'll drive this through the Lightning Agentforce panel with Agent
> Builder Conversation Preview as backup. The full loop is about 5
> minutes. I'll narrate the trace as it runs. Streamlit is open in a
> separate tab as a backup. Interrupt me whenever you want to look at
> code or go deeper on a specific decision."

**Demo narration per step:**

**Step 1 — Open Lightning Experience with the Agentforce panel pinned:**

> "Lightning Experience, dealer service rep view. Agentforce panel
> pinned on the right. Agent is set to Bedrock Service Triage. This is
> the rep's primary write surface."

**Step 2 — Trigger the conversation:**

> "I'll trigger with a realistic fault prompt. Critical HYD-447
> hydraulic fault on Asset-50101. Triage and recommend next steps."

**Step 3 — Narrate the trace:**

> "Watch the action sequence. capture_fault_details runs first to
> structure the input. get_asset_context resolves identity and pulls
> the asset 360. retrieve_knowledge pulls KB Section 1, the hydraulic
> fault reference. open_service_case fires autonomously.
> stage_warranty_claim fires autonomously. Five actions, one
> conversation, real records written."

**Step 4 — Walk the response:**

> "The response cites KB Section 1 part numbers, the pressure threshold,
> the 4-hour Platinum SLA injected from the deterministic phase, and
> 1.02 million dollars of ARR at risk. The rep sees this in plain
> language with citations. They can act, or they can dig in. The agent
> has done the data-hunting work."

**Step 5 — Switch to Cases and Claims list views:**

> "Real records. BSV-prefix Service Case. BWC-prefix Warranty Claim.
> Both linked to the asset. Both created by the agent. These aren't
> payload previews."

**Step 6 — Trust-boundary variant:**

> "Now I'll run the same fault against Asset-50203. Granite
> Construction, Gold tier, warranty expired. Watch what changes. The
> service case fires. The warranty claim does not. The SLA shifts to 8
> hours because Gold tier has different windows. The trust matrix is
> enforcing policy, not the LLM's interpretation of policy."

**Step 7 — Vercel dashboard (the headless beat):**

> "The records pulse green on the dashboard within 60 seconds. This is
> the proof of headless callability. I can also trigger a new triage
> from the dashboard via the public Agent API and watch the loop close.
> Same agent script, different surface, identical Apex actions on the
> back end."

**If the demo breaks:**

> "Let me fall back. [Switch to Agent Builder Preview, or the CLI, or
> Streamlit.] Same agent, different surface. The architecture is what
> we're really testing, not the deployment substrate."

**Pitfalls during demo:**
- Don't read JSON aloud. Stay in the UI.
- Don't apologize for latency. Narrate over it.
- If the LLM produces something unexpected, acknowledge briefly and
  frame: "That's an interesting variance from the test runs. Let me
  show you the trace and we can look at what triggered it."

---

## Slide 10 — How I used AI

**Time: 60 seconds.**

**Talking points during:**

> "Tools: Claude Code running Claude Opus 4.7. AI generated the full
> two-side build. Both the Streamlit reference design and the
> Salesforce-native demo. Custom objects, fields, Apex action classes,
> agent script bundle, permission set, list views, tabs, data import
> flows, deterministic seed data. AI also caught real bugs in testing:
> a field-level security gap that was silently dropping KB content, an
> SLA hallucination drift in early agent runs, a schema mismatch on
> Lightning component types.
>
> What I directed. The KPI selection: MTTR and warranty cycle, not
> parts attach rate. The trust posture matrix: which actions are
> Autonomous versus Recommend versus Human-required, defended row by
> row. The federation-versus-ingestion position on Snowflake. The
> scoping decision to keep the agent narrow on fault triage rather
> than spreading it across all dealer service queries.
>
> **The override.** AI's first trust policy draft made
> stage_warranty_claim a Recommend posture. I read KB Section 5, saw
> the 72-hour entitlement window and the 180 million dollar annual
> warranty leakage, and inverted it to Autonomous. When the cost of
> inaction exceeds the cost of a wrong action, staging should happen
> by default. That's a judgment call AI couldn't make without the
> asymmetric cost data. The matrix is now hard-coded with the KB
> Section 5 citation as the justification."

**Likely interrupts:**

| Q | A |
|---|---|
| *"Are you worried about AI being too central to your build?"* | "No. AI was the build accelerant. The architectural judgment, the trust posture, the KPI selection, and the override on warranty staging are mine. The honest framing is that AI lets a senior architect build at the speed of thought. The judgment about what to build doesn't change." |
| *"How do you validate AI-generated code in production?"* | "Same as any code. Code review, automated tests, deployment gates, eval frameworks at the agent layer. The difference with AI-generated code is that the volume is higher, so the discipline has to be more rigorous, not less." |

**Transition:**

> "Two minutes on outcomes and what I'd build next."

---

## Slide 11 — Outcomes and what I'd build next

**Time: 90 seconds.**

**Talking points during:**

> "KPI impact. MTTR moves because the agent collapses the data-hunting
> wedge. Recovering 30 to 40 percent of dealer rep time is a meaningful
> slice of the 11.4-to-6 delta. Prepositioning, which is scoped out for
> week 2, closes the rest. Warranty cycle time moves because we stage
> at fault time and review within 72 hours. The architecture closes
> the gap without changing the approval workflow.
>
> **Week 2 build plan. Four items.** Cohort fault retrieval with Data
> Cloud Vector DB across the telemetry corpus. Dedup and suppression
> flow to filter noisy sensors before the agent gets invoked. Dealer
> prepositioning via nightly Flow plus Data Cloud aggregation,
> surfaced as a named agent action. Real Marketing Cloud outbound
> replacing the drafted text output, with template locks.
>
> **What I would not build.** A custom LangGraph orchestrator.
> Agentforce plus Atlas is the right runtime for the deployment
> surface. The agent framework discussion is real and the platform
> answer is defensible. I'd rather invest engineering in the data
> layer and the action library than in re-inventing the orchestration
> substrate.
>
> **Deployment and release management.** Worth a sentence. The build
> deploys via standard `sf project deploy start`. The permset is
> reusable. The agent topology is data-driven. Adding the second agent
> for Bedrock_Customer_Service was a single bundle deploy plus a
> manual Topic-wiring step in Agent Builder. The release shape is
> repeatable."

**Likely interrupts:**

| Q | A |
|---|---|
| *"Why not LangGraph?"* | "Two reasons. First, LangGraph is an orchestration layer on probabilistic models. It's a fine fit for exploratory or unstructured use cases. For a regulated, customer-impacting workflow like Bedrock service, you need the platform-enforced governance underneath. Agentforce sits on Data Cloud's identity layer and inside Salesforce's permission model. That's the discipline you need when an agent might stage a six-figure warranty claim. Second, the engineering team that would maintain a custom LangGraph orchestrator is a team Bedrock doesn't have to staff if they're on Agentforce. Operational cost matters." |
| *"Where would this expand next strategically?"* | "Parts attach rate, once prepositioning is live. CSAT, once Service Cloud Voice integrates. Contract renewal, once Sales Cloud is wired to receive agent-surfaced renewal triggers. The same architecture extends. The agent layer becomes the connective tissue across the customer 360, not just the service motion." |

**Transition:**

> "One question for the panel, and then I'm happy to take whatever you
> want to dig into."

---

## Slide 12 — One question for the panel

**Time: 60 seconds for asking, then let them run.**

**Pick Option A. It's the strongest. Verbatim:**

> "One question for you. For multi-cloud customers like Bedrock with
> Snowflake as data gravity, where do you see Data Cloud federation
> losing to Snowflake-native AI workloads today? And how does that
> shape the guidance you give customers when they're evaluating where
> to invest?"

**Why A and not B or C:**

- A signals you've thought about the real architectural tension in the
  market.
- A asks them to share where the platform has work to do, which is a
  senior conversation.
- A positions you as a peer thinking about customer guidance, which is
  the actual job.
- B is good but reads as more junior, asking about delivery cadence
  rather than architecture strategy.
- C is too open and signals less confidence.

**Pitfalls:**
- Don't ask all three. Pick one and own it.
- Don't apologize for the question being pointed. The briefing rewards
  pointed questions.

---

## Final pre-panel operator checklist

Add these three to the existing setup checklist in
[demo-script.md](demo-script.md):

1. **The cold opener line, memorized verbatim:**
   > *"From event to action before the customer knows there is a
   > problem. That's the architecture story I'll walk you through over
   > the next 35 minutes."*

   Drop this if any moment of silence opens up.

2. **The recovery line if something breaks live:**
   > *"Let me flip to the backup. The architecture is what we're really
   > testing, not the substrate."*

   Then switch and keep going.

3. **The close line for the demo:**
   > *"That's the loop. Real records, real trust matrix enforcement,
   > real KPI movement. Let me show you outcomes and what I'd build
   > next."*

---

## Suggested optional deck additions

Two small additions if you have time. Both are filed as **backup slides
B5 and B6** in [deck-outline.md](deck-outline.md) so they're available
on demand but don't bloat the main 35-min budget.

**Backup B5 — Salesforce Translation callout.** A simple table mapping
the build to Salesforce products at production scale. Surfaces the
on-platform translation that's otherwise distributed across architecture.md
§3 and the dashboard's Architecture tab.

| What I built | Salesforce product at production scale |
|---|---|
| 7 custom objects | Same + Data Cloud DMOs for unified profiles |
| 4 Apex InvocableMethods | Same, augmented with Flow for declarative paths |
| SOSL over KB sections | Data Cloud Vector Database |
| Apex AssetContext rollup | Data Cloud Calculated Insights |
| One SOQL identity resolution | Data Cloud Identity Resolution |
| Custom telemetry object | Data Cloud zero-copy federation to Snowflake |
| Trust matrix in agent script | Einstein Trust Layer dynamic grounding |

**Backup B6 — What I deliberately left out** (consolidated scope
decisions, currently scattered across Slides 4, 8, and 11):
- Autonomous customer outbound (drafted, never sent)
- Data Cloud (architecturally recommended, not built into DE org)
- MuleSoft integration to WARRANTY-7 and SAP (architecturally positioned)
- Dealer prepositioning flow (week 2 scope)
- Real MCP integrations (extension path)

If forced to choose between adding these and rehearsing the demo flow
twice more — rehearse.

---

## One last calibration

The briefing says *"the build is short, the thinking is the job."* The
deck and the architecture document show the thinking is there. These
talking points are about making sure the panel **hears** the thinking
out loud, with the right pace and the right register.

The architect's voice: confident in the mechanism, calibrated on the
magnitude. Don't apologize. Don't hedge. Don't read slides verbatim.
Lean on the framings — *headless, multi-layered, zero-copy, generative
AI layer, systems history, release management* — and let the
specifics carry the rest.
