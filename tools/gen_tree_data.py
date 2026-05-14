"""
Convert the sample CSVs + KB markdown into SF Data Tree JSON files.

Run::

    python tools/gen_tree_data.py

Then::

    sf data import tree --plan force-app/main/default/data/bedrock-plan.json --target-org BedrockDemo

The plan loads parents first (Customer → Asset → Contract → Telemetry,
plus KB sections which have no deps). Lookups are wired via @-references.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "data" / "sample"
OUT = ROOT / "force-app" / "main" / "default" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def _read_csv(name: str) -> list[dict]:
    with (SAMPLE / name).open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _records(entries: list[dict]) -> dict:
    return {"records": entries}


def _ref(prefix: str, key: str) -> str:
    """Sanitize a key into a tree referenceId."""
    return prefix + re.sub(r"[^A-Za-z0-9_]", "_", key)


# ── Build tree files ─────────────────────────────────────────────────
def build_customers() -> dict:
    rows = []
    for r in _read_csv("customers.csv"):
        rows.append({
            "attributes": {"type": "Bedrock_Customer__c", "referenceId": _ref("Cust", r["customer_id"])},
            "Customer_Id__c": r["customer_id"],
            "Account_Name__c": r["account_name"],
            "Account_Tier__c": r["account_tier"],
            "Service_Tier__c": r["service_tier"],
            "Primary_Contact_Name__c": r["primary_contact"],
            "Primary_Contact_Email__c": r["primary_contact_email"],
            "Country__c": r["country"],
        })
    return _records(rows)


def build_assets() -> dict:
    rows = []
    for r in _read_csv("assets.csv"):
        rows.append({
            "attributes": {"type": "Bedrock_Asset__c", "referenceId": _ref("Asset", r["asset_id"])},
            "Name": r["asset_id"],  # the Name field is Text on Asset
            "Asset_Id__c": r["asset_id"],
            "Customer__c": "@" + _ref("Cust", r["customer_id"]),
            "Model__c": r["model"],
            "Model_Class__c": r["model_class"],
            "Serial_Number__c": r["serial_number"],
            "Engine_Hours__c": int(r["engine_hours"]),
            "Contract_Status__c": r["contract_status"],
            "Warranty_Status__c": r["warranty_status"],
            "Operating_Status__c": r["operating_status"],
            "Location__c": r["location"],
            "Latitude__c": float(r["latitude"]),
            "Longitude__c": float(r["longitude"]),
        })
    return _records(rows)


def build_contracts() -> dict:
    rows = []
    for r in _read_csv("service_contracts.csv"):
        rows.append({
            "attributes": {"type": "Bedrock_Service_Contract__c", "referenceId": _ref("Con", r["contract_id"])},
            "Contract_Id__c": r["contract_id"],
            "Customer__c": "@" + _ref("Cust", r["customer_id"]),
            "Asset__c": "@" + _ref("Asset", r["asset_id"]),
            "Contract_Tier__c": r["contract_tier"],
            "Term_Months__c": int(r["term_months"]),
            "Start_Date__c": r["start_date"],
            "End_Date__c": r["end_date"],
            "Annual_Value_USD__c": float(r["annual_value_usd"]),
            "Status__c": r["status"],
        })
    return _records(rows)


def build_telemetry() -> dict:
    rows = []
    for r in _read_csv("telemetry_events.csv"):
        # Convert "YYYY-MM-DD HH:MM:SS" → ISO 8601 with Z so SF accepts it.
        ts = r["timestamp"].replace(" ", "T") + "Z" if r["timestamp"] else None
        resolved = r.get("resolved_timestamp", "").replace(" ", "T") + "Z" if r.get("resolved_timestamp") else None
        record = {
            "attributes": {"type": "Bedrock_Telemetry_Event__c", "referenceId": _ref("Evt", r["event_id"])},
            "Event_Id__c": r["event_id"],
            "Asset__c": "@" + _ref("Asset", r["asset_id"]),
            "Fault_Code__c": r["fault_code"],
            "Severity__c": r["severity"],
            "Event_Timestamp__c": ts,
            "Resolution_Status__c": r["resolution_status"],
            "RPM__c": int(r["rpm"]) if r.get("rpm") else None,
            "Coolant_Temp_C__c": float(r["coolant_temp_c"]) if r.get("coolant_temp_c") else None,
            "Hydraulic_Pressure_PSI__c": int(r["hydraulic_pressure_psi"]) if r.get("hydraulic_pressure_psi") else None,
            "Description__c": r["description"],
        }
        if resolved:
            record["Resolved_Timestamp__c"] = resolved
        # Strip None values — tree import doesn't like nulls.
        record = {k: v for k, v in record.items() if v is not None}
        rows.append(record)
    return _records(rows)


def build_kb_sections() -> dict:
    """Parse the KB markdown into Bedrock_KB_Section__c records."""
    text = (SAMPLE / "bedrock_knowledge_base.md").read_text(encoding="utf-8")
    pattern = re.compile(r"^##\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    rows = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        # Section number is the leading digit if any.
        m2 = re.match(r"^(\d+)\.\s*(.+)$", title)
        if m2:
            num = int(m2.group(1))
            short_title = m2.group(2).strip()
        else:
            num = i + 1
            short_title = title

        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[body_start:body_end].strip()

        # Build keywords from the title + body — strip markdown.
        clean = re.sub(r"[^A-Za-z0-9 ]", " ", body)
        words = [w.lower() for w in clean.split() if len(w) >= 4]
        keywords = " ".join(sorted(set(words)))[:1900]

        rows.append({
            "attributes": {"type": "Bedrock_KB_Section__c", "referenceId": _ref("Kb", str(num))},
            "Name": short_title[:80],
            "Section_Number__c": num,
            "Body__c": body[:31500],  # respect long text cap
            "Keywords__c": keywords,
        })
    return _records(rows)


def main() -> None:
    files = [
        ("Bedrock_Customer__c.json", build_customers()),
        ("Bedrock_Asset__c.json", build_assets()),
        ("Bedrock_Service_Contract__c.json", build_contracts()),
        ("Bedrock_Telemetry_Event__c.json", build_telemetry()),
        ("Bedrock_KB_Section__c.json", build_kb_sections()),
    ]
    for name, data in files:
        path = OUT / name
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"  wrote {path.relative_to(ROOT)}  ({len(data['records'])} records)")

    # Plan ties files together in load order. Tree import respects this.
    plan = [
        {"sobject": "Bedrock_Customer__c",         "files": ["Bedrock_Customer__c.json"]},
        {"sobject": "Bedrock_Asset__c",            "files": ["Bedrock_Asset__c.json"]},
        {"sobject": "Bedrock_Service_Contract__c", "files": ["Bedrock_Service_Contract__c.json"]},
        {"sobject": "Bedrock_Telemetry_Event__c",  "files": ["Bedrock_Telemetry_Event__c.json"]},
        {"sobject": "Bedrock_KB_Section__c",       "files": ["Bedrock_KB_Section__c.json"]},
    ]
    plan_path = OUT / "bedrock-plan.json"
    plan_path.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print(f"\nwrote plan: {plan_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
