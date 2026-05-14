# Demo cheat sheet — Bedrock Service Triage

Keep this file open in a second window during the demo. Every utterance
below is panel-tested and produces a known response. Copy-paste; don't retype.

---

## Setup checklist (do BEFORE you start sharing screen)

- [ ] **Lightning Experience open** in a Service or Sales app, **Agentforce panel pinned open** on the right (pin icon, top-right of panel). Agent selector showing **"Bedrock Service Triage"**. This is your PRIMARY demo surface.
- [ ] Second Salesforce tab: **App Launcher → Bedrock Service Cases → All view**
- [ ] Third Salesforce tab: **App Launcher → Bedrock Warranty Claims → All view**
- [ ] Fourth tab: **Vercel dashboard** at `https://bedrock-dashboard-sand.vercel.app/triage` — Triage Console with the live records rail. Open it 30+ seconds before the demo so the first poll completes and `firstLoadRef` flips; that way the NEW pulse fires only on records created during the demo, not on the initial load.
- [ ] [docs/architecture.md](architecture.md) open at the federation/ingestion table (§4) for the close, with §6 (off-platform consumer surface) bookmarked if the panel asks how the dashboard fits the architecture
- [ ] Streamlit demo running on `http://localhost:8501` as backup (`streamlit run app/streamlit_app.py`)
- [ ] Agent Builder Conversation Preview open in a separate tab as a secondary backup (shows richer trace if panel asks)
- [ ] Browser zoom at ~125% so the panel can read text

**Why Lightning over Agent Builder:** The Lightning Agentforce panel IS the production surface — what an actual dealer service rep would use. Agent Builder Conversation Preview is a developer tool. Lightning also renders the agent's recommendations as a structured card at the bottom of the conversation, which Agent Builder does not.

---

## PRIMARY DEMO PATH (run in this order)

### 1. Happy path — Pinnacle Mining, in-warranty (the headline)

Fresh conversation. Paste:

```
We have a Critical HYD-447 hydraulic fault on ASSET-50101. Please triage and recommend next steps.
```

**Look for in the trace:** 5 tools fire — `capture_fault_details`, `get_asset_context`, `retrieve_knowledge`, `open_service_case`, `stage_warranty_claim`.

**Anchors to point at in the response:**
- Part numbers `HYD-MP-9912` and `HYD-RV-2204` (KB §1)
- *"Replace the main pump if pressure variance exceeds 8% after relief test"* (KB §1)
- *"Critical | Platinum | 4 h"* (KB §3, exact grid notation)
- *"Open Critical faults in last 30 days: 3"* and *"ARR at risk: $1,020,000.00"* — the briefing's value calculation
- Case `BSV-*` and Claim `BWC-*` numbers — switch tabs to Lightning to show the records

### 2. Trust-boundary variant — out-of-warranty asset (the "lean forward" moment)

Fresh conversation. Paste:

```
Critical HYD-447 fault on ASSET-50203. What should we do?
```

**Look for in the trace:** Only 4 tools — `stage_warranty_claim` should be ABSENT.

**Anchors:**
- Granite Construction Partners, Gold tier, **warranty expired**
- SLA quoted shifts to **8 hours** (Gold), not 4 hours
- Response should explicitly say no warranty claim will be staged
- Verify Bedrock Warranty Claims tab — no new row

This is the panel's *"how do you know your trust matrix isn't theatre?"* answer.

---

## BACKUP / Q&A UTTERANCES (use only if asked)

If the panel pushes on specific behaviors, these probe each one cleanly.

### "Show me the agent refuses to invent facts"
Fresh conversation. Paste:
```
We have a Critical HYD-447 on ASSET-50101. What part numbers do we need to inspect or replace?
```
Returns `HYD-MP-9912`, `HYD-RV-2204` from KB §1 — and only those.

### "What happens when the data isn't there?"
Fresh conversation. Paste:
```
Critical HYD-447 on ASSET-99999. What should we do?
```
Agent says asset not found, refuses to proceed, asks you to confirm the id. No fake records created.

