"""
Load Bedrock_KB_Section__c records into the BedrockDemo scratch org.

Reads ``data/sample/bedrock_knowledge_base.md``, splits into sections, and
runs an anonymous Apex script that does the insert. Bypasses the bulk API
quirks with multi-line markdown bodies.

Run::

    python tools/load_kb.py
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "data" / "sample" / "bedrock_knowledge_base.md"


def parse_sections() -> list[dict]:
    text = KB.read_text(encoding="utf-8")
    pattern = re.compile(r"^##\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    rows: list[dict] = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        m2 = re.match(r"^(\d+)\.\s*(.+)$", title)
        if m2:
            num = int(m2.group(1))
            short = m2.group(2).strip()
        else:
            num = i + 1
            short = title
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[body_start:body_end].strip()
        cleaned = re.sub(r"[^A-Za-z0-9 ]", " ", body)
        keywords = " ".join(sorted({w.lower() for w in cleaned.split() if len(w) >= 4}))[:1900]
        rows.append({
            "Name": short[:80],
            "Section_Number__c": num,
            "Body__c": body[:31500],
            "Keywords__c": keywords,
        })
    return rows


def build_apex(rows: list[dict]) -> str:
    payload = json.dumps(rows)
    # Apex single-quote escaping of the JSON literal.
    apex_payload = payload.replace("\\", "\\\\").replace("'", "\\'")
    return f"""
String kbJson = '{apex_payload}';
List<Bedrock_KB_Section__c> sections = (List<Bedrock_KB_Section__c>) JSON.deserialize(kbJson, List<Bedrock_KB_Section__c>.class);
// Idempotent: delete any existing sections by name before re-inserting.
Set<String> names = new Set<String>();
for (Bedrock_KB_Section__c s : sections) names.add(s.Name);
delete [SELECT Id FROM Bedrock_KB_Section__c WHERE Name IN :names];
insert sections;
System.debug('LOADED ' + sections.size() + ' KB sections');
"""


def main() -> None:
    rows = parse_sections()
    print(f"parsed {len(rows)} sections from {KB.relative_to(ROOT)}")
    apex = build_apex(rows)

    with tempfile.NamedTemporaryFile("w", suffix=".apex", delete=False, encoding="utf-8") as f:
        f.write(apex)
        apex_path = Path(f.name)

    try:
        import os
        target_org = os.environ.get("BEDROCK_DEMO_ORG", "SForg")
        result = subprocess.run(
            ["sf", "apex", "run", "--target-org", target_org, "--file", str(apex_path)],
            capture_output=True, text=True, shell=True,
        )
        print(result.stdout[-1500:] if result.stdout else "")
        print(result.stderr[-500:] if result.stderr else "")
        if "LOADED" not in (result.stdout or ""):
            sys.exit("KB load did not report success — check the trace above.")
    finally:
        apex_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
