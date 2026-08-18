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

When supplied, `channel` must be one of `line`, `x`, `instagram`, or `unknown`. When supplied, `direction` must be `inbound` or `outbound`.

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

### `GET /api/adapters/readiness`

Returns provider send readiness for LINE, X, and Instagram.

The endpoint must not return secret values. It returns only:

- requested delivery mode
- effective delivery mode
- per-channel readiness
- missing readiness blockers by key name
- adapter reference
- webhook signature secret readiness by key name only
- active provider rate-limit policy settings

Live provider send remains disabled unless credentials, webhook signature verification, rate-limit policy, and provider error mapping are configured.

### `GET /api/inbox`

Returns conversations for one workspace.

Required query:

- `workspaceId`

### `GET /api/dashboard`

Returns the operator dashboard snapshot for one workspace.

Required query:

- `workspaceId`

The snapshot joins inbox, same-person context, latest reply draft, latest SafetyCheck, send readiness, adapter status, and AI task boundaries. It is read-only and must not bypass the SafetyCheck send gate.

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
- `channel`

Missing or mismatched send confirmation scope or channel fails with `SEND_CONFIRMATION_REQUIRED` or `SEND_SCOPE_MISMATCH`.

The send request acts as original conversation channel confirmation and must match the stored conversation channel.

Already sent drafts fail with `REPLY_DRAFT_ALREADY_SENT`.

Successful responses include `sendDecision` audit evidence with the confirmed draft scope, confirmed original conversation `channel`, SafetyCheck id, content hash, and the send gate checks that passed. The `sendDecision.channel` value is written when the decision is recorded.

The send route resolves the matching `ChannelIdentity` and calls the channel adapter only after the SafetyCheck gate passes. Current adapter delivery is `dry_run`; live provider delivery remains disabled until credentials and provider error handling are configured.

Response includes:

- `adapterDelivery.accepted`
- `adapterDelivery.deliveryMode`
- `adapterDelivery.adapterReference`
- `adapterDelivery.idempotencyKey`
- `adapterDelivery.externalMessageId`
- `sendDecision.adapterDelivery`

If no matching channel identity exists, the route returns `CHANNEL_IDENTITY_REQUIRED`.

Must emit:

- `communication.message.sent.v1`

### `GET /api/reply-drafts/{replyDraftId}/send-decisions`

Returns stored send decision audit history for one reply draft.

Path fields:

- `replyDraftId`

Query fields:

- `workspaceId`
- `personId`
- `conversationId`

The request scope must match the draft's `workspaceId + personId + conversationId`. The response must include only `ReplySendDecision` records scoped to the requested draft and confirmed request scope. Stored decisions include the channel that was confirmed at send time and adapter delivery evidence.
