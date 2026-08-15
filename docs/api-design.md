# Communication Planner API Design

## Common Headers

| Header | Required | Purpose |
| --- | --- | --- |
| `X-Trace-Id` | Recommended | Request trace |
| `X-Correlation-Id` | Recommended | Cross-app correlation |
| `X-Source-App` | Recommended | Calling app |

## Common Status Values

API responses should use the platform status vocabulary:

- `success`
- `warning`
- `error`
- `skipped`

## Endpoints

### `GET /health`

Returns service health.

### `GET /version`

Returns app version and build metadata.

### `GET /contracts/status`

Returns contract readiness.

Required response fields:

- `appName`
- `status`
- `contractVersion`
- `identityMode`
- `professionalIdRequired`
- `usesLegacyEventNames`
- `usesReportTerminology`
- `canonicalOwnershipChecked`
- `issues`
- `timestamp`

### `POST /api/channel-events/messages`

Ingests incoming or outgoing message events from channel adapters.

Must emit one of:

- `communication.message.received.v1`
- `communication.message.sent.v1`

### `GET /api/inbox`

Returns unified inbox items scoped by workspace.

### `GET /api/persons/{personId}`

Returns Communication Person projection.

### `GET /api/persons/{personId}/conversations`

Returns conversations for one person only.

### `GET /api/persons/{personId}/context`

Returns context for `workspaceId + personId`.

This endpoint must not accept arbitrary conversation context from another person.

### `POST /api/conversations/{conversationId}/reply-drafts`

Creates a reply draft.

Required fields:

- `workspaceId`
- `personId`
- `conversationId`
- `purpose`

Must reject requests missing `personId` or `conversationId`.

Must emit:

- `communication.reply_draft.created.v1`

### `POST /api/reply-drafts/{replyDraftId}/safety-check`

Creates a safety check for a reply draft.

Must emit:

- `communication.reply_safety.checked.v1`

### `POST /api/reply-drafts/{replyDraftId}/send`

Sends a reply draft only when the latest SafetyCheck has passed.

Must emit:

- `communication.message.sent.v1`
