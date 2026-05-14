"""
The Salesforce intertwine narrative — rendered in the UI panel so the demo
itself shows the translation. The briefing weights "Salesforce capability
mapping is reasoned and defensible" heavily; making it visible in the UI
prevents the panel from having to imagine it.
"""

ARCHITECTURE_NARRATIVE = """
### Where this would live in Salesforce

| Layer | This demo | Salesforce realization |
|---|---|---|
| **Telemetry stream** | CSV of fault events | Bedrock Connect (AWS Kinesis) → **Data Cloud zero-copy / federation** to Snowflake. 2.4 PB stays put — federated, not ingested. |
| **Reference data** | customers, contracts | **Data Cloud DLO → DMO**, plus identity resolution rules on `customer_id ↔ asset_id ↔ serial_number`. Small enough to ingest; volatile join keys. |
| **Legacy systems** | (out of scope) | **MuleSoft Anypoint** API-led layer to SAP S/4HANA (parts), ServiceMax (mid-migration), WARRANTY-7 (mainframe). |
| **Knowledge base** | PDF / MD via TF-IDF | **Data Cloud Vector Database** + retriever, exposed to Agentforce as a grounded data source. |
| **Reasoning** | Claude Opus 4.7 | **Agentforce + Atlas Reasoning Engine**. Topics for sub-flows; Standard + Custom Actions. |
| **Action: open case** | dict payload | **Apex / Flow action** → Service Cloud Case. |
| **Action: dispatch tech** | dict payload | **Field Service Work Order** + Resource Optimization. |
| **Action: parts** | dict payload | **MuleSoft → SAP S/4HANA** parts order. |
| **Action: customer comms** | drafted text | **Marketing Cloud Engagement** journey trigger. |
| **Action: warranty claim** | staged dict | **MuleSoft → WARRANTY-7**, staged for service manager review. |
| **Dealer surface** | Streamlit | **Experience Cloud** (LWR) + embedded LWC in Service Console. |
| **Audit / governance** | Streamlit timeline | **Salesforce Data Cloud Audit Trail** + Agentforce session traces. |

### Federation vs ingestion — the trade-off I took

- **Federate**: telemetry (2.4 PB, freshness matters more than copy cost),
  SAP parts inventory (transactional), WARRANTY-7 (legacy, can't bulk extract).
- **Ingest into Data Cloud**: customers, contracts, warranty status — small,
  used as join keys and policy gates, the cost of staleness is a wrong agent
  decision.
- **Salesforce Connect (External Objects via OData)** is a third option for the
  reference data; I'd reach for it if the customer wasn't already on Snowflake
  and didn't need agent grounding on this data.

### Trust posture rationale

- **Autonomous** — read-only joins, draft artifacts, low-blast-radius writes
  (case open).
- **Recommended** — anything with cost (parts, technician), customer
  relationship impact (outbound message), or financial commitment (warranty
  submission).
- **Human-required** — escalation to engineering (signal noise risk) and
  warranty payout approval (financial control).
"""
