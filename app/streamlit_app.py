"""
Bedrock Proactive Service — demo UI.

This is the panel's window into the build. Everything visible here is
intentional: the resolved 360, the calculated KPIs, the retrieved KB
citations, the agent's recommendation, and the trust posture per action.

Tab structure:
  1. Fault inbox — pick the event to drive the demo (simulates a webhook)
  2. Context — the resolved 360 + calculated KPIs
  3. Reasoning — the agent's recommendation, with KB citations
  4. Actions — the structured artifacts, gated by trust posture
  5. Salesforce translation — the intertwine narrative
"""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import data_loader, identity, knowledge, value_calc, agent, actions, trust_policy
from src.salesforce_mapping import ARCHITECTURE_NARRATIVE


st.set_page_config(page_title="Bedrock Proactive Service", layout="wide")
st.title("Bedrock Proactive Service — TA Panel Demo")
st.caption("Event → Resolved Context → Reasoning → Action → Outcome")


@st.cache_resource
def boot():
    return data_loader.load(), knowledge.KnowledgeBase.load()


data, kb = boot()

# ── Sidebar: pick the fault event ────────────────────────────────────
st.sidebar.header("Fault inbox (simulated webhook)")
critical_open = data.telemetry[
    (data.telemetry["severity"] == "Critical")
    & (data.telemetry["resolution_status"] == "Open")
].sort_values("timestamp", ascending=False)

if critical_open.empty:
    st.sidebar.warning("No open critical faults in the data.")
    st.stop()

event_labels = [
    f"{row.timestamp:%Y-%m-%d %H:%M} · {row.fault_code} · {row.asset_id}"
    for row in critical_open.itertuples()
]
selected = st.sidebar.radio("Pick an event to triage:", event_labels, index=0)
event = critical_open.iloc[event_labels.index(selected)].to_dict()

st.sidebar.markdown("---")
st.sidebar.markdown(f"**Asset:** `{event['asset_id']}`")
st.sidebar.markdown(f"**Fault code:** `{event['fault_code']}`")
st.sidebar.markdown(f"**Severity:** {event['severity']}")

# ── Resolve context ──────────────────────────────────────────────────
asset_360 = data.asset_360(event["asset_id"])
customer_id = asset_360["customer"]["customer_id"]

# ── Tabs ────────────────────────────────────────────────────────────
tab_ctx, tab_reason, tab_actions, tab_sf = st.tabs(
    ["Resolved 360", "Reasoning", "Actions", "Salesforce translation"]
)

with tab_ctx:
    col1, col2 = st.columns([2, 1])
    with col1:
        st.subheader(f"{asset_360['customer']['account_name']} · {event['asset_id']}")
        st.json(asset_360, expanded=False)
    with col2:
        st.subheader("Calculated facts")
        open_faults = value_calc.open_critical_faults_30d(data, customer_id)
        st.metric("Open critical faults (30d)", len(open_faults))
        st.metric("ARR at risk (USD)", f"${value_calc.arr_at_risk(data, customer_id):,.0f}")
        st.metric("Fleet MTTR (hrs)", f"{value_calc.fleet_mttr_hours(data):.1f}")
        warranty = value_calc.warranty_exposure(data)
        st.metric("Assets in warranty w/ open faults", warranty["count"])

with tab_reason:
    st.subheader("Agent reasoning")
    if "decision" not in st.session_state or st.session_state.get("decision_event") != event["asset_id"] + event["fault_code"]:
        if st.button("Run agent", type="primary"):
            with st.spinner("Reasoning..."):
                kpi_facts = {
                    "open_critical_faults_30d_for_customer": int(len(value_calc.open_critical_faults_30d(data, customer_id))),
                    "arr_at_risk_usd": value_calc.arr_at_risk(data, customer_id),
                    "warranty_exposure": value_calc.warranty_exposure(data),
                }
                query = f"{event['fault_code']} {event['severity']} {asset_360['customer'].get('service_tier', '')}"
                retrieved = kb.retrieve(query, k=3)
                decision = agent.reason(asset_360, kpi_facts, retrieved)
                st.session_state["decision"] = decision
                st.session_state["decision_event"] = event["asset_id"] + event["fault_code"]
                st.session_state["retrieved"] = retrieved
                st.rerun()
    else:
        decision = st.session_state["decision"]
        retrieved = st.session_state["retrieved"]
        st.success(decision.summary)
        st.markdown("**Knowledge cited:**")
        for c in decision.kb_citations:
            st.markdown(f"- {c}")
        with st.expander("Retrieved knowledge sections (full text)"):
            for s in retrieved:
                st.markdown(f"### {s.title}")
                st.markdown(s.body)

with tab_actions:
    st.subheader("Recommended actions")
    decision = st.session_state.get("decision")
    if decision is None:
        st.info("Run the agent on the Reasoning tab first.")
    else:
        for i, action_spec in enumerate(decision.recommended_actions):
            name = action_spec.get("name", "")
            posture = trust_policy.posture_for(name)
            badge = {
                trust_policy.TrustPosture.AUTONOMOUS: "🟢 Autonomous",
                trust_policy.TrustPosture.RECOMMEND: "🟡 Recommend",
                trust_policy.TrustPosture.HUMAN_REQUIRED: "🔴 Human required",
            }[posture]
            with st.container(border=True):
                st.markdown(f"**{i+1}. {name}** — {badge}")
                st.markdown(f"_{action_spec.get('rationale', '')}_")
                st.json(action_spec.get("arguments", {}), expanded=False)
                if posture == trust_policy.TrustPosture.AUTONOMOUS:
                    if st.button(f"Execute {name}", key=f"exec_{i}"):
                        fn = actions.ACTIONS.get(name)
                        if fn:
                            try:
                                result = fn(**action_spec.get("arguments", {}))
                                st.success("Executed (simulated). Artifact:")
                                st.json(result)
                            except TypeError as e:
                                st.error(f"Argument mismatch: {e}")
                        else:
                            st.error(f"Unknown action: {name}")
                elif posture == trust_policy.TrustPosture.RECOMMEND:
                    st.warning("Stage for human approval.")
                else:
                    st.error("Routed to human approver.")

with tab_sf:
    st.markdown(ARCHITECTURE_NARRATIVE)
