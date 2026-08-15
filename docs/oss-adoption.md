# OSS Adoption Strategy

Communication Planner should reuse useful OSS ideas and components from GitHub where they reduce risk or implementation time. Reuse must not weaken Communication Planner's ownership boundaries or safety rules.

## Adoption Principles

1. Prefer OSS for proven infrastructure patterns, adapter references, UI patterns, and operational workflows.
2. Do not copy an OSS product's domain model if it conflicts with Communication Planner's source-of-truth rules.
3. Keep Communication Planner as the owner of Conversation, Message, ConversationContext, ReplyDraft, SafetyCheck, and ChannelAdapterState.
4. Treat external OSS channel projects as adapter references unless their license and architecture are explicitly approved for deeper reuse.
5. Every imported package or copied implementation must have a license review before production use.

## Recommended OSS References

| OSS | GitHub | Use | Adoption Level | Notes |
| --- | --- | --- | --- | --- |
| Chatwoot | `chatwoot/chatwoot` | Unified inbox, conversation assignment, omnichannel support UI, agent workflow patterns | Reference architecture | Strong reference for inbox and conversation operations. Do not adopt its customer master model as Communication Planner's source of truth. |
| LINE Harness | `Shudesu/line-harness-oss` | LINE channel adapter, webhook handling, message delivery, Cloudflare Workers + D1 deployment reference | Adapter reference | Useful for LINE Official Account integration patterns. Communication Planner should map inbound/outbound events into its own Message and ChannelIdentity model. |
| X Harness | `Shudesu/x-harness-oss` | X DM/reply/channel automation patterns | Adapter reference | Useful for X-related adapter design. Avoid importing marketing automation concepts into Communication Planner core. |
| IG Harness | `Shudesu/ig-harness-oss` | Instagram DM adapter patterns | Adapter reference | Useful for Instagram DM integration. Must keep person-scoped context and SafetyCheck in Communication Planner. |
| erxes | `erxes/erxes` | Sales/customer engagement workflow reference | Limited reference | Broad product scope overlaps with Growth Engine. Do not reuse as Communication Planner core. |

## What To Reuse First

### Unified Inbox Patterns

From Chatwoot-style systems, reuse ideas such as:

- Inbox item status
- Conversation unread count
- Assignee or owner display
- Last message preview
- Channel badge
- Priority and waiting state
- Conversation list filtering

Communication Planner must adapt these to `workspaceId + personId + conversationId` scoping.

### Channel Adapter Patterns

From LINE Harness, X Harness, and IG Harness, reuse ideas such as:

- Webhook verification
- Channel identity normalization
- Message direction detection
- Provider event idempotency
- Send result storage
- API rate limit handling
- Adapter health/status checks

Adapters must emit Communication Planner events and must not bypass SafetyCheck for sends.

### Safety Patterns To Add On Top

Most shared inbox OSS products are not built around wrong-person reply prevention. Communication Planner must add these product-specific safeguards:

- ReplyDraft requires `personId` and `conversationId`.
- Context lookup is only `workspaceId + personId`.
- Reply generation must record the context source.
- SafetyCheck must compare draft scope and context scope.
- Send must require a passed, fresh SafetyCheck.

## What Not To Reuse

Avoid adopting these directly into Communication Planner core:

- Customer lifecycle stages
- Sales pipeline ownership
- Payment or revenue fields
- Marketing automation campaigns
- Broadcast or bulk-send logic
- Help center knowledge base as a core domain
- AI usage or billing tracking

Those belong to Growth Engine, SNS Planner, AI Platform Core, or other platform apps.

## Sprint 1 OSS Tasks

| Task | Output |
| --- | --- |
| Review Chatwoot inbox and conversation concepts | Inbox model notes and UI candidate list |
| Review LINE Harness adapter architecture | LINE adapter event mapping draft |
| Review X Harness and IG Harness adapter architecture | X/Instagram adapter event mapping draft |
| Define OSS license review checklist | Production adoption gate |
| Add adapter boundary document | Clear split between ChannelAdapterState and core domain |

## Production Gate

Before any OSS code is copied or vendored, record:

- Repository URL
- License
- Copied files or package names
- Modified files
- Security considerations
- Data ownership impact
- Maintenance risk

If the license or ownership impact is unclear, use the OSS only as a reference, not as copied source.
