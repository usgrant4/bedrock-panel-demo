"""
Send an utterance to the Bedrock_Service_Triage agent preview session.

The Salesforce CLI's `sf agent preview send` has Windows-shell quoting
issues with utterances that contain spaces or punctuation. Python's
subprocess.run with shell=False sidesteps that by passing argv as a list,
which avoids the shell's word-splitting entirely.

Usage::

    python tools/agent_chat.py <session-id> <utterance>
    python tools/agent_chat.py --start                # start a new session
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys

AGENT = "Bedrock_Service_Triage"
ORG = "SForg"


def run(args: list[str]) -> dict:
    import shutil
    sf = shutil.which("sf") or shutil.which("sf.cmd") or "sf"
    proc = subprocess.run(
        [sf] + args,
        capture_output=True, text=True, encoding="utf-8", shell=False,
    )
    if proc.returncode != 0 and not proc.stdout.startswith("{"):
        raise RuntimeError(f"sf failed (exit {proc.returncode}):\n{proc.stderr or proc.stdout}")
    return json.loads(proc.stdout)


def start_session() -> str:
    r = run([
        "agent", "preview", "start", "--json",
        "--use-live-actions",
        "--authoring-bundle", AGENT,
        "--target-org", ORG,
    ])
    sid = r["result"]["sessionId"]
    print(f"session started: {sid}")
    return sid


def send(session_id: str, utterance: str) -> None:
    r = run([
        "agent", "preview", "send", "--json",
        "--authoring-bundle", AGENT,
        "--target-org", ORG,
        "--session-id", session_id,
        "--utterance", utterance,
    ])
    res = r.get("result") or {}
    print(f"\n>>> USER: {utterance}\n")
    for m in res.get("messages", []):
        kind = m.get("type") or "?"
        msg = m.get("message", "")
        cited = m.get("citedReferences") or []
        results = m.get("result") or []
        print(f"--- [{kind}] ---")
        if msg:
            print(msg)
        if results:
            print(f"[{len(results)} tool results]")
            for tr in results:
                # Each tool result is a dict; truncate aggressively.
                s = json.dumps(tr, indent=2, default=str)
                print(s[:1200])
        if cited:
            print(f"citations: {cited}")
        print()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("session_id", nargs="?")
    ap.add_argument("utterance", nargs="?")
    ap.add_argument("--start", action="store_true")
    args = ap.parse_args()

    if args.start:
        start_session()
        return
    if not args.session_id or not args.utterance:
        sys.exit("Usage: agent_chat.py <session-id> <utterance>  OR  agent_chat.py --start")
    send(args.session_id, args.utterance)


if __name__ == "__main__":
    main()
