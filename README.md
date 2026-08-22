# Communication Planner

Communication Planner is a 1-to-1 communication management app for professionals who handle many customer conversations across LINE, Instagram DM, and X DM. Its primary product requirement is anti-misdelivery: never mix one person's context into another person's reply, and never send a checked draft to the wrong person, conversation, or channel.

## MVP status

The application is now in production-readiness verification on Cloudflare Workers + D1.

Implemented and covered by automated contracts:

- Unified Inbox and Communication Person projection
- ChannelIdentity / Conversation / Message ingestion
- person-scoped ConversationContext / Topic / Promise / NextAction
- ReplyDraft create and update
- SafetyCheck with SHA-256 checked-content hash
- stale SafetyCheck rejection after draft edits
- workspace + person + conversation send scope enforcement
- original-channel confirmation
- provider adapter gate and idempotency
- outbound Message + immutable SendDecision persistence
- duplicate inbound and duplicate send protection
- D1-backed operator Dashboard (Inbox, Context, latest Draft, Safety state, Send history)
- explicit UI recipient/context/channel confirmations before send
- Cloudflare Production E2E for D1 persistence and anti-misdelivery boundaries

Production verification covers Person A / Person B isolation, cross-person SafetyCheck rejection, wrong-channel rejection, stale-check rejection, successful send, duplicate-send rejection, and direct D1 audit verification.

## Source of Truth

Communication Planner owns Unified Inbox, Communication Person projection, ChannelIdentity, Conversation, Message, ConversationContext, Topic, Promise, Communication NextAction, ReplyDraft, SafetyCheck, and ChannelAdapter integration state.

It must not become source of truth for Customer master, Lead lifecycle, Reservation, Payment, Sales / Revenue, SNS PostDraft, Numeria Report, Velvet Professional Memory, or AI Usage.

## MVP endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health |
| GET | `/version` | Version metadata |
| GET | `/contracts/status` | Contract readiness |
| GET | `/api/contracts/endpoints` | Endpoint catalog |
| POST | `/api/channel-events/messages` | Scoped channel message ingestion |
| POST | `/api/adapters/{line,x,instagram}/webhook` | Provider webhook normalization |
| GET | `/api/inbox` | Unified inbox |
| GET | `/api/persons/{personId}` | Person projection |
| GET | `/api/persons/{personId}/conversations` | Person conversations |
| GET | `/api/persons/{personId}/context` | Person-only context |
| POST | `/api/conversations/{conversationId}/reply-drafts` | Create reply draft |
| PATCH | `/api/reply-drafts/{replyDraftId}` | Update reply draft |
| POST | `/api/reply-drafts/{replyDraftId}/safety-check` | Persist SafetyCheck + content hash |
| POST | `/api/reply-drafts/{replyDraftId}/send` | Guarded send |
| GET | `/api/reply-drafts/{replyDraftId}/send-decisions` | Scoped audit history |
| GET | `/api/dashboard?workspaceId=` | D1-backed operator projection |

## Stable events

- `communication.message.received.v1`
- `communication.message.sent.v1`
- `communication.context.updated.v1`
- `communication.promise.created.v1`
- `communication.next_action.created.v1`
- `communication.reply_draft.created.v1`
- `communication.reply_draft.updated.v1`
- `communication.reply_safety.checked.v1`
- `communication.person_channel.linked.v1`

## Non-negotiable safety rules

1. Reply work requires `workspaceId + personId + conversationId`.
2. Context retrieval is `workspaceId + personId` only.
3. Another person's context must never enter the selected person's Dashboard or reply flow.
4. Send requires a current passing SafetyCheck for the exact saved draft content hash.
5. Editing a checked draft makes the SafetyCheck stale and send must fail.
6. The confirmed channel must equal the original Conversation channel.
7. A sent ReplyDraft cannot be sent again.
8. Successful sends persist outbound Message and SendDecision audit evidence.
9. UI confirmation never replaces API/D1 enforcement; both layers must guard the send.

## Runtime

Production target: Cloudflare Workers + D1. The Production workflow applies schema/migrations, deploys, checks health and persistence readiness, creates isolated E2E people/conversations, validates Dashboard person isolation, exercises guarded send failures and a successful send, then queries remote D1 audit records.

## OSS strategy

Chatwoot is a reference for unified-inbox operation patterns. LINE Harness, X Harness, and IG Harness are references for provider adapter/webhook patterns. OSS reuse never overrides Communication Planner ownership or safety boundaries.

## Documentation

See `docs/product-brief.md`, `docs/domain-model.md`, `docs/api-design.md`, `docs/events.md`, `docs/safety-rules.md`, `docs/operator-dashboard.md`, `docs/channel-adapters.md`, `docs/database-schema.md`, and `docs/testing.md`.
