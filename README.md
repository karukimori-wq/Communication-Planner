# Communication Planner

Communication Planner is a 1-to-1 communication management app for professionals who handle many customer conversations across channels such as LINE, Instagram DM, and X DM.

It is not an SNS posting tool. SNS Planner owns 1-to-many post creation. Communication Planner owns the operational surface for individual conversations, context, reply drafts, safety checks, and channel adapter state.

## Product Goal

The primary goal is to prevent wrong-context replies and accidental sends when a user is communicating with many people at the same time.

Communication Planner helps the user answer:

- Who is this person?
- What conversation is this reply for?
- What context is safe to use for this person?
- What promise or next action exists?
- Has this reply passed safety checks before sending?

## Implementation Status

The first MVP implementation is in place with Next.js and TypeScript.

Implemented:

- `GET /health`
- `GET /version`
- `GET /contracts/status`
- `GET /api/contracts/endpoints`
- `POST /api/channel-events/messages`
- `POST /api/adapters/line/webhook`
- `POST /api/adapters/x/webhook`
- `POST /api/adapters/instagram/webhook`
- `GET /api/inbox`
- `GET /api/persons/{personId}`
- `GET /api/persons/{personId}/conversations`
- `GET /api/persons/{personId}/context`
- `POST /api/conversations/{conversationId}/reply-drafts`
- `PATCH /api/reply-drafts/{replyDraftId}`
- `POST /api/reply-drafts/{replyDraftId}/safety-check`
- `POST /api/reply-drafts/{replyDraftId}/send`
- `GET /api/reply-drafts/{replyDraftId}/send-decisions`
- CORS headers and `OPTIONS` preflight handling for API routes
- LINE/X/Instagram adapter stubs
- PostgreSQL-oriented initial schema in `db/schema.sql`
- Dependency-free contract tests in `tests/static-contracts.test.mjs`
- GitHub Actions CI for test and build verification

See [docs/local-api-check.md](docs/local-api-check.md) for local API checks and [docs/testing.md](docs/testing.md) for test coverage.

## OSS Strategy

Communication Planner should use proven OSS from GitHub where it helps development speed and safety.

Initial references:

- Chatwoot for unified inbox and conversation operation patterns.
- LINE Harness for LINE adapter and webhook patterns.
- X Harness for X channel and DM adapter patterns.
- IG Harness for Instagram DM adapter patterns.

The Harness repositories are primary references for channel adapters. See [docs/channel-adapters.md](docs/channel-adapters.md).

OSS reuse must not override Communication Planner ownership boundaries. See [docs/oss-adoption.md](docs/oss-adoption.md).

## Source of Truth

Communication Planner is the source of truth for:

- Unified Inbox
- Communication Person projection
- ChannelIdentity
- Conversation
- Message
- ConversationContext
- Topic
- Promise
- Communication NextAction
- ReplyDraft
- SafetyCheck
- ChannelAdapter integration state

Communication Planner must not become the source of truth for:

- Customer master
- Lead lifecycle
- Reservation
- Payment
- Sales / Revenue
- SNS PostDraft
- Numeria Report
- Velvet Professional Memory
- AI Usage

## MVP Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service health |
| GET | `/version` | Build and version metadata |
| GET | `/contracts/status` | Contract readiness status |
| GET | `/api/contracts/endpoints` | Endpoint-level contract metadata |
| POST | `/api/channel-events/messages` | Ingest message events from channel adapters |
| GET | `/api/inbox` | Unified inbox |
| GET | `/api/persons/{personId}` | Person projection |
| GET | `/api/persons/{personId}/conversations` | Person-scoped conversations |
| GET | `/api/persons/{personId}/context` | Person-scoped context |
| POST | `/api/conversations/{conversationId}/reply-drafts` | Create reply draft |
| PATCH | `/api/reply-drafts/{replyDraftId}` | Update reply draft |
| POST | `/api/reply-drafts/{replyDraftId}/safety-check` | Check reply safety |
| POST | `/api/reply-drafts/{replyDraftId}/send` | Send checked reply |
| GET | `/api/reply-drafts/{replyDraftId}/send-decisions` | Send decision history |
| OPTIONS | `/api/*`, `/health`, `/version`, `/contracts/status` | CORS preflight |

## Stable Events

- `communication.message.received.v1`
- `communication.message.sent.v1`
- `communication.context.updated.v1`
- `communication.promise.created.v1`
- `communication.next_action.created.v1`
- `communication.reply_draft.created.v1`
- `communication.reply_draft.updated.v1`
- `communication.reply_safety.checked.v1`
- `communication.person_channel.linked.v1`

## Safety Rules

1. Reply generation must require both `personId` and `conversationId`.
2. Context retrieval must be scoped to `workspaceId + personId`.
3. Context from another person must never be used for reply generation.
4. A reply must pass SafetyCheck before send.
5. Send must fail when the latest SafetyCheck is missing, stale, or failed.
6. Successful sends must return `sendDecision` audit evidence for the passed send gate checks.
7. Send must include the same `workspaceId + personId + conversationId` as the reply draft.
8. Send decisions must be stored as reply-draft-scoped audit history.
9. Channel adapter state is integration state only. It must not override person, conversation, or message ownership.

## Repository Status

This repository is being initialized for Communication Planner MVP design and development.

See:

- [docs/product-brief.md](docs/product-brief.md)
- [docs/domain-model.md](docs/domain-model.md)
- [docs/api-design.md](docs/api-design.md)
- [docs/events.md](docs/events.md)
- [docs/safety-rules.md](docs/safety-rules.md)
- [docs/oss-adoption.md](docs/oss-adoption.md)
- [docs/channel-adapters.md](docs/channel-adapters.md)
- [docs/adapter-webhook-examples.md](docs/adapter-webhook-examples.md)
- [docs/database-schema.md](docs/database-schema.md)
- [docs/local-api-check.md](docs/local-api-check.md)
- [docs/testing.md](docs/testing.md)
- [docs/sprint-1.md](docs/sprint-1.md)
