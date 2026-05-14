"""
Emit CustomTab metadata for each Bedrock custom object so it shows up in
the App Launcher. Runs idempotent. Also returns the list of tab names so
gen_metadata can grant visibility in the permission set.

Run::

    python tools/gen_tabs.py
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAB_DIR = ROOT / "force-app" / "main" / "default" / "tabs"
TAB_DIR.mkdir(parents=True, exist_ok=True)

# (object_api_name, motif) — motifs are stock Salesforce tab icons.
TABS: list[tuple[str, str]] = [
    ("Bedrock_Customer__c",         "Custom20: Sales"),
    ("Bedrock_Asset__c",            "Custom71: Spaceship"),
    ("Bedrock_Service_Contract__c", "Custom42: Currency"),
    ("Bedrock_Telemetry_Event__c",  "Custom54: Lightning"),
    ("Bedrock_KB_Section__c",       "Custom17: Book"),
    ("Bedrock_Service_Case__c",     "Custom27: Phone"),
    ("Bedrock_Warranty_Claim__c",   "Custom23: Money Bag"),
]


def emit(api_name: str, motif: str) -> Path:
    path = TAB_DIR / f"{api_name}.tab-meta.xml"
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>{motif}</motif>
</CustomTab>
"""
    path.write_text(xml, encoding="utf-8")
    return path


def main() -> None:
    for api_name, motif in TABS:
        p = emit(api_name, motif)
        print(f"  wrote {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
