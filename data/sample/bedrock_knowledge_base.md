# Bedrock Service — Operating Knowledge Base

This is the policy and procedure handbook the agent grounds its reasoning in.
Seven sections. Every recommendation the agent makes must cite one of them.

## 1. Fault Code Reference

Critical fault codes and the canonical first-response guidance.

| Code | Title | First response |
|---|---|---|
| **HYD-447** | Hydraulic pressure spike (>4250 psi sustained) | Stop operation. Inspect main pump (P/N HYD-MP-9912) and secondary relief valve (P/N HYD-RV-2204). Replace pump if pressure variance >8% after relief test. Common on HT-797 and D-9000 platforms above 2,000 engine hours. |
| **COOL-220** | Coolant temperature elevated (>118C, 5+ min) | Derate to 50% load. Inspect radiator core (P/N COOL-RC-7700), coolant pump (P/N COOL-PMP-3318), and thermostat. Do NOT continue operation if ambient is above 35C. Frequent on D-9000 in high-altitude / high-load workloads. |
| **ENG-105** | Engine oil pressure low at full load | Stop operation immediately. Inspect oil pump pickup, oil cooler, and oil pressure sensor (P/N ENG-OPS-1180). If oil sample shows metallic content, escalate to Bedrock engineer per Section 5. |
| **VIB-654** | Bearing vibration anomaly (ISO 10816 zone D) | Reduce load, run vibration spectrum capture. Replace affected bearing assembly (P/N varies by platform). On GEN-2000, this is most often the alternator coupling — book Bedrock-certified rebuild. |
| **TRA-308** | Transmission slip on shift 4–5 under load | Run gearbox pressure test. If clutch pack pressure <90% nominal, schedule clutch pack replacement (P/N TRA-CP-450 family). |
| **ELE-091** | Electrical short on auxiliary harness | Isolate harness segment. Inspect connectors at sensor stack J3/J4. Field-repairable in most cases. |
| **BRK-512** | Brake pad wear >70% | Schedule replacement at next service interval. Not safety-critical until >85%. |

Parts numbers above are the canonical Bedrock part identifiers. Dealer
inventories may use cross-reference SKUs.

## 2. Service Contract Entitlements

Service tiers and what they cover.

- **Platinum tier.** 24×7 fault triage. 4-hour technician dispatch SLA on
  Critical faults. Parts shipped expedited at no charge if covered by warranty
  or contract scope. Dedicated Bedrock service manager. Eligible for
  parts-prepositioning at the dealer level for known cohort risks.
- **Gold tier.** 12×6 fault triage. 8-hour technician dispatch SLA. Parts
  ground-shipped at no charge in scope; expedite available at customer cost.
- **Silver tier.** Business-hours triage. 24-hour technician dispatch target
  (best-effort, no SLA). Parts at customer cost unless under warranty.
- **Bronze tier.** Reactive only. No dispatch SLA. Customer self-schedules
  through dealer portal.

If an asset is in **Active warranty** AND the fault code maps to a covered
component, parts and labor are warranty-covered regardless of service tier —
but the warranty claim must be staged within 72 hours of fault detection or
the entitlement decays per Section 5.

## 3. Response SLAs

Response targets are measured **fault-to-technician-on-site**, not
fault-to-acknowledgement.

| Severity | Platinum | Gold | Silver | Bronze |
|---|---|---|---|---|
| Critical | 4 h | 8 h | 24 h target | best effort |
| High | 8 h | 24 h | 48 h target | best effort |
| Medium | 24 h | 48 h | 5 d target | best effort |
| Low | next service interval | next service interval | next service interval | next service interval |

**MTTR is the harder number.** Mean-time-to-repair (fault open → resolution
status closed) tracks separately from response SLA, and depends on parts
availability — see Section 4. Bedrock's stated service goal is fleet-wide MTTR ≤6 h
on Critical faults.

## 4. Parts Logistics

Three sourcing tiers, in order of speed and cost:

1. **Dealer-stocked.** Prepositioned at one of Bedrock's 165 dealer locations.
   Same-day or next-day delivery. Used for high-velocity wear parts and any
   part where the dealer service manager has accepted prepositioning advice.
