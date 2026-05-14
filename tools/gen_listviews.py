"""
Emit an "All" ListView for each Bedrock custom object.

Without an explicit ListView, Lightning won't surface an "All" filter in
the tab dropdown — making the records hard to find unless you remember
the record name. These views give the panel a clean grid to walk through.

Run::

    python tools/gen_listviews.py
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OBJ_DIR = ROOT / "force-app" / "main" / "default" / "objects"


# (object_api_name, [columns]) — column names match the underlying field
# API names or the canonical NAME / CREATED_DATE pseudo-fields.
LIST_VIEWS: dict[str, list[str]] = {
    "Bedrock_Customer__c": [
        "NAME", "Customer_Id__c", "Account_Name__c", "Service_Tier__c", "Account_Tier__c", "Country__c",
    ],
    "Bedrock_Asset__c": [
        "NAME", "Asset_Id__c", "Customer__c", "Model__c", "Warranty_Status__c", "Operating_Status__c",
    ],
    "Bedrock_Service_Contract__c": [
        "NAME", "Contract_Id__c", "Customer__c", "Asset__c", "Contract_Tier__c", "Annual_Value_USD__c", "Status__c",
    ],
    "Bedrock_Telemetry_Event__c": [
        "NAME", "Event_Id__c", "Asset__c", "Fault_Code__c", "Severity__c", "Event_Timestamp__c", "Resolution_Status__c",
    ],
    "Bedrock_KB_Section__c": [
        "NAME", "Section_Number__c",
    ],
    "Bedrock_Service_Case__c": [
        "NAME", "Subject__c", "Status__c", "Priority__c", "Customer__c", "Asset__c", "Fault_Code__c", "CREATED_DATE",
    ],
    "Bedrock_Warranty_Claim__c": [
        "NAME", "Claim_Status__c", "Asset__c", "Service_Contract__c", "Fault_Code__c", "Estimated_Cost_USD__c", "CREATED_DATE",
    ],
}


def write_list_view(api_name: str, columns: list[str]) -> Path:
    dir_path = OBJ_DIR / api_name / "listViews"
    dir_path.mkdir(parents=True, exist_ok=True)
    path = dir_path / "All.listView-meta.xml"
    cols_xml = "\n".join(f"    <columns>{c}</columns>" for c in columns)
    # sharedTo makes the list view visible to everyone in the org rather
    # than just the deploying user. Required for the panel demo, where the
    # running user needs to see records without owning the list view.
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<ListView xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>All</fullName>
{cols_xml}
    <filterScope>Everything</filterScope>
    <label>All</label>
    <sharedTo>
        <allInternalUsers></allInternalUsers>
    </sharedTo>
</ListView>
"""
    path.write_text(xml, encoding="utf-8")
    return path


def main() -> None:
    for api_name, cols in LIST_VIEWS.items():
        p = write_list_view(api_name, cols)
        print(f"  wrote {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
