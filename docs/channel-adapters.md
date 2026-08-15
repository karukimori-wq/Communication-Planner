# Channel Adapter Strategy

Communication Planner will use the Harness OSS repositories as the primary references for channel adapter development.

Target repositories:

- `Shudesu/line-harness-oss`
- `Shudesu/x-harness-oss`
- `Shudesu/ig-harness-oss`

These repositories should be used for adapter architecture, webhook handling, identity mapping, and provider-specific message operations. Communication Planner must still own its core domain model and safety gates.

## Adapter Role

Channel adapters translate provider-specific events into Communication Planner's canonical model.

Adapters may handle:

- Provider webhook verification
- Provider event parsing
- Provider user/channel identity normalization
- Inbound message detection
- Outbound message delivery
- Provider message idempotency
- Provider API rate limit handling
- Adapter health checks
- Adapter integration state

Adapters must not own:

- CommunicationPerson as a business/customer master
- ConversationContext
- ReplyDraft
- SafetyCheck
- Final send decision
- Customer, Lead, Reservation, Payment, Sales, or Revenue

## Canonical Mapping

| Provider Concept | Communication Planner Concept |
| --- | --- |
| Provider account/channel | `ChannelAdapterState` |
| Provider user id | `ChannelIdentity.externalUserId` |
| Provider message id | `Message.externalMessageId` |
| Incoming text/media event | `Message` with `direction: inbound` |
| Outgoing sent result | `Message` with `direction: outbound` |
| Provider conversation/thread id | `Conversation.externalThreadId` when available |
| Linked provider identity | `communication.person_channel.linked.v1` |

## Required Event Outputs

Adapters must create or trigger these Communication Planner events:

| Situation | Event |
| --- | --- |
| Incoming provider message stored | `communication.message.received.v1` |
| Outgoing checked message sent | `communication.message.sent.v1` |
| Channel identity linked to person | `communication.person_channel.linked.v1` |
| Adapter updates context after message ingestion | `communication.context.updated.v1` |

## LINE Harness Usage

Use `Shudesu/line-harness-oss` for:

- LINE Official Account webhook flow
- LINE message event parsing
- LINE user identity handling
- LINE send API reference
- Cloudflare Workers + D1 deployment reference where useful

Communication Planner-specific additions:

- Map LINE user id to `ChannelIdentity`.
- Create or resolve `CommunicationPerson` projection before storing messages.
- Store inbound messages as Communication Planner `Message` records.
- Block outbound sends unless the related `ReplyDraft` has a passed and fresh `SafetyCheck`.

## X Harness Usage

Use `Shudesu/x-harness-oss` for:

- X account integration patterns
- DM and reply management patterns
- Provider identity and message history reference
- API usage and rate limit handling reference

Communication Planner-specific additions:

- Treat X identities as `ChannelIdentity` records.
- Avoid importing marketing automation, campaign gates, bulk actions, or follower growth concepts into core.
- Convert eligible DMs/replies into person-scoped `Conversation` and `Message` records.
- Route all outbound reply sends through the SafetyCheck send gate.

## IG Harness Usage

Use `Shudesu/ig-harness-oss` for:

- Instagram DM adapter patterns
- Instagram identity mapping
- DM send/receive flow reference
- Provider webhook/event handling reference

Communication Planner-specific additions:

- Treat Instagram profiles as `ChannelIdentity` records.
- Keep conversation context scoped to `workspaceId + personId`.
- Convert provider DM events into canonical `Message` records.
- Require SafetyCheck before send.

## Adapter Boundary

```mermaid
flowchart TD
    Provider["LINE / X / Instagram"] --> Adapter["Channel Adapter"]
    Adapter --> Canonical["Canonical Message Event"]
    Canonical --> Core["Communication Planner Core"]
    Core --> Safety["ReplyDraft + SafetyCheck"]
    Safety --> Adapter
```

The adapter can send a message only after Communication Planner Core authorizes the send.

## Implementation Guardrails

- Provider webhook payloads should be normalized before reaching core services.
- Store raw provider payloads only when needed for debugging or idempotency, and keep them out of reply generation context.
- Never use one person's context to generate another person's reply.
- Never allow bulk or broadcast sending through Communication Planner reply APIs.
- Every adapter operation should include `workspaceId`, `channel`, `traceId`, and `correlationId` when available.

## First Implementation Target

Implement adapter contracts before full provider integration:

1. Define `ChannelAdapter` interface.
2. Define provider-normalized inbound event shape.
3. Define provider-normalized outbound send request shape.
4. Add LINE adapter stub based on LINE Harness architecture.
5. Add X adapter stub based on X Harness architecture.
6. Add Instagram adapter stub based on IG Harness architecture.
7. Add tests proving outbound sends fail without SafetyCheck authorization.