### "How does it handle non-critical events?"
Fresh conversation. Paste:
```
Medium-severity BRK-512 brake wear alert on ASSET-50801.
```
Agent quotes Silver Medium SLA *"5 d target"* verbatim from KB §3, recommends scheduling at next interval, no warranty claim.

### "Does it remember context across turns?"
After ANY fault triage (don't start a fresh conversation). Paste:
```
What's the contract status on this asset?
```
Agent answers from already-resolved context without re-running `get_asset_context`.

### "What if a user pushes past your trust boundary?"
Fresh conversation. Paste:
```
We have a Critical HYD-447 on ASSET-50101. Go ahead and dispatch a technician and ship the replacement pump immediately.
```
Agent stays in recommend mode for dispatch + parts shipment despite the direct command — proves the trust matrix isn't suggestive.

### "What if a user goes off-script?"
Fresh conversation. Paste:
```
What is the weather like at the mine site today?
```
Agent routes to off-topic subagent, redirects without revealing internals.

---

## Quick reference — assets and what they prove

| Asset id | Customer | Tier | Warranty | Use this when... |
|---|---|---|---|---|
| ASSET-50101 | Pinnacle Mining | Platinum | **Active** | Headline demo (Test 1) |
| ASSET-50105 | Pinnacle Mining | Platinum | Active | Variant if 50101 has issues — has open COOL-220 |
| ASSET-50203 | Granite Construction | Gold | **Expired** | Out-of-warranty trust gate (Test 2) |
| ASSET-50403 | Northbridge Quarry | Silver | Expired (contract too) | Demo of dual-expired edge case |
| ASSET-50801 | Riverbend Construction | Silver | Expired | Non-critical severity demo |
| ASSET-99999 | (n/a) | — | — | Missing data fail-safe |

## Quick reference — fault codes in KB §1

| Code | Severity | Parts named in KB §1 |
|---|---|---|
| HYD-447 | Critical | HYD-MP-9912, HYD-RV-2204 |
| COOL-220 | Critical | COOL-RC-7700, COOL-PMP-3318 |
| ENG-105 | Critical | ENG-OPS-1180 |
| VIB-654 | Critical | varies by platform |
| TRA-308 | High | TRA-CP-450 family |
| BRK-512 | Medium | (no replacement parts named) |

## Quick reference — SLA grid from KB §3

| Severity | Platinum | Gold | Silver | Bronze |
|---|---|---|---|---|
| Critical | 4 h | 8 h | 24 h target | best effort |
| High | 8 h | 24 h | 48 h target | best effort |
| Medium | 24 h | 48 h | 5 d target | best effort |
| Low | next service interval | next service interval | next service interval | next service interval |

---

## If something breaks live

1. **Agent Builder hangs or returns an error.** Switch to the CLI wrapper:
   ```
   python tools/agent_chat.py --start
   python tools/agent_chat.py <session-id> "Triage ASSET-50101 HYD-447"
   ```
   Same agent, same actions, faster.

2. **Apex action fails or returns null.** Switch tabs to the Streamlit demo
   (`http://localhost:8501`). Same architecture pattern off-platform.

3. **Vercel dashboard fails to render or polls hang.** Skip step 9 of the
   demo path; switch directly to the Lightning record tabs (BSV-*/BWC-*).
   The records are still in Salesforce — the dashboard is only a read
   surface, and the architecture story (§6) holds without the live widget.
   Open `https://vercel.com/ugrantiv-6508s-projects/bedrock-dashboard` if
   you want to glance at deployment logs, but don't do it on screen.

4. **Browser/network issue.** Open [docs/architecture.md](architecture.md)
   and walk the diagram out loud. The architecture story stands on its own.

5. **Panel asks for something we haven't tested.** Default response:
   *"That edge case is out of scope for this build; here's how I'd extend
   the agent to handle it..."* — then walk the design out loud, citing the
   trust matrix or the KB rules.

---

## The two questions to ask the panel at the end

Pick one (the briefing rewards asking *a* question, not picking the perfect one):

> *"For multi-cloud customers like Bedrock with Snowflake as gravity, where
> do you see Data Cloud federation losing to Snowflake-native AI workloads
> today, and how does that shape your guidance to customers?"*

> *"What do candidates for this role most often underweight when they map
> a build like this to Salesforce?"*
