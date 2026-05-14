"""Smoke tests — does the scaffold load?"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src import data_loader, identity, knowledge, value_calc, trust_policy


def test_data_loads():
    d = data_loader.load()
    assert len(d.customers) > 0
    assert len(d.assets) > 0
    assert len(d.telemetry) > 0
    assert len(d.contracts) > 0


def test_kb_loads_and_retrieves():
    kb = knowledge.KnowledgeBase.load()
    assert len(kb.sections) > 0
    hits = kb.retrieve("warranty claim", k=2)
    assert len(hits) > 0


def test_identity_resolution():
    d = data_loader.load()
    a = d.assets.iloc[0]
    resolved = identity.resolve_by_asset(d, a["asset_id"])
    assert resolved is not None
    assert resolved["customer_id"] == a["customer_id"]


def test_kpi_calc():
    d = data_loader.load()
    df = value_calc.open_critical_faults_30d(d)
    assert df is not None  # may be empty depending on data, that's fine


def test_trust_policy_defaults_safe():
    assert trust_policy.posture_for("totally_unknown_action") == trust_policy.TrustPosture.HUMAN_REQUIRED
