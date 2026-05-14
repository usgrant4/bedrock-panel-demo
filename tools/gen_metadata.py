"""
Emit all SFDX metadata XML for the Bedrock demo data model.

Run::

    python tools/gen_metadata.py

This is idempotent — it overwrites the files it owns. Edit this script (not
the XML) when you want to change a field; rerun. Lower maintenance, fewer
brittle hand-edits, and the file is self-documenting for the panel.
"""
from __future__ import annotations

import textwrap
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OBJ_DIR = ROOT / "force-app" / "main" / "default" / "objects"


# ── Field model ──────────────────────────────────────────────────────
@dataclass
class Field:
    api_name: str
    label: str
    type: str  # Text, LongTextArea, Number, Currency, Date, DateTime, Email, Picklist, Lookup
    length: int | None = None       # Text
    precision: int | None = None    # Number / Currency
    scale: int | None = None        # Number / Currency
    visible_lines: int | None = None  # LongTextArea
    picklist_values: list[str] = field(default_factory=list)
    reference_to: str | None = None  # Lookup target object
    relationship_label: str | None = None
    relationship_name: str | None = None
    required: bool = False
    unique: bool = False
    external_id: bool = False
    description: str | None = None


@dataclass
class CustomObject:
    api_name: str
    label: str
    plural: str
    description: str
    name_field_label: str = "Name"
    name_field_type: str = "Text"   # Text or AutoNumber
    name_field_format: str | None = None  # for AutoNumber
    fields: list[Field] = field(default_factory=list)


# ── Picklists used in multiple objects ───────────────────────────────
SEVERITY = ["Critical", "High", "Medium", "Low"]
RESOLUTION = ["Open", "Resolved"]
WARRANTY = ["Active", "Expired", "In-Service-Plan"]
OPERATING = ["Operational", "Idle", "Faulted", "Maintenance"]
CONTRACT_STATUS = ["Active", "Expired", "Pending Renewal"]
SERVICE_TIER = ["Platinum", "Gold", "Silver", "Bronze"]
ACCOUNT_TIER = ["Strategic", "Enterprise", "Mid-Market"]
MODEL_CLASS = ["Haul Truck", "Excavator", "Dozer", "Generator", "Wheel Loader", "Backhoe Loader"]
CASE_TYPE = ["Mechanical", "Electrical", "Inspection", "Other"]
CASE_PRIORITY = ["High", "Medium", "Low"]
CASE_STATUS = ["New", "In Progress", "Resolved", "Closed"]
CASE_ORIGIN = ["Agentforce", "Phone", "Email", "Web", "Dealer Portal"]
CLAIM_STATUS = ["Staged", "Submitted", "Approved", "Rejected"]
CONTRACT_TIER = SERVICE_TIER


