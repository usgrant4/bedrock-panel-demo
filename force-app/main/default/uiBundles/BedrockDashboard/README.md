# BedrockDashboard — headless agent surface

A Vite/React/TypeScript SPA (Tailwind + shadcn/ui) with Vercel serverless
functions. It is the off-platform proof that the Bedrock agent layer is
headless: it reads Salesforce records over REST and invokes the
`Bedrock_Customer_Service` agent over the public Agentforce Agent API, with no
Salesforce dependency in the browser.

Live: https://bedrock-dashboard-sand.vercel.app/triage

Architecture rationale: [docs/architecture.md Section 6](../../../../../docs/architecture.md#6-off-platform-consumer-surface--the-headless-agent-layer).

Scaffolded from the Salesforce *Base React App* UI Bundle template, which is
why `package.json` is still named `base-react-app` and
[CHANGELOG.md](CHANGELOG.md) is the template's upstream changelog, not this
app's history.

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/inventory` | Asset inventory |
| `/asset-360` | Asset 360 detail |
| `/triage` | **Triage Console** — embedded agent chat plus live Cases / Warranty Claims rails. The demo page. |
| `/architecture` | Architecture diagram and Salesforce translation |

## Serverless functions (`api/`)

| Function | Purpose |
|---|---|
| `_sf-client.ts` | Mints a JWT access token via OAuth Client Credentials and caches it for the lambda lifetime; runs SOQL against `/services/data/v66.0/query/` |
| `recent-cases.ts`, `recent-claims.ts` | Read path — the rails poll these every 10 s |
| `agent-session.ts` | Opens an Agent API session. Uses `AGENT_ID_CUSTOMER` when the client asks for the customer agent, `AGENT_ID` otherwise |
| `agent-message.ts` | Sends a message on an open session (synchronous request/response) |
| `oauth-callback.ts` | **Legacy.** One-time web-server-flow helper from an earlier refresh-token setup. The Agent API rejects those opaque tokens, so the live app does not use it |

## Environment variables

Set in the Vercel project (Production). Preview deployments have no Salesforce
credentials, so their API routes do not work.

| Var | Purpose |
|---|---|
| `SF_INSTANCE_URL` | Org My Domain URL |
| `SF_CLIENT_ID` / `SF_CLIENT_SECRET` | `Bedrock_Dashboard_OAuth` Connected App consumer key and secret |
| `AGENT_ID_CUSTOMER` | Bot Id of `Bedrock_Customer_Service`, the agent the chat invokes |
| `AGENT_ID` | Bot Id of `Bedrock_Service_Triage`. Unused in practice, because Employee Agents are not reachable over the public Agent API |
| `AGENT_API_BASE` | Optional; defaults to `https://api.salesforce.com` |

Find Bot Ids with `sf apex run --target-org SForg --file tools/find_agent_ids.apex`
from the repo root.

## Run locally

```powershell
npm install
npm run dev        # Vite dev server, http://localhost:5173
```

`npm run dev` serves the SPA only. The `api/` functions need `npx vercel dev`
and the environment variables above.

## Deploy

**A push to `main` deploys production.** The `bedrock-dashboard` Vercel
project is git-linked with Root Directory set to this folder, and a successful
build moves the `bedrock-dashboard-sand` alias. A manual deploy from this
folder also works:

```powershell
npm run build
npx vercel --prod
```

Roll back with `npx vercel rollback <previous-deployment-url>`.

To deploy as a Salesforce UI Bundle on a Digital Experiences site instead,
enable Digital Experiences and the UI Bundle Beta in Setup first, then
build and run `sf project deploy start --source-dir force-app/main/default/uiBundles --target-org SForg`
from the repo root.

## Test

```powershell
npm run test       # Vitest unit tests
npm run lint
```
