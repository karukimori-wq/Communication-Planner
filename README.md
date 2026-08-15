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
| POST | `/api/channel-events/messages` | Ingest message events from channel adapters |
| GET | `/api/inbox` | Unified inbox |
| GET | `/api/persons/{personId}` | Person projection |
| GET | `/api/persons/{personId}/conversations` | Person-scoped conversations |
| GET | `/api/persons/{personId}/context` | Person-scoped context |
| POST | `/api/conversations/{conversationId}/reply-drafts` | Create reply draft |
| POST | `/api/reply-drafts/{replyDraftId}/safety-check` | Check reply safety |
| POST | `/api/reply-drafts/{replyDraftId}/send` | Send checked reply |

## Stable Events

- `communication.message.received.v1`
- `communication.message.sent.v1`
- `communication.context.updated.v1`
- `communication.promise.created.v1`
- `communication.next_action.created.v1`
- `communication.reply_draft.created.v1`
- `communication.reply_safety.checked.v1`
- `communication.person_channel.linked.v1`

## Safety Rules

1. Reply generation must require both `personId` and `conversationId`.
2. Context retrieval must be scoped to `workspaceId + personId`.
3. Context from another person must never be used for reply generation.
4. A reply must pass SafetyCheck before send.
5. Send must fail when the latest SafetyCheck is missing, stale, or failed.
6. Channel adapter state is integration state only. It must not override person, conversation, or message ownership.

## Repository Status

This repository is being initialized for Communication Planner MVP design and development.

See:

- [docs/product-brief.md](docs/product-brief.md)
- [docs/domain-model.md](docs/domain-model.md)
- [docs/api-design.md](docs/api-design.md)
- [docs/events.md](docs/events.md)
- [docs/safety-rules.md](docs/safety-rules.md)
- [docs/sprint-1.md](docs/sprint-1.md)
