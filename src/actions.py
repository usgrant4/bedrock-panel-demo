"""
Action library — the things the agent can recommend or do.

Every action returns a structured dict so the UI can render it deterministically
and the panel can see the artifact (case payload, draft message, staged claim).
This is the "structured output" the briefing rewards.

In Salesforce, each of these maps to:
- open_service_case        → Apex/Flow → Service Cloud Case
- dispatch_technician      → Field Service Work Order + Resource assignment
- ship_part / preposition  → MuleSoft → SAP S/4HANA parts request
- send_customer_message    → Marketing Cloud journey trigger
- stage_warranty_claim     → MuleSoft → WARRANTY-7 mainframe (staged, not submitted)
- escalate_to_engineer     → Slack channel post + Service Cloud Case escalation
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class StructuredAction:
    name: str
    payload: dict[str, Any]
    posture: str
    rationale: str
    salesforce_target: str
    created_at: datetime = field(default_factory=datetime.utcnow)


def open_service_case(asset_id: str, customer_id: str, fault_code: str, severity: str, description: str) -> dict:
    return {
        "Subject": f"[{severity}] {fault_code} — Asset {asset_id}",
        "Description": description,
        "Type": "Mechanical" if severity == "Critical" else "Inspection",
        "Status": "New",
        "Priority": "High" if severity == "Critical" else "Medium",
        "Origin": "Agentforce",
        "AccountId": customer_id,
        "AssetId": asset_id,
    }


def dispatch_technician(asset_id: str, location: str, parts_required: list[str], eta_hours: float) -> dict:
    return {
        "WorkOrder.Subject": f"Dispatch — Asset {asset_id}",
        "WorkOrder.AssetId": asset_id,
        "WorkOrder.Location": location,
        "WorkOrder.PartsRequired": parts_required,
        "WorkOrder.EstimatedDuration": eta_hours,
        "WorkOrder.Priority": "High",
    }


def ship_part(part_number: str, ship_to: str, quantity: int, expedite: bool) -> dict:
    return {
        "PartNumber": part_number,
        "ShipTo": ship_to,
        "Quantity": quantity,
        "Expedite": expedite,
        "SourceSystem": "SAP S/4HANA",
    }


def preposition_parts_to_dealer(dealer_id: str, parts: list[dict]) -> dict:
    return {
        "DealerId": dealer_id,
        "Parts": parts,
        "Reason": "Cohort fault pattern detected; prepositioning to reduce MTTR.",
    }


def draft_customer_message(customer_name: str, asset_id: str, fault_summary: str, action_summary: str) -> dict:
    body = (
        f"Hi {customer_name} team,\n\n"
        f"Our connected-asset monitoring detected an issue on {asset_id}: {fault_summary}.\n\n"
        f"We've already taken the following steps: {action_summary}.\n\n"
        f"A technician will be in touch shortly. No action is needed on your side.\n\n"
        f"— Bedrock Service"
    )
    return {
        "Channel": "Email",
        "To": f"primary_contact@{customer_name.lower().replace(' ', '')}.com",
        "Subject": f"Proactive service notice — {asset_id}",
        "Body": body,
    }


def stage_warranty_claim(asset_id: str, fault_code: str, contract_id: str, estimated_cost_usd: float) -> dict:
    return {
        "ClaimSystem": "WARRANTY-7",
        "AssetId": asset_id,
        "FaultCode": fault_code,
        "ContractId": contract_id,
        "EstimatedCostUSD": estimated_cost_usd,
        "Status": "Staged",
        "Note": "Agent-prepared. Requires service manager review before submission.",
    }


def escalate_to_bedrock_engineer(asset_id: str, fault_code: str, evidence_summary: str) -> dict:
    return {
        "Channel": "#bedrock-engineering",
        "AssetId": asset_id,
        "FaultCode": fault_code,
        "EvidenceSummary": evidence_summary,
    }


# Map action name → callable. Used by the agent to dispatch.
ACTIONS = {
    "open_service_case": open_service_case,
    "dispatch_technician": dispatch_technician,
    "ship_part": ship_part,
    "preposition_parts_to_dealer": preposition_parts_to_dealer,
    "draft_customer_message": draft_customer_message,
    "stage_warranty_claim": stage_warranty_claim,
    "escalate_to_bedrock_engineer": escalate_to_bedrock_engineer,
}
