# Testing

Communication Planner includes lightweight contract guards for the MVP.

## Commands

```bash
npm ci
npm test
npm run build
```

`npm test` runs Node's built-in test runner against `tests/*.test.mjs`.

## CI

GitHub Actions runs the same verification on pushes to `main` and on pull requests:

1. `npm ci`
2. `npm test`
3. `npm run build`

The workflow is defined in `.github/workflows/ci.yml`.

## Current Coverage

The current test suite verifies that:

- Communication Planner ownership exclusions remain documented.
- Reply draft creation stays scoped to `workspaceId + personId + conversationId`.
- Reply draft updates refresh content hash and force a new SafetyCheck.
- Send requires a current passing SafetyCheck.
- Stale or failed SafetyCheck logic remains present.
- Successful sends expose `sendDecision` audit evidence for the passed gate checks.
- Send decisions are stored as reply-draft-scoped audit history.
- Outbound sends use the original conversation channel.
- Endpoint-level contract metadata remains available.
- Harness-compatible LINE/X/Instagram webhook examples stay parseable and aligned with implemented routes.
- LINE/X/Instagram webhook normalizer behavior maps example payload shapes into provider inbound events.
- Adapter webhook responses do not echo raw provider payloads.
- Provider message ingestion is idempotent by `workspaceId + channel + direction + externalMessageId`.
- Adapter webhook error codes remain documented and implemented.
- CORS and `OPTIONS` preflight support remain present.

These tests are intentionally dependency-free so they can run in restricted CI and local environments.

## Next Test Expansion

The next layer should add route-level request/response tests for:

- `GET /api/contracts/endpoints`
- `POST /api/channel-events/messages`
- `POST /api/adapters/line/webhook`
- `POST /api/adapters/x/webhook`
- `POST /api/adapters/instagram/webhook`
- `POST /api/conversations/{conversationId}/reply-drafts`
- `PATCH /api/reply-drafts/{replyDraftId}`
- `POST /api/reply-drafts/{replyDraftId}/safety-check`
- `POST /api/reply-drafts/{replyDraftId}/send`
- `GET /api/reply-drafts/{replyDraftId}/send-decisions?workspaceId=&personId=&conversationId=`

Route-level tests should verify response envelopes, trace headers, correlation IDs, event names, and error codes.