# ── Object definitions ───────────────────────────────────────────────
OBJECTS: list[CustomObject] = [
    CustomObject(
        api_name="Bedrock_Customer__c",
        label="Bedrock Customer",
        plural="Bedrock Customers",
        description="Bedrock customer / account. In production this is standard Account.",
        name_field_label="Customer Number",
        name_field_type="AutoNumber",
        name_field_format="BC-{00000}",
        fields=[
            Field("Customer_Id__c", "Customer Id", "Text", length=20, required=True, unique=True, external_id=True,
                  description="Stable external id (e.g., CUST-10001)."),
            Field("Account_Name__c", "Account Name", "Text", length=120, required=True),
            Field("Account_Tier__c", "Account Tier", "Picklist", picklist_values=ACCOUNT_TIER),
            Field("Service_Tier__c", "Service Tier", "Picklist", picklist_values=SERVICE_TIER,
                  description="Drives SLA + entitlements per KB sections 2 and 3."),
            Field("Primary_Contact_Name__c", "Primary Contact Name", "Text", length=120),
            Field("Primary_Contact_Email__c", "Primary Contact Email", "Email"),
            Field("Country__c", "Country", "Text", length=80),
        ],
    ),
    CustomObject(
        api_name="Bedrock_Asset__c",
        label="Bedrock Asset",
        plural="Bedrock Assets",
        description="A connected piece of Bedrock equipment. In production this is standard Asset.",
        name_field_label="Asset Name",
        name_field_type="Text",
        fields=[
            Field("Asset_Id__c", "Asset Id", "Text", length=20, required=True, unique=True, external_id=True,
                  description="Stable external id (e.g., ASSET-50101)."),
            Field("Customer__c", "Customer", "Lookup", reference_to="Bedrock_Customer__c", required=True,
                  relationship_label="Assets", relationship_name="Assets"),
            Field("Model__c", "Model", "Text", length=40),
            Field("Model_Class__c", "Model Class", "Picklist", picklist_values=MODEL_CLASS),
            Field("Serial_Number__c", "Serial Number", "Text", length=40, unique=True),
            Field("Engine_Hours__c", "Engine Hours", "Number", precision=9, scale=0),
            Field("Contract_Status__c", "Contract Status", "Picklist", picklist_values=CONTRACT_STATUS),
            Field("Warranty_Status__c", "Warranty Status", "Picklist", picklist_values=WARRANTY),
            Field("Operating_Status__c", "Operating Status", "Picklist", picklist_values=OPERATING),
            Field("Location__c", "Location", "Text", length=120),
            Field("Latitude__c", "Latitude", "Number", precision=9, scale=4),
            Field("Longitude__c", "Longitude", "Number", precision=9, scale=4),
        ],
    ),
    CustomObject(
        api_name="Bedrock_Service_Contract__c",
        label="Bedrock Service Contract",
        plural="Bedrock Service Contracts",
        description="A service contract on a Bedrock asset. In production this is standard Contract / ServiceContract.",
        name_field_label="Contract Number",
        name_field_type="AutoNumber",
        name_field_format="BSC-{00000}",
        fields=[
            Field("Contract_Id__c", "Contract Id", "Text", length=20, required=True, unique=True, external_id=True),
            Field("Customer__c", "Customer", "Lookup", reference_to="Bedrock_Customer__c", required=True,
                  relationship_label="Service Contracts", relationship_name="Service_Contracts"),
            Field("Asset__c", "Asset", "Lookup", reference_to="Bedrock_Asset__c",
                  relationship_label="Service Contracts", relationship_name="Service_Contracts"),
            Field("Contract_Tier__c", "Contract Tier", "Picklist", picklist_values=CONTRACT_TIER),
            Field("Term_Months__c", "Term (Months)", "Number", precision=4, scale=0),
            Field("Start_Date__c", "Start Date", "Date"),
            Field("End_Date__c", "End Date", "Date"),
            Field("Annual_Value_USD__c", "Annual Value (USD)", "Currency", precision=12, scale=2,
                  description="ARR per asset; sum is the customer's contract spend."),
            Field("Status__c", "Status", "Picklist", picklist_values=CONTRACT_STATUS),
        ],
    ),
    CustomObject(
        api_name="Bedrock_Telemetry_Event__c",
        label="Bedrock Telemetry Event",
        plural="Bedrock Telemetry Events",
        description="A fault event from Bedrock Connect. In production this is a Data Cloud DLO fed by Kinesis.",
        name_field_label="Event Number",
        name_field_type="AutoNumber",
        name_field_format="BTE-{00000}",
        fields=[
            Field("Event_Id__c", "Event Id", "Text", length=40, required=True, unique=True, external_id=True),
            Field("Asset__c", "Asset", "Lookup", reference_to="Bedrock_Asset__c", required=True,
                  relationship_label="Telemetry Events", relationship_name="Telemetry_Events"),
            Field("Fault_Code__c", "Fault Code", "Text", length=20, required=True),
            Field("Severity__c", "Severity", "Picklist", picklist_values=SEVERITY, required=True),
            Field("Event_Timestamp__c", "Event Timestamp", "DateTime", required=True),
            Field("Resolution_Status__c", "Resolution Status", "Picklist", picklist_values=RESOLUTION, required=True),
            Field("Resolved_Timestamp__c", "Resolved Timestamp", "DateTime"),
            Field("RPM__c", "RPM", "Number", precision=6, scale=0),
            Field("Coolant_Temp_C__c", "Coolant Temp (C)", "Number", precision=5, scale=1),
            Field("Hydraulic_Pressure_PSI__c", "Hydraulic Pressure (PSI)", "Number", precision=6, scale=0),
            Field("Description__c", "Description", "LongTextArea", length=2000, visible_lines=4),
        ],
    ),
    CustomObject(
        api_name="Bedrock_KB_Section__c",
        label="Bedrock KB Section",
        plural="Bedrock KB Sections",
        description="A section of the Bedrock service knowledge base. In production this is Data Cloud Vector DB or Knowledge.",
        name_field_label="Section Title",
        name_field_type="Text",
        fields=[
            Field("Section_Number__c", "Section Number", "Number", precision=2, scale=0, required=True),
            Field("Body__c", "Body", "LongTextArea", length=32000, visible_lines=20, required=True),
            Field("Keywords__c", "Keywords", "LongTextArea", length=2000, visible_lines=3,
                  description="Space-separated keywords used by the retrieval action."),
        ],
    ),
    CustomObject(
        api_name="Bedrock_Service_Case__c",
        label="Bedrock Service Case",
        plural="Bedrock Service Cases",
        description="A service case opened by the agent. In production this is standard Case.",
        name_field_label="Case Number",
        name_field_type="AutoNumber",
        name_field_format="BSV-{00000}",
        fields=[
            Field("Subject__c", "Subject", "Text", length=255, required=True),
            Field("Description__c", "Description", "LongTextArea", length=4000, visible_lines=5),
            Field("Type__c", "Type", "Picklist", picklist_values=CASE_TYPE),
            Field("Priority__c", "Priority", "Picklist", picklist_values=CASE_PRIORITY),
            Field("Status__c", "Status", "Picklist", picklist_values=CASE_STATUS),
            Field("Origin__c", "Origin", "Picklist", picklist_values=CASE_ORIGIN),
            Field("Customer__c", "Customer", "Lookup", reference_to="Bedrock_Customer__c",
                  relationship_label="Service Cases", relationship_name="Service_Cases"),
            Field("Asset__c", "Asset", "Lookup", reference_to="Bedrock_Asset__c",
                  relationship_label="Service Cases", relationship_name="Service_Cases"),
            Field("Fault_Code__c", "Fault Code", "Text", length=20),
            Field("Source_Event_Id__c", "Source Event Id", "Text", length=40,
                  description="Optional pointer back to the triggering telemetry event."),
        ],
    ),
    CustomObject(
        api_name="Bedrock_Warranty_Claim__c",
        label="Bedrock Warranty Claim",
        plural="Bedrock Warranty Claims",
        description="A staged warranty claim. In production this stages to WARRANTY-7 via MuleSoft for service-manager review.",
        name_field_label="Claim Number",
        name_field_type="AutoNumber",
        name_field_format="BWC-{00000}",
        fields=[
            Field("Claim_Status__c", "Claim Status", "Picklist", picklist_values=CLAIM_STATUS, required=True),
            Field("Asset__c", "Asset", "Lookup", reference_to="Bedrock_Asset__c", required=True,
                  relationship_label="Warranty Claims", relationship_name="Warranty_Claims"),
            Field("Fault_Code__c", "Fault Code", "Text", length=20),
            Field("Service_Contract__c", "Service Contract", "Lookup", reference_to="Bedrock_Service_Contract__c",
                  relationship_label="Warranty Claims", relationship_name="Warranty_Claims"),
            Field("Estimated_Cost_USD__c", "Estimated Cost (USD)", "Currency", precision=12, scale=2),
            Field("Submitted_Timestamp__c", "Submitted Timestamp", "DateTime"),
            Field("Notes__c", "Notes", "LongTextArea", length=2000, visible_lines=4),
        ],
    ),
]


