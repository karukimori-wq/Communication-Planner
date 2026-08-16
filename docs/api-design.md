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

## Endpoint Contract Metadata

Communication Planner exposes endpoint-level contract metadata for Platform Admin and integration checks.

### `GET /api/contracts/endpoints`

Returns:

- `appName`
- `contractVersion`
- `endpoints`
- `implementedCount`
- `plannedCount`

Each endpoint contract includes:

- `method`
- `path`
- `operation`
- `status`
- `requiredFields`
- `prohibitedPayloadFields`
- `eventName`
- `sourceOfTruth`
- `safetyRules`

This metadata must not introduce ownership of Customer master, Lead lifecycle, Reservation, Payment, Sales/Revenue, SNS PostDraft, Numeria Report, Velvet Memory, or AI Usage.

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
- `endpointContractCount`
- `implementedEndpointCount`
- `endpointContractsPath`
- `issues`
- `timestamp`

### `POST /api/channel-events/messages`

Ingests incoming or outgoing message events from channel adapters.

Optional context insight fields:

- `topics`
- `promises`
- `nextActions`

When supplied, these fields are stored as Communication Planner-owned person-scoped context records tied to the ingested message. They must not contain Customer master, Reservation, Payment, Sales, or external app source-of-truth data.

Must emit one of:

- `communication.message.received.v1`
- `communication.message.sent.v1`

### `POST /api/adapters/line/webhook`

Ingests a LINE Harness-compatible webhook payload, normalizes it through the LINE adapter, and stores an inbound Communication Planner message.

Required provider data:

- `workspaceId`
- `externalUserId`, `userId`, or source user id
- `body`, `text`, or provider message text

Must emit:

- `communication.message.received.v1`

### `POST /api/adapters/x/webhook`

Ingests an X Harness-compatible webhook payload, normalizes it through the X adapter, and stores an inbound Communication Planner message.

Required provider data:

- `workspaceId`
- `externalUserId`, `senderId`, or sender user id
- `body`, `text`, or provider message text

Must emit:

- `communication.message.received.v1`

### `POST /api/adapters/instagram/webhook`

Ingests an Instagram Harness-compatible webhook payload, normalizes it through the Instagram adapter, and stores an inbound Communication Planner message.

Required provider data:

- `workspaceId`
- `externalUserId`, `senderId`, or sender user id
- `body`, `text`, or provider message text

Must emit:

- `communication.message.received.v1`

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

When `body` is omitted, the draft body is composed from the same person's `ConversationContext`, `Topic`, `Promise`, and `CommunicationNextAction` records. It must not use context insight records from another `personId`.

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
