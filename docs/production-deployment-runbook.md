# Production Deployment Runbook

This runbook tracks the remaining production rollout steps for Communication Planner.

## Current State

As of 2026-08-25:

- Latest verified GitHub main checkpoint before this runbook refresh is `ceb412be133772ce927eedc808831d72e652cb00`.
- Local dependency-free `node --test` contract coverage passes with 50 tests across 15 suites.
- Full dependency install, typecheck, and dependency-backed tests have not completed in the scratch workspace because npm attempts to create `/root/.npm` under the active sandbox.
- A hosted project has not been linked or verified from this workspace.
- Provider secrets and provider verification evidence have not been supplied. Provider sends remain `dry_run` by default.

## 1. Create Or Link Vercel Project

Create a Vercel project named `communication-planner` and link it to:

- Repository: `karukimori-wq/Communication-Planner`
- Branch: `main`
- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`

Expected production URL format:

- `https://communication-planner.vercel.app`, or
- the URL assigned by the linked Vercel project

Record the final URL as `COMMUNICATION_PLANNER_BASE_URL` in Platform Admin after endpoint checks pass.

## 2. Configure Production Environment Variables

Start with safe dry-run delivery:

```text
COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE=dry_run
COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION=disabled
COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY=enabled
COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_WINDOW_MS=60000
COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_MAX=60
COMMUNICATION_PLANNER_PROVIDER_ERROR_MAPPING=enabled
LINE_PROVIDER_INBOUND_VERIFIED=disabled
LINE_PROVIDER_OUTBOUND_VERIFIED=disabled
X_PROVIDER_INBOUND_VERIFIED=disabled
X_PROVIDER_OUTBOUND_VERIFIED=disabled
INSTAGRAM_PROVIDER_INBOUND_VERIFIED=disabled
INSTAGRAM_PROVIDER_OUTBOUND_VERIFIED=disabled
```

Only switch to live delivery after provider credentials, webhook signatures, provider-specific inbound/outbound verification, rate-limit policy, and provider error mapping are configured:

```text
COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE=live
COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION=enabled
```

Required provider credentials and verification flags are listed in `.env.example` and `docs/production-adapter-readiness.md`.

## 3. Verify Production Endpoints

Run these checks against the finalized production URL:

```bash
BASE_URL="https://communication-planner.vercel.app"

curl -sS "$BASE_URL/health"
curl -sS "$BASE_URL/version"
curl -sS "$BASE_URL/contracts/status"
curl -sS "$BASE_URL/api/adapters/readiness"
curl -sS "$BASE_URL/api/contracts/endpoints"
```

Expected minimum result:

- `/health` returns HTTP 200 and `status: "success"`.
- `/version` returns HTTP 200 with build metadata.
- `/contracts/status` returns `status: "success"` and no ownership boundary issues.
- `/api/adapters/readiness` returns provider readiness without exposing secret values.
- `/api/contracts/endpoints` returns implemented endpoint metadata for Platform Admin.

## 4. Register Runtime URL In Platform Admin

After production endpoint checks pass, register:

```text
COMMUNICATION_PLANNER_BASE_URL=<final production URL>
```

Platform Admin must monitor:

- `GET {COMMUNICATION_PLANNER_BASE_URL}/health`
- `GET {COMMUNICATION_PLANNER_BASE_URL}/version`
- `GET {COMMUNICATION_PLANNER_BASE_URL}/contracts/status`
- `GET {COMMUNICATION_PLANNER_BASE_URL}/api/adapters/readiness`

## 5. Run LINE/X/Instagram Live E2E

Do not run live E2E until the following are complete:

- Provider credentials are configured in production.
- Provider webhook callback URLs point at production.
- `COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION=enabled`.
- `COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE=live`.
- Provider-specific inbound/outbound verification flags are enabled for each target channel.
- Rate limit policy and provider error mapping are enabled.

Live E2E must verify:

- inbound webhook normalization
- signature rejection for missing or invalid signatures
- message ingestion idempotency
- reply draft SafetyCheck gate
- original conversation channel preservation
- sendDecision adapter delivery evidence
