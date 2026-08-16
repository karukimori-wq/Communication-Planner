# Communication Planner Events

## Stable Events

| Event | Producer | Meaning |
| --- | --- | --- |
| `communication.message.received.v1` | Communication Planner | Incoming message was stored |
| `communication.message.sent.v1` | Communication Planner | Checked reply was sent |
| `communication.context.updated.v1` | Communication Planner | Person-scoped context changed |
| `communication.promise.created.v1` | Communication Planner | Promise was created from conversation |
| `communication.next_action.created.v1` | Communication Planner | Next action was created |
| `communication.reply_draft.created.v1` | Communication Planner | Reply draft was created |
| `communication.reply_draft.updated.v1` | Communication Planner | Reply draft was updated and content hash refreshed |
| `communication.reply_safety.checked.v1` | Communication Planner | Reply draft safety was checked |
| `communication.person_channel.linked.v1` | Communication Planner | Channel identity was linked to a person |

## Event Principles

- Events must use stable names exactly as listed.
- Events must include `workspaceId`.
- Person-scoped events must include `personId`.
- Conversation-scoped events must include `conversationId`.
- Reply-related events must include `replyDraftId` where applicable.
- Events should include `traceId` and `correlationId` for Platform Admin observability.

## Ownership Guardrails

Events may contain references to Growth Engine, Numeria Studio, SNS Planner, Velvet, or AI Platform Core records, but must not replicate their source-of-truth payloads.
