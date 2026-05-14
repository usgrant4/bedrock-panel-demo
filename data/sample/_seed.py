"""
Deterministic generator for Bedrock sample data.

Run this once after a clone (or any time you want to refresh the demo data)::

    python data/sample/_seed.py

It writes:
  customers.csv        — 10 accounts, the briefing range CUST-10001..CUST-10010
  assets.csv           — 37 connected assets, distributed realistically
  service_contracts.csv — one contract per asset
  telemetry_events.csv — 80 events with a known demo signal:
      • ASSET-50101 (Pinnacle haul truck) has an open critical HYD-447 fault
      • ASSET-50105 (Pinnacle dozer)      has an open critical COOL-220 fault
      • Resolved-fault MTTR converges around the briefing baseline (~11.4 h)

Determinism: a single PRNG seed (42) controls every random choice, so the
demo numbers don't drift between regenerations.
"""
from __future__ import annotations

import csv
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent
SEED = 42
NOW = datetime(2026, 5, 9, 12, 0, tzinfo=timezone.utc)

rng = random.Random(SEED)


# ── Customers ────────────────────────────────────────────────────────
CUSTOMERS = [
    ("CUST-10001", "Pinnacle Mining Group",          "Strategic",  "Platinum", "Sarah Chen",       "sarah.chen@pinnaclemining.com",   "USA"),
    ("CUST-10002", "Granite Construction Partners",  "Strategic",  "Gold",     "Marcus Holloway",  "m.holloway@graniteconstructs.com","USA"),
    ("CUST-10003", "Sunbelt Earthworks Co",          "Enterprise", "Gold",     "Diana Park",       "dpark@sunbeltearthworks.com",     "USA"),
    ("CUST-10004", "Northbridge Quarry Inc",         "Enterprise", "Silver",   "Ryan Becker",      "r.becker@northbridgequarry.com",  "Canada"),
    ("CUST-10005", "Cascade Power Solutions",        "Strategic",  "Platinum", "Aisha Patel",      "aisha.patel@cascadepower.com",    "USA"),
    ("CUST-10006", "Heartland Aggregates LLC",       "Mid-Market", "Silver",   "Tom Reyes",        "treyes@heartlandagg.com",         "USA"),
    ("CUST-10007", "Summit Mining & Metals",         "Enterprise", "Gold",     "Elena Volkov",     "e.volkov@summitmining.com",       "Australia"),
    ("CUST-10008", "Riverbend Construction",         "Mid-Market", "Silver",   "Carl Jensen",      "cjensen@riverbendcon.com",        "USA"),
    ("CUST-10009", "Gulf Coast Energy Services",     "Enterprise", "Gold",     "Priya Singh",      "priya.singh@gulfcoastenergy.com", "USA"),
    ("CUST-10010", "Maple Ridge Earthmoving",        "Mid-Market", "Bronze",   "James Wu",         "jwu@mapleridge-em.com",           "Canada"),
]


