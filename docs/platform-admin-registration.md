# Platform Admin Registration

Communication Planner registration is blocked until the production runtime URL is finalized.

## App Identity

| Field | Value |
| --- | --- |
| App name | `communication-planner` |
| Display name | `Communication Planner` |
| Source of truth | Unified Inbox, Communication Person projection, ChannelIdentity, Conversation, Message, ConversationContext, Topic, Promise, Communication NextAction, ReplyDraft, SafetyCheck, ChannelAdapter integration state |
| Not source of truth | Customer, Lead, Reservation, Payment, Sales, SNS PostDraft, Numeria Report, Velvet Professional Memory, AI Usage |

## Required Runtime URL

```text
COMMUNICATION_PLANNER_BASE_URL=<pending production URL>
```

## Health Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Runtime health |
| GET | `/version` | Build and version metadata |
| GET | `/contracts/status` | Contract readiness |
| GET | `/api/adapters/readiness` | Provider readiness and dry-run/live gate visibility |

## Stable Events

- `communication.message.received.v1`
- `communication.message.sent.v1`
- `communication.context.updated.v1`
- `communication.promise.created.v1`
- `communication.next_action.created.v1`
- `communication.reply_draft.created.v1`
- `communication.reply_safety.checked.v1`
- `communication.person_channel.linked.v1`

## Registration Gate

Register the app in Platform Admin only after:

- production URL is known
- health endpoints return HTTP 200
- `/contracts/status` returns `status: "success"`
- `/api/adapters/readiness` confirms `dry_run` unless every live-send gate is configured
