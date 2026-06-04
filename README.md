# Bedrock Heavy Equipment — Proactive Service for Connected Equipment

> *From event to action before the customer knows there is a problem.*

End-to-end agent-layer build for the Salesforce Innovation TA panel, sitting
on top of Bedrock's connected-equipment telemetry. When a critical fault
hits an asset, the agent resolves the customer 360, grounds itself in the
service knowledge base, executes the autonomous actions the **trust matrix**
allows (open the case, stage the warranty claim), and surfaces the rest
(dispatch, parts ship-out, customer comms) as recommendations for a human.

**KPIs targeted:** Mean-time-to-repair on critical faults (11.4 hrs → ≤6 hrs)
and warranty claim cycle time (22 days → ≤7 days).

**Live surface:** ~~https://bedrock-dashboard-sand.vercel.app/triage~~ — *the public alias was removed post-panel. The Vercel project, deployments, and environment variables are preserved; re-alias with `vercel alias set <latest-deployment> bedrock-dashboard-sand.vercel.app` to bring the URL back online.*

---

## Headline framing

The agent layer is **headless** — callable from any surface over REST, not
tied to Lightning, MIAW, Experience Cloud, or a custom web app. The build
demonstrates that property by exercising the *same* agent from three
different consumers:

1. The Lightning Agentforce panel (in-org Service Cloud surface).
2. The Agent Builder Conversation Preview (developer/test surface).
3. A Vite/React SPA on Vercel that invokes the public Agentforce Agent API
   directly — no Salesforce dependency on the client side.

The architecture itself is **multi-layered** — Data Cloud zero-copy
federation where data has gravity (recommended), headless REST APIs
where the GenAI layer needs to be reachable (built), MCPs as the future
tool-composition vector (recommended), Apex / Flow where the trust gate
has to live (built).

The full panel argument lives in [docs/architecture.md](docs/architecture.md).

---

## What's in this repo

### 1. Salesforce-native build (the primary artifact)

| Component | Where |
|---|---|
| 7 custom objects + 59 fields | [force-app/main/default/objects/](force-app/main/default/objects/) |
| 4 Apex `@InvocableMethod` action classes | [force-app/main/default/classes/](force-app/main/default/classes/) — `BedrockAssetContext`, `BedrockKnowledge`, `BedrockOpenCase`, `BedrockStageWarranty` |
| Two Agentforce agents | [force-app/main/default/aiAuthoringBundles/](force-app/main/default/aiAuthoringBundles/) — `Bedrock_Service_Triage` (`AgentforceEmployeeAgent`) + `Bedrock_Customer_Service` (`AgentforceServiceAgent`). Same Agent Script, same KB grounding, same trust matrix; agent type declares which surfaces the runtime exposes them on. |
| Permission set | [force-app/main/default/permissionsets/Bedrock_Demo_Admin.permissionset-meta.xml](force-app/main/default/permissionsets/Bedrock_Demo_Admin.permissionset-meta.xml) |
| Connected App (OAuth Client Credentials + JWT issuance) | [force-app/main/default/connectedApps/Bedrock_Dashboard_OAuth.connectedApp-meta.xml](force-app/main/default/connectedApps/Bedrock_Dashboard_OAuth.connectedApp-meta.xml) |
| KB content (7 sections — fault codes, SLAs, warranty workflow, etc.) | [force-app/main/default/data/upsert/kb_sections.csv](force-app/main/default/data/upsert/kb_sections.csv) |

### 2. Headless agent layer — Vite/React SPA on Vercel

[force-app/main/default/uiBundles/BedrockDashboard/](force-app/main/default/uiBundles/BedrockDashboard/)

Reads records via Salesforce REST. Invokes the `Bedrock_Customer_Service`
agent via the public Agentforce Agent API at
`api.salesforce.com/einstein/ai-agent/v1`. Authenticated via OAuth
Client Credentials + JWT-issued access tokens minted server-side
([api/_sf-client.ts](force-app/main/default/uiBundles/BedrockDashboard/api/_sf-client.ts)).
Detail dialogs in-app, trust-color cues throughout, polling-based "new
row" pulse with CreatedDate recency.

### 3. Off-platform reference design — Streamlit + Claude API

[app/streamlit_app.py](app/streamlit_app.py) + [src/](src/)

Same six-step pattern (event → resolved context → KB-grounded reasoning
→ action library → trust gate → outcome), Claude API instead of Agentforce,
TF-IDF retrieval instead of Vector DB. Answers the panel's *"what would
you build outside Salesforce?"* without having to imagine it.

---

## Architecture at a glance

