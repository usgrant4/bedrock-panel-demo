# Data

The demo runs out of the box against `data/sample/` (plausible synthetic data
including Pinnacle Mining as the demo customer).

When you have the real briefing assets, drop them at the top level of `data/`:

- `customers.csv`
- `assets.csv`
- `telemetry_events.csv`
- `service_contracts.csv`
- `bedrock_knowledge_base.pdf`

The data loader checks the top-level files first and falls back to `sample/`
if a file is missing — you can mix-and-match while the briefing assets are
landing.

The `.gitignore` keeps real CSVs and PDFs out of source control. Sample data
stays committed.
