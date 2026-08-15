# Communication Planner Domain Model

## Core Entities

| Entity | Ownership | Notes |
| --- | --- | --- |
| UnifiedInboxItem | Communication Planner | Operational inbox view across conversations |
| CommunicationPerson | Communication Planner | Person projection for communication context, not Customer master |
| ChannelIdentity | Communication Planner | Channel-specific identity linked to a person |
| Conversation | Communication Planner | Person-scoped conversation thread |
| Message | Communication Planner | Message inside a conversation |
| ConversationContext | Communication Planner | Person-scoped summary and context |
| Topic | Communication Planner | Extracted or user-confirmed topic |
| Promise | Communication Planner | Commitment detected or entered from conversation |
| CommunicationNextAction | Communication Planner | Follow-up action for communication |
| ReplyDraft | Communication Planner | Draft reply for one person and one conversation |
| SafetyCheck | Communication Planner | Safety result for a reply draft |
| ChannelAdapterState | Communication Planner | Integration state for external channels |

## Required Scoping

All person-context operations must include:

- `workspaceId`
- `personId`

All reply generation operations must include:

- `workspaceId`
- `personId`
- `conversationId`

## External References

Communication Planner may store external references, but must not copy external source-of-truth payloads.

Allowed references include:

- `customerId`
- `reservationId`
- `sessionId`
- `reportId`
- `inputRef`
- `traceId`
- `correlationId`

Prohibited source-of-truth fields include:

- `paymentStatus`
- `salesAmount`
- Stripe details
- Full Customer master
- Full Numeria Report body
- Full Velvet Professional Memory
- AI Usage or token/cost records

## ReplyDraft Lifecycle

1. Draft requested with `personId` and `conversationId`.
2. Context is retrieved only by `workspaceId + personId`.
3. Draft is stored with explicit scope metadata.
4. SafetyCheck is created for the draft.
5. Send is allowed only when the latest SafetyCheck passes.
