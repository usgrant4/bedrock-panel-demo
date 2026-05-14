"""
Loads the four Bedrock CSVs into pandas DataFrames.

Schema follows the Innovation TA briefing. The loader prefers files at the
top level of `data/` (real briefing assets) and falls back to `data/sample/`
so the demo runs from a fresh clone.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_DIR = DATA_DIR / "sample"


def _resolve(name: str) -> Path:
    primary = DATA_DIR / name
    if primary.exists():
        return primary
    fallback = SAMPLE_DIR / name
    if fallback.exists():
        return fallback
    raise FileNotFoundError(f"Neither {primary} nor {fallback} exists.")


@dataclass
class BedrockData:
    customers: pd.DataFrame
    assets: pd.DataFrame
    telemetry: pd.DataFrame
    contracts: pd.DataFrame

    def asset_360(self, asset_id: str) -> dict:
        """Single-asset rollup used as the agent's primary context payload."""
        asset_row = self.assets.loc[self.assets["asset_id"] == asset_id]
        if asset_row.empty:
            raise KeyError(asset_id)
        asset = asset_row.iloc[0].to_dict()

        customer = self.customers.loc[
            self.customers["customer_id"] == asset["customer_id"]
        ].iloc[0].to_dict()

        contract = self.contracts.loc[
            self.contracts["asset_id"] == asset_id
        ]
        contract = contract.iloc[0].to_dict() if not contract.empty else None

        recent_faults = (
            self.telemetry.loc[self.telemetry["asset_id"] == asset_id]
            .sort_values("timestamp", ascending=False)
            .head(10)
            .to_dict(orient="records")
        )

        return {
            "asset": asset,
            "customer": customer,
            "contract": contract,
            "recent_faults": recent_faults,
        }


def load() -> BedrockData:
    customers = pd.read_csv(_resolve("customers.csv"))
    assets = pd.read_csv(_resolve("assets.csv"))
    telemetry = pd.read_csv(_resolve("telemetry_events.csv"), parse_dates=["timestamp"])
    contracts = pd.read_csv(_resolve("service_contracts.csv"))
    return BedrockData(customers, assets, telemetry, contracts)
