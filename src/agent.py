"""
The reasoning step. Calls Claude with a structured prompt that:

1. Receives the resolved context (asset 360, calculated KPIs)
2. Has access to retrieved KB sections (grounded, not hallucinated)
3. Produces a structured recommendation: which actions, with what arguments,
   in what order, with what rationale
4. The trust policy gates execution — the agent does not get to escalate
   itself.

This is intentionally a thin scaffold. Tighten the prompt, the structured
output schema, and the action-selection rules during your build hours.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

from anthropic import Anthropic

from .knowledge import KnowledgeSection

MODEL = "claude-opus-4-7"  # the latest Opus 4.7; swap for sonnet-4-6 to tune cost/latency


SYSTEM_PROMPT = """You are the reasoning engine for Bedrock's Proactive Service agent.

Your job: given a critical fault event and the resolved customer/asset/contract
context, recommend a sequenced set of actions that will minimize mean-time-to-repair
and capture any warranty entitlement before it leaks.

Hard rules:
- NEVER invent facts. If a fact is not in the context or knowledge sections, omit it.
- Ground every recommendation in a specific knowledge section by citing its title.
- Do NOT decide whether actions execute autonomously or require human approval —
  that is determined by an external trust policy. Just recommend the right action
  and rationale.
- Be specific. If you recommend dispatching a technician, propose an ETA based on
  contract SLA. If you recommend shipping a part, name the part number from the
  fault code reference.

Output strictly valid JSON matching the schema in the user message."""


OUTPUT_SCHEMA = """{
  "summary": "One-sentence summary of the situation.",
  "kb_citations": ["Section title 1", "Section title 2"],
  "recommended_actions": [
    {
      "name": "open_service_case | dispatch_technician | ship_part | preposition_parts_to_dealer | draft_customer_message | stage_warranty_claim | escalate_to_bedrock_engineer",
      "arguments": { "...action-specific keys..." },
      "rationale": "Why this action, citing KB section and context fields."
    }
  ]
}"""


@dataclass
class AgentDecision:
    summary: str
    kb_citations: list[str]
    recommended_actions: list[dict]


def reason(
    asset_360: dict,
    kpi_facts: dict,
    knowledge: list[KnowledgeSection],
    api_key: str | None = None,
) -> AgentDecision:
    """Call Claude with structured context and parse the JSON decision."""
    client = Anthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))

    kb_block = "\n\n".join(f"## {s.title}\n{s.body}" for s in knowledge)
    user_message = f"""## Context — Asset 360
{json.dumps(asset_360, indent=2, default=str)}

## Context — Calculated facts
{json.dumps(kpi_facts, indent=2, default=str)}

## Retrieved knowledge sections
{kb_block}

## Required output schema
{OUTPUT_SCHEMA}

Return only the JSON object. No prose before or after."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    text = response.content[0].text
    # Strip code fences if Claude wraps the JSON in ```json ... ```
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    parsed = json.loads(text)
    return AgentDecision(
        summary=parsed["summary"],
        kb_citations=parsed.get("kb_citations", []),
        recommended_actions=parsed.get("recommended_actions", []),
    )