# ── Assets ───────────────────────────────────────────────────────────
# (asset_id, customer_id, model, model_class, serial_number, engine_hours,
#  contract_status, warranty_status, operating_status, location, lat, lon)
ASSETS = [
    # Pinnacle Mining — the demo customer.
    ("ASSET-50101","CUST-10001","HT-797","Haul Truck",  "PMG-77234", 3420,"Active","Active","Faulted",   "Bingham Canyon Mine, UT", 40.5197,-112.1492),
    ("ASSET-50102","CUST-10001","HT-797","Haul Truck",  "PMG-77235", 3380,"Active","Active","Operational","Bingham Canyon Mine, UT", 40.5197,-112.1492),
    ("ASSET-50103","CUST-10001","HT-797","Haul Truck",  "PMG-77231",18450,"Active","Expired","Operational","Bingham Canyon Mine, UT",40.5197,-112.1492),
    ("ASSET-50104","CUST-10001","D-9000","Dozer",       "PMG-90112", 2104,"Active","Active","Operational","Bingham Canyon Mine, UT", 40.5197,-112.1492),
    ("ASSET-50105","CUST-10001","D-9000","Dozer",       "PMG-90119", 2870,"Active","Active","Faulted",   "Bingham Canyon Mine, UT", 40.5197,-112.1492),
    ("ASSET-50106","CUST-10001","GEN-2000","Generator", "PMG-20055", 5210,"Active","Active","Operational","Pinnacle Ops Center, UT", 40.5210,-112.1500),
    # Granite Construction
    ("ASSET-50201","CUST-10002","EX-450","Excavator",   "GCP-45044", 4530,"Active","Active","Operational","Phoenix Site, AZ",       33.4484,-112.0740),
    ("ASSET-50202","CUST-10002","EX-450","Excavator",   "GCP-45048", 4280,"Active","Active","Operational","Phoenix Site, AZ",       33.4484,-112.0740),
    ("ASSET-50203","CUST-10002","WL-988","Wheel Loader","GCP-98801",12200,"Active","Expired","Operational","Tucson Yard, AZ",       32.2226,-110.9747),
    ("ASSET-50204","CUST-10002","D-9000","Dozer",       "GCP-90201", 3050,"Active","Active","Operational","Phoenix Site, AZ",       33.4484,-112.0740),
    ("ASSET-50205","CUST-10002","BL-650","Backhoe Loader","GCP-65001",1840,"Pending Renewal","Active","Operational","Phoenix Site, AZ",33.4484,-112.0740),
    # Sunbelt Earthworks
    ("ASSET-50301","CUST-10003","EX-450","Excavator",   "SBE-45122", 5680,"Active","Active","Operational","Houston Site, TX",       29.7604, -95.3698),
    ("ASSET-50302","CUST-10003","BL-650","Backhoe Loader","SBE-65033",3200,"Active","Active","Faulted",  "Houston Site, TX",       29.7604, -95.3698),
    ("ASSET-50303","CUST-10003","D-9000","Dozer",       "SBE-90305", 8400,"Active","Expired","Operational","Dallas Site, TX",       32.7767, -96.7970),
    ("ASSET-50304","CUST-10003","WL-988","Wheel Loader","SBE-98810", 2150,"Active","Active","Idle",      "Dallas Site, TX",        32.7767, -96.7970),
    # Northbridge Quarry
    ("ASSET-50401","CUST-10004","EX-450","Excavator",   "NBQ-45201", 9280,"Active","Expired","Operational","Sudbury Quarry, ON",    46.4917, -80.9930),
    ("ASSET-50402","CUST-10004","WL-988","Wheel Loader","NBQ-98815", 7140,"Active","Expired","Operational","Sudbury Quarry, ON",    46.4917, -80.9930),
    ("ASSET-50403","CUST-10004","D-9000","Dozer",       "NBQ-90410",11850,"Expired","Expired","Maintenance","Sudbury Quarry, ON",   46.4917, -80.9930),
    # Cascade Power
    ("ASSET-50501","CUST-10005","GEN-2000","Generator", "CPS-20081", 4230,"Active","Active","Operational","Portland Plant, OR",     45.5152,-122.6784),
    ("ASSET-50502","CUST-10005","GEN-2000","Generator", "CPS-20084", 4150,"Active","Active","Operational","Portland Plant, OR",     45.5152,-122.6784),
    ("ASSET-50503","CUST-10005","GEN-2000","Generator", "CPS-20087", 3890,"Active","Active","Faulted",   "Seattle Plant, WA",      47.6062,-122.3321),
    ("ASSET-50504","CUST-10005","D-9000","Dozer",       "CPS-90510", 1620,"Active","Active","Operational","Portland Plant, OR",     45.5152,-122.6784),
    # Heartland Aggregates
    ("ASSET-50601","CUST-10006","EX-450","Excavator",   "HLA-45301", 6500,"Active","Expired","Operational","Kansas City Site, MO", 39.0997, -94.5786),
    ("ASSET-50602","CUST-10006","WL-988","Wheel Loader","HLA-98820", 5240,"Active","Expired","Operational","Kansas City Site, MO", 39.0997, -94.5786),
    ("ASSET-50603","CUST-10006","BL-650","Backhoe Loader","HLA-65120",2800,"Active","Active","Operational","Kansas City Site, MO", 39.0997, -94.5786),
    # Summit Mining
    ("ASSET-50701","CUST-10007","HT-797","Haul Truck",  "SMM-77301", 5610,"Active","Active","Operational","Mount Whaleback, AU",   -23.3604,119.6799),
    ("ASSET-50702","CUST-10007","HT-797","Haul Truck",  "SMM-77305", 5430,"Active","Active","Operational","Mount Whaleback, AU",   -23.3604,119.6799),
    ("ASSET-50703","CUST-10007","EX-450","Excavator",   "SMM-45230", 4890,"Active","Active","Faulted",   "Mount Whaleback, AU",   -23.3604,119.6799),
    ("ASSET-50704","CUST-10007","D-9000","Dozer",       "SMM-90801", 3210,"Active","Active","Operational","Mount Whaleback, AU",  -23.3604,119.6799),
    ("ASSET-50705","CUST-10007","GEN-2000","Generator", "SMM-20140", 2980,"Active","Active","Operational","Mount Whaleback, AU",  -23.3604,119.6799),
    # Riverbend Construction
    ("ASSET-50801","CUST-10008","BL-650","Backhoe Loader","RBC-65240",4720,"Active","Expired","Operational","Memphis Site, TN",    35.1495, -90.0490),
    ("ASSET-50802","CUST-10008","EX-450","Excavator",   "RBC-45350", 3850,"Active","Active","Operational","Memphis Site, TN",      35.1495, -90.0490),
    ("ASSET-50803","CUST-10008","D-9000","Dozer",       "RBC-90910", 7200,"Active","Expired","Idle",     "Nashville Site, TN",     36.1627, -86.7816),
    # Gulf Coast Energy
    ("ASSET-50901","CUST-10009","GEN-2000","Generator", "GCE-20210", 8120,"Active","Expired","Operational","Galveston, TX",         29.3013, -94.7977),
    ("ASSET-50902","CUST-10009","GEN-2000","Generator", "GCE-20215", 7850,"Active","Expired","Operational","Galveston, TX",         29.3013, -94.7977),
    # Maple Ridge Earthmoving
    ("ASSET-51001","CUST-10010","BL-650","Backhoe Loader","MRE-65310",5340,"Active","Expired","Operational","Vancouver Site, BC",   49.2827,-123.1207),
    ("ASSET-51002","CUST-10010","WL-988","Wheel Loader","MRE-98890", 4910,"Expired","Expired","Idle",     "Vancouver Site, BC",    49.2827,-123.1207),
]


