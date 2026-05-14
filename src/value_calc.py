"""
KPI calculations grounded in the data. The briefing explicitly says "a value
calculation grounded in the data" is one of the things that pushes the
conversation forward — this module exists so the demo always has a real
number on screen.
"""

from __future__ import annotations

from datetime import timedelta

import pandas as pd

from .data_loader import BedrockData


def open_critical_faults_30d(data: BedrockData, customer_id: str | None = None) -> pd.DataFrame:
    """Open critical fault events in the last 30 days, optionally per customer."""
    cutoff = data.telemetry["timestamp"].max() - timedelta(days=30)
    df = data.telemetry.merge(data.assets[["asset_id", "customer_id"]], on="asset_id")
    df = df[
        (df["severity"] == "Critical")
        & (df["resolution_status"] == "Open")
        & (df["timestamp"] >= cutoff)
    ]
    if customer_id is not None:
        df = df[df["customer_id"] == customer_id]
    return df


def arr_at_risk(data: BedrockData, customer_id: str) -> float:
    """Annual contract value across active contracts on assets currently in fault."""
    open_faults = open_critical_faults_30d(data, customer_id)
    if open_faults.empty:
        return 0.0
    affected_assets = set(open_faults["asset_id"].unique())
    rows = data.contracts[
        (data.contracts["customer_id"] == customer_id)
        & (data.contracts["asset_id"].isin(affected_assets))
        & (data.contracts["status"] == "Active")
    ]
    return float(rows["annual_value_usd"].sum())


def fleet_mttr_hours(data: BedrockData) -> float:
    """Mean-time-to-repair on resolved critical faults (in hours)."""
    df = data.telemetry[
        (data.telemetry["severity"] == "Critical")
        & (data.telemetry["resolution_status"] == "Resolved")
        & data.telemetry["resolved_timestamp"].notna()
    ].copy()
    if df.empty:
        return float("nan")
    df["resolved_timestamp"] = pd.to_datetime(df["resolved_timestamp"])
    df["mttr_hours"] = (df["resolved_timestamp"] - df["timestamp"]).dt.total_seconds() / 3600
    return float(df["mttr_hours"].mean())


def warranty_exposure(data: BedrockData) -> dict:
    """Count of assets under warranty with open critical faults — a leakage proxy."""
    open_faults = open_critical_faults_30d(data)
    if open_faults.empty:
        return {"count": 0, "asset_ids": []}
    in_warranty = data.assets[
        (data.assets["asset_id"].isin(open_faults["asset_id"].unique()))
        & (data.assets["warranty_status"] == "Active")
    ]
    return {"count": int(len(in_warranty)), "asset_ids": in_warranty["asset_id"].tolist()}
