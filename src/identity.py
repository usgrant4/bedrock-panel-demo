"""
Asset → customer resolution.

In production this is Data Cloud Identity Resolution. Here we do a deterministic
join on `customer_id` (which is also the candidate key the briefing names) and
expose a `serial_number` lookup for the realistic "telemetry arrives with a
serial, the agent has to resolve it" flow.
"""

from __future__ import annotations

from .data_loader import BedrockData


def resolve_by_serial(data: BedrockData, serial_number: str) -> str | None:
    """Return asset_id for a given serial, or None."""
    match = data.assets.loc[data.assets["serial_number"] == serial_number, "asset_id"]
    return None if match.empty else str(match.iloc[0])


def resolve_by_asset(data: BedrockData, asset_id: str) -> dict | None:
    """Return {asset_id, customer_id, customer_name} for a given asset."""
    a = data.assets.loc[data.assets["asset_id"] == asset_id]
    if a.empty:
        return None
    customer_id = a.iloc[0]["customer_id"]
    c = data.customers.loc[data.customers["customer_id"] == customer_id].iloc[0]
    return {
        "asset_id": asset_id,
        "customer_id": customer_id,
        "customer_name": c["account_name"],
    }