# ── Service contracts ────────────────────────────────────────────────
TIER_VALUES = {
    "Platinum": (480_000, 650_000),
    "Gold":     (180_000, 320_000),
    "Silver":    (80_000, 140_000),
    "Bronze":    (30_000,  60_000),
}

# Contract overrides for the few non-Active rows (everything else is Active).
CONTRACT_OVERRIDES = {
    "ASSET-50205": ("Pending Renewal", "2025-05-01", "2026-04-30", 12),
    "ASSET-50403": ("Expired",         "2024-05-01", "2025-04-30", 12),
    "ASSET-51002": ("Expired",         "2024-08-01", "2025-07-31", 12),
}


def _customer_tier(customer_id: str) -> str:
    return next(c[3] for c in CUSTOMERS if c[0] == customer_id)


def build_contracts() -> list[tuple]:
    rows = []
    for asset_id, customer_id, *_ in ASSETS:
        tier = _customer_tier(customer_id)
        lo, hi = TIER_VALUES[tier]
        annual_value = rng.randrange(lo, hi, 5_000)
        contract_id = "CON-" + asset_id.split("-")[1]

        if asset_id in CONTRACT_OVERRIDES:
            status, start, end, term = CONTRACT_OVERRIDES[asset_id]
        else:
            status = "Active"
            term = rng.choice([12, 24, 36])
            start_dt = datetime(2024, 1, 1) + timedelta(days=rng.randrange(0, 540))
            start = start_dt.date().isoformat()
            end = (start_dt + timedelta(days=term * 30)).date().isoformat()

        rows.append((contract_id, customer_id, asset_id, tier, term, start, end, annual_value, status))
    return rows


