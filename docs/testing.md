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
- Send requires a current passing SafetyCheck.
- Stale or failed SafetyCheck logic remains present.
- Outbound sends use the original conversation channel.
- CORS and `OPTIONS` preflight support remain present.

These tests are intentionally dependency-free so they can run in restricted CI and local environments.

## Next Test Expansion

The next layer should add route-level request/response tests for:

- `POST /api/channel-events/messages`
- `POST /api/conversations/{conversationId}/reply-drafts`
- `POST /api/reply-drafts/{replyDraftId}/safety-check`
- `POST /api/reply-drafts/{replyDraftId}/send`

Route-level tests should verify response envelopes, trace headers, correlation IDs, event names, and error codes.