# ── XML emitters ─────────────────────────────────────────────────────
def _xml_object(o: CustomObject) -> str:
    if o.name_field_type == "AutoNumber":
        name_field_xml = f"""    <nameField>
        <displayFormat>{o.name_field_format}</displayFormat>
        <label>{o.name_field_label}</label>
        <type>AutoNumber</type>
    </nameField>"""
    else:
        name_field_xml = f"""    <nameField>
        <label>{o.name_field_label}</label>
        <type>Text</type>
    </nameField>"""

    return textwrap.dedent(f"""\
    <?xml version="1.0" encoding="UTF-8"?>
    <CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
        <deploymentStatus>Deployed</deploymentStatus>
        <description>{o.description}</description>
        <enableActivities>true</enableActivities>
        <enableHistory>false</enableHistory>
        <enableReports>true</enableReports>
        <enableSearch>true</enableSearch>
        <label>{o.label}</label>
    {name_field_xml}
        <pluralLabel>{o.plural}</pluralLabel>
        <sharingModel>ReadWrite</sharingModel>
    </CustomObject>
    """)


def _xml_field(f: Field) -> str:
    """
    Emit field XML with elements in alphabetical order (after fullName).

    Salesforce's metadata XML schema is order-sensitive — `required` must
    come before `type`, `valueSet` after `type`, and required Lookups need
    a `deleteConstraint`. This emitter respects all of that.
    """
    pairs: list[tuple[str, str]] = []  # body elements, will be sorted by key

    if f.description:
        pairs.append(("description", f.description))
    if f.external_id:
        pairs.append(("externalId", "true"))
    pairs.append(("label", f.label))

    if f.type == "Text":
        pairs.append(("length", str(f.length or 80)))
    elif f.type == "LongTextArea":
        pairs.append(("length", str(f.length or 32000)))

    if f.type in ("Number", "Currency"):
        pairs.append(("precision", str(f.precision or 9)))

    if f.type == "Lookup":
        # Required lookups MUST specify deleteConstraint.
        pairs.append(("deleteConstraint", "Restrict" if f.required else "SetNull"))
        pairs.append(("referenceTo", f.reference_to or ""))
        pairs.append(("relationshipLabel", f.relationship_label or ""))
        pairs.append(("relationshipName", f.relationship_name or ""))

    if f.required and f.type != "LongTextArea":
        pairs.append(("required", "true"))

    if f.type in ("Number", "Currency"):
        pairs.append(("scale", str(f.scale or 0)))

    pairs.append(("type", f.type))

    if f.unique and f.type in ("Text", "Number", "Email"):
        pairs.append(("unique", "true"))

    if f.type == "LongTextArea":
        pairs.append(("visibleLines", str(f.visible_lines or 4)))

    pairs.sort(key=lambda kv: kv[0])

    lines: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">',
        f"    <fullName>{f.api_name}</fullName>",
    ]
    # valueSet is alphabetically after `type` and `unique` but before `visibleLines`.
    # For Picklist we never have unique/visibleLines, so emit it right after type.
    inserted_value_set = False
    for k, v in pairs:
        lines.append(f"    <{k}>{v}</{k}>")
        if k == "type" and f.type == "Picklist" and not inserted_value_set:
            lines.append("    <valueSet>")
            lines.append("        <restricted>true</restricted>")
            lines.append("        <valueSetDefinition>")
            lines.append("            <sorted>false</sorted>")
            for pv in f.picklist_values:
                lines.append("            <value>")
                lines.append(f"                <fullName>{pv}</fullName>")
                lines.append(f"                <label>{pv}</label>")
                lines.append("                <default>false</default>")
                lines.append("            </value>")
            lines.append("        </valueSetDefinition>")
            lines.append("    </valueSet>")
            inserted_value_set = True

    lines.append("</CustomField>")
    lines.append("")
    return "\n".join(lines)