# ── Telemetry events ─────────────────────────────────────────────────
FAULT_LIB = [
    # (code,    severity,   description,                                                        rpm_range,    coolant_range, hyd_range)
    ("HYD-447", "Critical", "Hydraulic pressure spike — main pump output beyond 4250 psi for 47s", (1900, 2200), (88,  98),  (4200, 4350)),
    ("COOL-220","Critical", "Coolant temperature elevated — sustained >118C for 6+ minutes",      (1700, 1950), (118, 124), (1900, 2300)),
    ("ENG-105", "Critical", "Engine oil pressure below safe threshold (<22 psi at full load)",    (1850, 2100), (92,  101), (2100, 2400)),
    ("VIB-654", "Critical", "Bearing vibration anomaly — ISO 10816 zone D exceeded for 8 minutes",(1500, 1900), (85,  95),  (1800, 2200)),
    ("TRA-308", "High",     "Transmission slip detected on shift 4-5 under load",                 (1600, 2000), (88,  98),  (1900, 2300)),
    ("ELE-091", "High",     "Electrical short detected on auxiliary harness",                     (1300, 1900), (75,  88),  (1700, 2100)),
    ("BRK-512", "Medium",   "Brake pad wear over 70% — replacement window approaching",           (1400, 1900), (80,  90),  (1900, 2200)),
    ("FUEL-073","Medium",   "Fuel system anomaly — injector flow variance >12%",                  (1500, 2000), (82,  93),  (1900, 2300)),
    ("AIR-204", "Low",      "Air filter restriction approaching service threshold",               (1500, 2000), (80,  92),  (1900, 2300)),
    ("LUB-016", "Low",      "Lubrication cycle skipped on bay 3 — operator notified",             (1400, 1800), (78,  88),  (1900, 2200)),
]