| Integration layer | Purpose | Status in this build |
|---|---|---|
| **Data Cloud zero-copy federation** | 2.4 PB telemetry in Snowflake; SAP parts; WARRANTY-7 mainframe | **Recommended** — lead in [docs/architecture.md Section 4](docs/architecture.md#4-federation-vs-ingestion--the-trade-off) |
| **Headless REST APIs (Salesforce REST + Agentforce Agent API)** | Decouple the agent layer from any UI surface; reads + writes from any consumer | **Built and live** — see Vercel app above |
| **MCPs (Model Context Protocol)** | Standardized agent-to-tool wiring; pluggable third-party tools | **Recommended** — extension path |
| **Apex / Flow (on-platform)** | Trust gate enforcement, action execution, audit | **Built** — four `@InvocableMethod` classes |

The trust matrix sits in Apex regardless of which surface invokes the
agent — that's the load-bearing architectural argument. Full version
in [docs/architecture.md Section 5](docs/architecture.md#5-trust-posture-rationale).

---

## Quick start

### Salesforce build

Pre-reqs: Salesforce CLI (`sf`), a Developer Edition org or sandbox with
Agentforce + Einstein Bots enabled, Digital Experiences + UI Bundle Beta
toggled on.

```powershell
sf org login web --alias SForg
sf project deploy start --source-dir force-app/main/default --target-org SForg
sf data tree import --plan data/sample/import-plan.json --target-org SForg
```

To deploy the UI bundle to a digital-experience site, see
[force-app/main/default/uiBundles/BedrockDashboard/README.md](force-app/main/default/uiBundles/BedrockDashboard/README.md).

### Vercel dashboard

```powershell
cd force-app\main\default\uiBundles\BedrockDashboard
npm install
npm run build
npx vercel --prod
```

Required Vercel environment variables (set in the project settings):

| Var | Purpose |
|---|---|
| `SF_INSTANCE_URL` | Org's My Domain URL (e.g., `https://orgfarm-xxxx.develop.my.salesforce.com`) |
| `SF_CLIENT_ID` | Connected App consumer key |
| `SF_CLIENT_SECRET` | Connected App consumer secret |
| `AGENT_ID` | Bot Id for `Bedrock_Service_Triage` (currently unused — Employee Agent invoked via Lightning panel only) |
| `AGENT_ID_CUSTOMER` | Bot Id for `Bedrock_Customer_Service` (the one the chat invokes) |

Find Bot Ids with [tools/find_agent_ids.apex](tools/find_agent_ids.apex):

```powershell
sf apex run --target-org SForg --file tools/find_agent_ids.apex
```

Connected App needs Client Credentials Flow enabled, "Issue JWT-based
access tokens" checked, and a **Run As** user with the *Salesforce
Integration* license (standard admin users won't work — see
[docs/architecture.md Section 6](docs/architecture.md#6-off-platform-consumer-surface--the-headless-agent-layer)
for the full chain).

### Streamlit reference design

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:ANTHROPIC_API_KEY = "sk-ant-..."
streamlit run app/streamlit_app.py
```

The four CSVs in `data/sample/` and the KB markdown are pre-committed;
the demo runs from a fresh clone with no data steps. Regenerate with
`python data/sample/_seed.py` (deterministic, seed=42).

---

## Docs

| Doc | What it is |
|---|---|
| [docs/architecture.md](docs/architecture.md) | The panel's reading companion — 8 sections covering the pattern, the Salesforce translation table, federation-vs-ingestion, trust posture rationale, the headless agent layer, what's out of scope, and what AI wrote vs I wrote |
| [docs/deck-outline.md](docs/deck-outline.md) | 12-slide deck structure with time budgets, demo path, and backup paths if anything breaks live |
| [docs/demo-script.md](docs/demo-script.md) | Cheat-sheet for the live demo — utterances to paste, assets to use, what to point at in the trace, fallback recovery |
| [docs/talking-points.md](docs/talking-points.md) | Verbatim natural-tone narration per slide, iterable, with Marcus's framings (headless / multi-layered / zero-copy / GenAI layer) woven in |

---

## Project layout

```
bedrock-panel-demo/
├── app/                         # Streamlit reference UI
├── src/                         # Streamlit support — data loader, agent, actions, trust policy
├── data/sample/                 # Pre-seeded CSVs + KB markdown (deterministic, seed=42)
├── docs/                        # Panel-facing docs (architecture, deck, demo script, talking points)
├── force-app/main/default/      # Salesforce metadata
│   ├── aiAuthoringBundles/      # Both Agentforce agents (.agent files)
│   ├── bots/                    # BotVersion config (employee agent only — service generated on deploy)
│   ├── classes/                 # 4 Apex action classes
│   ├── connectedApps/           # Bedrock_Dashboard_OAuth
│   ├── data/upsert/             # KB CSV
│   ├── genAiPlannerBundles/     # Planner topology
│   ├── objects/                 # 7 custom objects + fields
│   ├── permissionsets/          # Bedrock_Demo_Admin
│   └── uiBundles/BedrockDashboard/  # The Vercel SPA — Vite/React/Tailwind/shadcn
│       ├── api/                 # Serverless functions (token mint, SOQL, agent session/message)
│       └── src/                 # React app — Triage Console, Architecture page, etc.
├── tools/                       # Helper scripts (find_agent_ids, agent_chat.py, etc.)
└── tests/                       # Smoke tests for the Streamlit pieces
```

---

## Demo customer

**Pinnacle Mining Group** (`CUST-10001`) — multiple connected assets, an
active Critical HYD-447 hydraulic fault on `ASSET-50101`, Platinum service
tier with active warranty. The headline utterance triages this:

> *We have a Critical HYD-447 hydraulic fault on ASSET-50101. Please triage
> and recommend next steps.*

For the trust-boundary variant (Granite Construction, Gold tier, **warranty
expired**), use `ASSET-50203`:

> *Critical HYD-447 fault on ASSET-50203. What should we do?*

Watch the trace — `stage_warranty_claim` does *not* fire because the
trust matrix gates on real data, not theater.

---

## Status

Built for the Innovation TA panel (May 2026). Repo is currently private
during panel prep; archival public release possible afterward.

The build was scaffolded with Claude Code (Claude Opus 4.7); architectural
choices, trust matrix, and the federation-vs-ingestion position are
hand-defended. See *How I used AI* in [docs/deck-outline.md](docs/deck-outline.md)
Slide 10 for the disclosure breakdown.
