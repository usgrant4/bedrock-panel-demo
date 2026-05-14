"""
Convert sample CSVs into upsert-ready CSVs with SF API column headers.

Run::

    python tools/gen_upsert_csv.py

Then load (in order) with::

    sf data upsert --target-org BedrockDemo \\
        --sobject Bedrock_Customer__c \\
        --file force-app/main/default/data/upsert/customers.csv \\
        --external-id Customer_Id__c

Lookup columns use the ``Lookup__r.External_Id__c`` syntax that the bulk
API resolves to record IDs. Idempotent: rerunning loads = updates.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "data" / "sample"
OUT = ROOT / "force-app" / "main" / "default" / "data" / "upsert"
OUT.mkdir(parents=True, exist_ok=True)


def _read(name: str) -> list[dict]:
    with (SAMPLE / name).open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _write(name: str, fieldnames: list[str], rows: list[dict]) -> None:
    path = OUT / name
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {path.relative_to(ROOT)}  ({len(rows)} rows)")


def customers() -> None:
    rows = []
    for r in _read("customers.csv"):
        rows.append({
            "Customer_Id__c": r["customer_id"],
            "Account_Name__c": r["account_name"],
            "Account_Tier__c": r["account_tier"],
            "Service_Tier__c": r["service_tier"],
            "Primary_Contact_Name__c": r["primary_contact"],
            "Primary_Contact_Email__c": r["primary_contact_email"],
            "Country__c": r["country"],
        })
    _write("customers.csv",
           ["Customer_Id__c","Account_Name__c","Account_Tier__c","Service_Tier__c",
            "Primary_Contact_Name__c","Primary_Contact_Email__c","Country__c"],
           rows)


def assets() -> None:
    rows = []
    for r in _read("assets.csv"):
        rows.append({
            "Asset_Id__c": r["asset_id"],
            "Name": r["asset_id"],
            "Customer__r.Customer_Id__c": r["customer_id"],
            "Model__c": r["model"],
            "Model_Class__c": r["model_class"],
            "Serial_Number__c": r["serial_number"],
            "Engine_Hours__c": r["engine_hours"],
            "Contract_Status__c": r["contract_status"],
            "Warranty_Status__c": r["warranty_status"],
            "Operating_Status__c": r["operating_status"],
            "Location__c": r["location"],
            "Latitude__c": r["latitude"],
            "Longitude__c": r["longitude"],
        })
    _write("assets.csv",
           ["Asset_Id__c","Name","Customer__r.Customer_Id__c","Model__c","Model_Class__c",
            "Serial_Number__c","Engine_Hours__c","Contract_Status__c","Warranty_Status__c",
            "Operating_Status__c","Location__c","Latitude__c","Longitude__c"],
           rows)


def contracts() -> None:
    rows = []
    for r in _read("service_contracts.csv"):
        rows.append({
            "Contract_Id__c": r["contract_id"],
            "Customer__r.Customer_Id__c": r["customer_id"],
            "Asset__r.Asset_Id__c": r["asset_id"],
            "Contract_Tier__c": r["contract_tier"],
            "Term_Months__c": r["term_months"],
            "Start_Date__c": r["start_date"],
            "End_Date__c": r["end_date"],
            "Annual_Value_USD__c": r["annual_value_usd"],
            "Status__c": r["status"],
        })
    _write("contracts.csv",
           ["Contract_Id__c","Customer__r.Customer_Id__c","Asset__r.Asset_Id__c",
            "Contract_Tier__c","Term_Months__c","Start_Date__c","End_Date__c",
            "Annual_Value_USD__c","Status__c"],
           rows)


def telemetry() -> None:
    rows = []
    for r in _read("telemetry_events.csv"):
        ts = r["timestamp"].replace(" ", "T") + "Z" if r["timestamp"] else ""
        resolved = r["resolved_timestamp"].replace(" ", "T") + "Z" if r.get("resolved_timestamp") else ""
        rows.append({
            "Event_Id__c": r["event_id"],
            "Asset__r.Asset_Id__c": r["asset_id"],
            "Fault_Code__c": r["fault_code"],
            "Severity__c": r["severity"],
            "Event_Timestamp__c": ts,
            "Resolution_Status__c": r["resolution_status"],
            "Resolved_Timestamp__c": resolved,
            "RPM__c": r["rpm"],
            "Coolant_Temp_C__c": r["coolant_temp_c"],
            "Hydraulic_Pressure_PSI__c": r["hydraulic_pressure_psi"],
            "Description__c": r["description"],
        })
    _write("telemetry.csv",
           ["Event_Id__c","Asset__r.Asset_Id__c","Fault_Code__c","Severity__c",
            "Event_Timestamp__c","Resolution_Status__c","Resolved_Timestamp__c",
            "RPM__c","Coolant_Temp_C__c","Hydraulic_Pressure_PSI__c","Description__c"],
           rows)


def kb_sections() -> None:
    """Parse the KB markdown into upsert rows. External id is the section number (text)."""
    text = (SAMPLE / "bedrock_knowledge_base.md").read_text(encoding="utf-8")
    pattern = re.compile(r"^##\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    rows = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
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
        clean = re.sub(r"[^A-Za-z0-9 ]", " ", body)
        words = sorted({w.lower() for w in clean.split() if len(w) >= 4})
        rows.append({
            "Name": short_title[:80],
            "Section_Number__c": num,
            "Body__c": body[:31500],
            "Keywords__c": " ".join(words)[:1900],
        })
    # KB has no natural external ID — use Name as the upsert key (must be unique).
    _write("kb_sections.csv",
           ["Name","Section_Number__c","Body__c","Keywords__c"],
           rows)


def main() -> None:
    print(f"writing upsert CSVs under {OUT.relative_to(ROOT)}")
    customers()
    assets()
    contracts()
    telemetry()
    kb_sections()


if __name__ == "__main__":
    main()