def build_telemetry() -> list[tuple]:
    """80 events. The first 10 are scripted; the rest are seeded random."""
    asset_ids = [a[0] for a in ASSETS]
    rows: list[tuple] = []

    def emit(asset_id, code, severity, ts, resolution, resolved_ts, rpm, coolant, hyd, desc):
        event_id = f"EVT-{ts.strftime('%Y%m%d%H%M')}-{asset_id.split('-')[1]}"
        rows.append((
            event_id, asset_id, code, severity,
            ts.strftime("%Y-%m-%d %H:%M:%S"),
            resolution,
            resolved_ts.strftime("%Y-%m-%d %H:%M:%S") if resolved_ts else "",
            rpm, coolant, hyd, desc,
        ))

    # ── Scripted demo events (these MUST be present for the demo flow) ──
    emit("ASSET-50101","HYD-447","Critical", NOW - timedelta(hours=5, minutes=42),
         "Open", None, 2160, 102, 4280,
         "Hydraulic pressure spike — main pump output beyond 4250 psi for 47s")
    emit("ASSET-50105","COOL-220","Critical", NOW - timedelta(days=1, hours=2),
         "Open", None, 1850, 121, 2100,
         "Coolant temperature elevated — sustained >118C for 6 minutes")
    emit("ASSET-50302","HYD-447","Critical", NOW - timedelta(days=2, hours=4),
         "Open", None, 2080, 95, 4310,
         "Hydraulic pressure spike on lift cycle — secondary relief tripped twice")
    emit("ASSET-50503","VIB-654","Critical", NOW - timedelta(days=3, hours=14),
         "Open", None, 1720, 89, 2050,
         "Bearing vibration anomaly on alternator — ISO 10816 zone D exceeded")
    emit("ASSET-50703","ENG-105","Critical", NOW - timedelta(days=4, hours=20),
         "Open", None, 1980, 99, 2310,
         "Engine oil pressure below safe threshold under load — derated")

    # A few resolved Critical faults so MTTR has a meaningful denominator.
    for asset_id, code, hours_ago, mttr_h in [
        ("ASSET-50101","COOL-220",  12*24,  10.5),
        ("ASSET-50104","HYD-447",  14*24,  12.5),
        ("ASSET-50202","ENG-105",  16*24,  12.2),
        ("ASSET-50503","COOL-220", 19*24,  12.75),
        ("ASSET-50201","VIB-654",  21*24,  11.5),
        ("ASSET-50703","HYD-447",  24*24,  12.0),
        ("ASSET-50801","ENG-105",  29*24,  11.25),
    ]:
        spec = next(f for f in FAULT_LIB if f[0] == code)
        ts = NOW - timedelta(hours=hours_ago)
        resolved = ts + timedelta(hours=mttr_h)
        emit(asset_id, code, "Critical", ts, "Resolved", resolved,
             rng.randrange(*spec[3]), rng.randrange(*spec[4]), rng.randrange(*spec[5]),
             spec[2])

    # ── Random fill to ~80 events total ───────────────────────────────
    while len(rows) < 80:
        asset_id = rng.choice(asset_ids)
        spec = rng.choice(FAULT_LIB)
        days_ago = rng.randrange(1, 60)
        hours_ago = days_ago * 24 + rng.randrange(0, 24)
        ts = NOW - timedelta(hours=hours_ago)
        # Most non-critical events are resolved; older critical events are resolved.
        resolved_p = 0.85 if spec[1] != "Critical" else 0.65
        if rng.random() < resolved_p:
            mttr = rng.uniform(2.0, 18.0) if spec[1] == "Critical" else rng.uniform(0.5, 8.0)
            resolution, resolved_ts = "Resolved", ts + timedelta(hours=mttr)
        else:
            resolution, resolved_ts = "Open", None
        emit(asset_id, spec[0], spec[1], ts, resolution, resolved_ts,
             rng.randrange(*spec[3]), rng.randrange(*spec[4]), rng.randrange(*spec[5]),
             spec[2])

    rows.sort(key=lambda r: r[4], reverse=True)
    return rows


# ── Writers ──────────────────────────────────────────────────────────
def _write(name: str, header: list[str], rows: list[tuple]) -> None:
    path = OUT / name
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    print(f"wrote {path}  ({len(rows)} rows)")


def main() -> None:
    _write(
        "customers.csv",
        ["customer_id","account_name","account_tier","service_tier","primary_contact","primary_contact_email","country"],
        CUSTOMERS,
    )
    _write(
        "assets.csv",
        ["asset_id","customer_id","model","model_class","serial_number","engine_hours","contract_status","warranty_status","operating_status","location","latitude","longitude"],
        ASSETS,
    )
    _write(
        "service_contracts.csv",
        ["contract_id","customer_id","asset_id","contract_tier","term_months","start_date","end_date","annual_value_usd","status"],
        build_contracts(),
    )
    _write(
        "telemetry_events.csv",
        ["event_id","asset_id","fault_code","severity","timestamp","resolution_status","resolved_timestamp","rpm","coolant_temp_c","hydraulic_pressure_psi","description"],
        build_telemetry(),
    )


if __name__ == "__main__":
    main()