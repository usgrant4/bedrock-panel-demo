# Bedrock Proactive Service — TA Panel Demo

End-to-end demo for the Innovation TA panel. Built outside Salesforce so the
architectural translation to the Salesforce capability landscape is the
**conversation**, not the build cost.

**Scenario:** Bedrock Heavy Equipment — Proactive Service for Connected Equipment.
**KPIs targeted:** Mean-time-to-repair on critical faults (11.4 hrs → ≤6 hrs)
and Warranty claim cycle time (22 days → ≤7 days).

## What this demo does

When a critical fault hits a connected asset, the system:

1. **Receives** the fault event (mock webhook simulator in the UI).
2. **Resolves** the asset → customer → contract → warranty → recent telemetry
   in one unified context.
3. **Reasons** over the situation against the Bedrock service knowledge base
   (entitlements, SLAs, parts logistics, warranty workflow, guardrails).
4. **Recommends** a next-best action with explicit trust posture
   (autonomous · recommended · human-required).
5. **Stages** the artifact: a draft customer message, a pre-populated warranty
   claim, a case payload, a parts pre-position recommendation.
6. **Captures** the outcome on a timeline so the panel can trace event →
   context → reasoning → action.

## Setup

```powershell
cd c:\Users\ulyss\Repos\bedrock-panel-demo
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:ANTHROPIC_API_KEY = "sk-ant-..."  # set your Claude API key
streamlit run app/streamlit_app.py
```

The four CSVs in `data/sample/` and the knowledge-base markdown are already
committed — the demo runs from a fresh clone without further data steps. If
you ever want to regenerate (e.g., to tweak the demo signal), run
`python data/sample/_seed.py`. The generator is deterministic (seed 42), so
the numbers don't drift between runs.

## Project layout

```
bedrock-panel-demo/
├── app/streamlit_app.py        # the UI — this is the demo
├── src/
│   ├── data_loader.py          # CSV → pandas joins
│   ├── identity.py             # asset → customer resolution
│   ├── knowledge.py            # KB chunking + retrieval (TF-IDF)
│   ├── value_calc.py           # KPI calculations grounded in the data
│   ├── agent.py                # the reasoning step (Claude API)
│   ├── actions.py              # action library + structured outputs
│   ├── trust_policy.py         # autonomous · recommend · human-required
│   └── salesforce_mapping.py   # narrative for the UI's "Salesforce translation" panel
├── data/
│   ├── sample/                 # plausible sample data; demo runs out of the box
│   │   ├── _seed.py            # deterministic regenerator (seed=42)
│   │   ├── customers.csv assets.csv telemetry_events.csv service_contracts.csv
│   │   └── bedrock_knowledge_base.md
│   └── README.md               # drop the real briefing CSVs + PDF here
├── docs/
│   ├── architecture.md         # the diagram + Salesforce intertwine narrative
│   └── deck-outline.md         # 12-slide deck, panel-tuned, with timing table
└── tests/test_smoke.py
```

## Where to spend your build hours

The scaffold deliberately leaves **architectural choices to you**:

| Module | What's done | What you write |
|---|---|---|
| `data_loader` | Schema + joins | Tweaks if your CSV headers differ |
| `identity` | Deterministic resolution | The fuzzy/ML path if you want one |
| `knowledge` | PDF/MD extraction + TF-IDF | Embedding-based RAG if you upgrade |
| `agent` | Claude API call + prompt skeleton | The actual prompt + structured output |
| `actions` | Function signatures + JSON shapes | Action selection logic |
| `trust_policy` | Enum + decision matrix | Tune the policy per action |
| `value_calc` | Open critical faults / 30d, ARR-at-risk | Add what your demo needs |
| Streamlit UI | Working shell + tabs | The "lean forward" inventive surface |

## Demo customer

**Pinnacle Mining Group** (CUST-10001) — multiple connected assets, an active
critical fault, a recent service contract up for renewal. The briefing names
this as a good demo pick.
