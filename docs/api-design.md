# Communication Planner API Design

## Contract Endpoints

### `GET /health`

Returns service health with shared platform status vocabulary.

Must not return business-owned records.

### `GET /version`

Returns build metadata.

### `GET /contracts/status`

Returns contract readiness status for Platform Admin.

### `GET /api/contracts/endpoints`

Returns endpoint-level contract metadata.

This endpoint is used by Platform Admin and integration checks to verify:

- implemented endpoint paths
- required fields
- prohibited owned payload fields
- event names
- source-of-truth boundaries
- safety rules

## MVP API

### `POST /api/channel-events/messages`

Ingests normalized message events from channel adapters.

Required fields:

- `workspaceId`
- `externalUserId`
- `body`

Optional fields:

- `channel`
- `personId`
- `conversationId`
- `externalMessageId`
- `externalThreadId`
- `displayName`
- `direction`
- `topics`
- `promises`
- `nextActions`

When supplied, these fields are stored as Communication Planner-owned person-scoped context records tied to the ingested message. They must not contain Customer master, Reservation, Payment, Sales, or external app source-of-truth data.

Must emit:

- `communication.message.received.v1` for inbound messages
- `communication.message.sent.v1` for outbound messages

### `POST /api/adapters/line/webhook`

Accepts LINE Harness-compatible webhook payloads and normalizes them into `POST /api/channel-events/messages` input.

Required normalized fields:

- `workspaceId`
- `externalUserId`, `userId`, or source user id
- `body`, `text`, or nested message text

The endpoint returns normalized Communication Planner records and does not echo the raw provider payload.

Must emit:

- `communication.message.received.v1`

### `POST /api/adapters/x/webhook`

Accepts X Harness-compatible webhook payloads and normalizes them into `POST /api/channel-events/messages` input.

Required normalized fields:

- `workspaceId`
- `externalUserId`, `senderId`, or sender user id
- `body`, `text`, or nested message text

The endpoint returns normalized Communication Planner records and does not echo the raw provider payload.

Must emit:

- `communication.message.received.v1`

### `POST /api/adapters/instagram/webhook`

Accepts Instagram Harness-compatible webhook payloads and normalizes them into `POST /api/channel-events/messages` input.

Required normalized fields:

- `workspaceId`
- `externalUserId`, `senderId`, or sender user id
- `body`, `text`, or nested message text

The endpoint returns normalized Communication Planner records and does not echo the raw provider payload.

Must emit:

- `communication.message.received.v1`

### `GET /api/inbox`

Returns conversations for one workspace.

Required query:

- `workspaceId`

### `GET /api/persons/{personId}`

Returns Communication Person projection.

Required query:

- `workspaceId`

### `GET /api/persons/{personId}/conversations`

Returns conversations for a Communication Person.

Required query:

- `workspaceId`

### `GET /api/persons/{personId}/context`

Returns person-scoped communication context.

Required query:

- `workspaceId`

The returned context must be scoped by `workspaceId + personId` and must not include context from any other person.

### `POST /api/conversations/{conversationId}/reply-drafts`

Creates a reply draft for a specific person and conversation.

Required body fields:

- `workspaceId`
- `personId`
- `purpose`

Path fields:

- `conversationId`

If `body` is omitted, the draft may be composed from same-person context insights only. Generated reply drafts must not use context insight records from another `personId`.

Must emit:

- `communication.reply_draft.created.v1`

### `PATCH /api/reply-drafts/{replyDraftId}`

Updates an unsent reply draft.

Required body fields:

- `workspaceId`
- `personId`
- `conversationId`
- `body` or `purpose`

The request scope must match the draft's `workspaceId + personId + conversationId`. Updating `body` refreshes `contentHash`, resets the draft status to `draft`, and requires a new SafetyCheck before send. Sent drafts cannot be updated.

Must emit:

- `communication.reply_draft.updated.v1`

### `POST /api/reply-drafts/{replyDraftId}/safety-check`

Creates a safety check for a reply draft.

Required body fields:

- `workspaceId`
- `personId`
- `conversationId`

Missing or mismatched scope fields force the SafetyCheck to `failed`.

Must emit:

- `communication.reply_safety.checked.v1`

### `POST /api/reply-drafts/{replyDraftId}/send`

Sends a reply draft only when the latest SafetyCheck has passed.

Required body fields:

- `workspaceId`
- `personId`
- `conversationId`

Missing or mismatched send confirmation scope fails with `SEND_CONFIRMATION_REQUIRED` or `SEND_SCOPE_MISMATCH`.

Already sent drafts fail with `REPLY_DRAFT_ALREADY_SENT`.

Successful responses include `sendDecision` audit evidence with the confirmed draft scope, SafetyCheck id, content hash, and the send gate checks that passed.

Must emit:

- `communication.message.sent.v1`

### `GET /api/reply-drafts/{replyDraftId}/send-decisions`

Returns stored send decision audit history for one reply draft.

Path fields:

- `replyDraftId`

The response must include only `ReplySendDecision` records scoped to the requested draft.
