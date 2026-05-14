"""
Trust posture for each action. The briefing grades on this explicitly:
"What it can do autonomously / what it should only recommend / what should
route to a human / where guardrails, approvals, or audit trails are required."

The policy here is opinionated — defend it in the panel.
"""

from __future__ import annotations

from enum import Enum


class TrustPosture(str, Enum):
    AUTONOMOUS = "autonomous"
    RECOMMEND = "recommend"
    HUMAN_REQUIRED = "human_required"


# Action → posture matrix. Tune in the build; defend each row in the panel.
POLICY: dict[str, TrustPosture] = {
    # Read-only, reversible. Agent runs without asking.
    "fetch_asset_360": TrustPosture.AUTONOMOUS,
    "calculate_arr_at_risk": TrustPosture.AUTONOMOUS,
    "retrieve_knowledge": TrustPosture.AUTONOMOUS,
    "draft_customer_message": TrustPosture.AUTONOMOUS,  # drafted only, not sent
    "stage_warranty_claim": TrustPosture.AUTONOMOUS,    # populated only, not submitted
    # Writes to a system but cheaply reversible / low blast radius.
    "open_service_case": TrustPosture.AUTONOMOUS,
    # Cost or relationship implications. Agent recommends; human approves.
    "dispatch_technician": TrustPosture.RECOMMEND,
    "ship_part": TrustPosture.RECOMMEND,
    "preposition_parts_to_dealer": TrustPosture.RECOMMEND,
    "send_customer_message": TrustPosture.RECOMMEND,
    "submit_warranty_claim": TrustPosture.RECOMMEND,
    # High-impact or financial commitment. Always a human.
    "approve_warranty_payout": TrustPosture.HUMAN_REQUIRED,
    "escalate_to_bedrock_engineer": TrustPosture.HUMAN_REQUIRED,
}


def posture_for(action_name: str) -> TrustPosture:
    if action_name not in POLICY:
        # Unknown actions are gated by default — fail safe.
        return TrustPosture.HUMAN_REQUIRED
    return POLICY[action_name]