# ── Writer ───────────────────────────────────────────────────────────
def write_object(o: CustomObject) -> None:
    obj_dir = OBJ_DIR / o.api_name
    fields_dir = obj_dir / "fields"
    fields_dir.mkdir(parents=True, exist_ok=True)

    obj_path = obj_dir / f"{o.api_name}.object-meta.xml"
    obj_path.write_text(_xml_object(o), encoding="utf-8")
    print(f"  wrote {obj_path.relative_to(ROOT)}")

    for f in o.fields:
        path = fields_dir / f"{f.api_name}.field-meta.xml"
        path.write_text(_xml_field(f), encoding="utf-8")
        print(f"  wrote {path.relative_to(ROOT)}")


def write_permission_set() -> None:
    """Emit a permission set granting CRUD on every object + Read/Edit on every field + Apex access."""
    ps_path = ROOT / "force-app" / "main" / "default" / "permissionsets" / "Bedrock_Demo_Admin.permissionset-meta.xml"
    ps_path.parent.mkdir(parents=True, exist_ok=True)

    apex_classes = ["BedrockAssetContext", "BedrockKnowledge", "BedrockOpenCase", "BedrockStageWarranty"]

    lines: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">',
        '    <description>Full access to Bedrock demo objects, fields, Apex actions, and the Bedrock_Service_Triage agent. Assign before running the demo.</description>',
        '    <hasActivationRequired>false</hasActivationRequired>',
        '    <label>Bedrock Demo Admin</label>',
        '    <license>Salesforce</license>',
        # Agent access — required for the published agent to appear in the
        # Lightning Experience Einstein Copilot panel. Without this, users
        # who have Copilot enabled will not see the Bedrock agent in the list.
        '    <agentAccesses>',
        '        <agentName>Bedrock_Service_Triage</agentName>',
        '        <enabled>true</enabled>',
        '    </agentAccesses>',
    ]

    for cls in apex_classes:
        lines += [
            '    <classAccesses>',
            f'        <apexClass>{cls}</apexClass>',
            '        <enabled>true</enabled>',
            '    </classAccesses>',
        ]

    # Field-level security on every custom field — except required fields
    # (they always inherit object access) and lookup fields (which use
    # parent-object access). Salesforce rejects explicit FLS on required
    # fields with "You cannot deploy to a required field".
    fls_count = 0
    for o in OBJECTS:
        for f in o.fields:
            # Skip FLS only when the deployed XML actually marks the field
            # required — Salesforce rejects explicit FLS on required fields,
            # but LongTextArea fields can't be required in the XML schema and
            # so still need explicit FLS to be visible to the running user.
            if f.required and f.type != "LongTextArea":
                continue
            lines += [
                '    <fieldPermissions>',
                '        <editable>true</editable>',
                f'        <field>{o.api_name}.{f.api_name}</field>',
                '        <readable>true</readable>',
                '    </fieldPermissions>',
            ]
            fls_count += 1

    # Object-level permissions.
    for o in OBJECTS:
        lines += [
            '    <objectPermissions>',
            '        <allowCreate>true</allowCreate>',
            '        <allowDelete>true</allowDelete>',
            '        <allowEdit>true</allowEdit>',
            '        <allowRead>true</allowRead>',
            '        <modifyAllRecords>true</modifyAllRecords>',
            f'        <object>{o.api_name}</object>',
            '        <viewAllRecords>true</viewAllRecords>',
            '    </objectPermissions>',
        ]

    # Tab visibility — makes each object discoverable in the App Launcher.
    for o in OBJECTS:
        lines += [
            '    <tabSettings>',
            f'        <tab>{o.api_name}</tab>',
            '        <visibility>Visible</visibility>',
            '    </tabSettings>',
        ]

    lines += ['</PermissionSet>', '']
    ps_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  wrote {ps_path.relative_to(ROOT)} (FLS on {fls_count} fields)")


def main() -> None:
    print(f"writing metadata under {OBJ_DIR.relative_to(ROOT)}")
    for o in OBJECTS:
        print(f"\nObject: {o.api_name}")
        write_object(o)
    print()
    write_permission_set()
    print(f"\nDone. {len(OBJECTS)} objects, "
          f"{sum(len(o.fields) for o in OBJECTS)} fields.")


if __name__ == "__main__":
    main()