2. **Regional distribution center.** 8 RDCs in North America, 4 in EMEA, 3 in
   APAC. 24–48h delivery to any dealer. The default source for non-stocked
   parts.
3. **Factory direct from SAP S/4HANA.** Parts not held in any RDC. 5–10 day
   lead time. Always quote the longer end of the window if the customer is
   under SLA pressure — it is better to deliver in 6 days against an 8-day
   commit than to slip a 5-day commit.

**Prepositioning advice.** When a fault code recurs on more than 3 assets in
a dealer territory within 30 days, prepositioning is *recommended* (never
autonomous) to the dealer service manager. Recent recurrence patterns:

- HYD-447 cluster on HT-797 platforms above 2,000 engine hours, multiple
  Western US dealer territories.
- COOL-220 cluster on D-9000 platforms in high-altitude operation.

## 5. Warranty Claim Workflow

Warranty claims are staged in the agent layer and submitted by a service
manager. The agent never submits autonomously — always recommend.

**Standard workflow.**

1. Agent detects fault on an in-warranty asset and confirms the fault code
   maps to a covered component via Section 1.
2. Agent stages a draft claim with the asset ID, fault code, contract ID,
   and an estimated cost (parts + labor at the contract rate).
3. Service manager reviews within 72 hours and submits to WARRANTY-7. After
   72 hours, the entitlement decays — the dealer can still submit but at
   reduced reimbursement.
4. WARRANTY-7 returns a claim number; the agent attaches it to the original
   case for audit.

**Warranty leakage.** Bedrock estimates $180M/year in unrecognized warranty
entitlement, primarily from manual claims processing. Closing this gap is
an explicit goal of the proactive service initiative.

## 6. Strategic Account Profiles

Profiles for the named strategic accounts in the demo dataset.

- **Pinnacle Mining Group (CUST-10001).** Platinum service tier. Multi-site
  operator with HT-797 haul trucks running 24/7 at Bingham Canyon. Service
  contract up for renewal in late 2027 — every fault touch is a renewal
  signal. Sarah Chen (VP Operations) is the executive sponsor; she values
  proactive notification over technical detail. Default communication: brief,
  outcome-first, with the action Bedrock has already taken.
- **Cascade Power Solutions (CUST-10005).** Platinum tier. Generator-heavy
  fleet supporting data center and utility customers. VIB-654 anomalies on
  GEN-2000 platforms have been recurring; Aisha Patel has explicitly asked
  for vibration-spectrum data on every Critical alert.
- **Granite Construction Partners (CUST-10002).** Gold tier. Mixed
  excavator/dozer fleet across Phoenix and Tucson. Marcus Holloway is direct
  about parts cost; quote ranges, not point estimates.
- **Summit Mining & Metals (CUST-10007).** Gold tier, APAC. Time-zone
  matters — anchor SLAs to local time, not Bedrock HQ.

Other accounts use the default service-tier playbook.

## 7. Operating Guardrails

The agent's posture, in order of authority:

1. **Never invent facts.** If a value is not in the resolved context or
   in this knowledge base, omit it. Do not guess customer email addresses,
   contract numbers, or part numbers. If a part number is not in Section 1, say so
   and stage the action without the part field populated.
2. **Never decide trust posture.** The agent recommends actions; the trust
   policy decides which run autonomously, which are staged for human
   approval, and which are routed to a human. The agent does not attempt to
   override that policy.
3. **Cite a knowledge section for every action.** A recommendation without a
   section-citation is treated as ungrounded and held for review.
4. **Cost over apology.** When the cost of a wrong action is high (parts
   ship-out, customer outreach, warranty submission), default to recommend.
   When the cost of a wrong action is low (case open, draft message,
   internal note), default to autonomous.
5. **Stage warranty claims within 72 hours.** Per Section 5, missing the window
   forfeits entitlement. This timer overrides ordinary review cadence — flag
   any in-warranty fault for a service-manager review path the same day.
6. **Never expose engine telemetry verbatim to customers.** Translate it.
   "Hydraulic pressure spike" not "main pump output exceeded 4250 psi for
   47 seconds."