# OSS Adoption Strategy

Communication Planner should reuse useful OSS ideas and components from GitHub where they reduce risk or implementation time. Reuse must not weaken Communication Planner's ownership boundaries or safety rules.

## Adoption Principles

1. Prefer OSS for proven infrastructure patterns, adapter references, UI patterns, and operational workflows.
2. Do not copy an OSS product's domain model if it conflicts with Communication Planner's source-of-truth rules.
3. Keep Communication Planner as the owner of Conversation, Message, ConversationContext, ReplyDraft, SafetyCheck, and ChannelAdapterState.
4. Treat external OSS channel projects as adapter references unless their license and architecture are explicitly approved for deeper reuse.
5. Every imported package or copied implementation must have a license review before production use.
6. Use `Shudesu/line-harness-oss`, `Shudesu/x-harness-oss`, and `Shudesu/ig-harness-oss` as the primary adapter references for LINE, X, and Instagram.

## Recommended OSS References

| OSS | GitHub | Use | Adoption Level | Notes |
| --- | --- | --- | --- | --- |
| Chatwoot | `chatwoot/chatwoot` | Unified inbox, conversation assignment, omnichannel support UI, agent workflow patterns | Reference architecture | Strong reference for inbox and conversation operations. Do not adopt its customer master model as Communication Planner's source of truth. |
| LINE Harness | `Shudesu/line-harness-oss` | LINE channel adapter, webhook handling, message delivery, Cloudflare Workers + D1 deployment reference | Primary adapter reference | Use for LINE Official Account integration patterns. Communication Planner should map inbound/outbound events into its own Message and ChannelIdentity model. |
| X Harness | `Shudesu/x-harness-oss` | X DM/reply/channel automation patterns | Primary adapter reference | Use for X-related adapter design. Avoid importing marketing automation concepts into Communication Planner core. |
| IG Harness | `Shudesu/ig-harness-oss` | Instagram DM adapter patterns | Primary adapter reference | Use for Instagram DM integration. Must keep person-scoped context and SafetyCheck in Communication Planner. |
| erxes | `erxes/erxes` | Sales/customer engagement workflow reference | Limited reference | Broad product scope overlaps with Growth Engine. Do not reuse as Communication Planner core. |

## Harness Adapter Strategy

The Harness repositories are not just general references. They are the preferred starting point for channel adapter design.

See [channel-adapters.md](channel-adapters.md) for the canonical mapping from LINE/X/Instagram provider events into Communication Planner domain objects and events.

## Harness Review Snapshot

Reviewed via GitHub metadata on 2026-08-17:

| OSS | Language | License state | Recent activity | Decision |
| --- | --- | --- | --- | --- |
| `Shudesu/line-harness-oss` | TypeScript | License not declared in repository metadata | Updated 2026-08-16 | Reference only until license is clarified |
| `Shudesu/x-harness-oss` | TypeScript | MIT | Updated 2026-08-16 | Reference-safe for adapter patterns |
| `Shudesu/ig-harness-oss` | TypeScript | MIT | Updated 2026-08-15 | Reference-safe for adapter patterns |

No source files are copied into Communication Planner. The current implementation reuses the repositories as architecture references and records adapter attribution in dry-run send results.

## 2026-08-17 Code Structure Review

The remaining Sprint 1 OSS review steps are now recorded as implementation decisions:

| Step | Repository | Observed structure | Reuse decision |
| --- | --- | --- | --- |
| 1 | `chatwoot/chatwoot` | Ruby omni-channel support desk with conversation, inbox, dashboard, and assignment patterns | Use only as unified inbox UX/reference architecture; do not adopt its customer/support-desk domain model |
| 2 | `Shudesu/line-harness-oss` | TypeScript monorepo with SDK, LINE SDK, MCP server, update engine, Cloudflare deployment tooling, D1-oriented operations | Use webhook, identity, SDK, idempotency, and provider operations patterns as reference only until license is clarified |
| 3 | `Shudesu/x-harness-oss` | TypeScript packages for SDK, X SDK, DB, MCP tools, installer, engagement gates, growth, campaigns, usage, and posting flows | Use DM/provider API, OAuth, rate-limit, and error handling references; exclude growth, campaigns, follower automation, and bulk actions |
| 4 | `Shudesu/ig-harness-oss` | TypeScript packages for SDK, IG SDK, DB, MCP server, installer, webhook, media, comments, DM, and LINE cross-link operations | Use Instagram webhook, DM, account, and media identity patterns; exclude engagement gates, broadcast-like scenarios, and cross-channel marketing automation |
| 5 | `Shudesu/line-harness-oss` license gate | GitHub repository metadata still has no declared license | No source copy, vendoring, or package dependency until a license is explicitly recorded |
| 6 | Provider production gate | Credentials, signature verification, rate-limit policy, and provider error mapping are not yet production-configured | Keep live provider send blocked behind `/api/adapters/readiness`; fallback remains `dry_run` |
| 7 | Route-level testing | Static route contract tests existed; executable request/response tests remain the next expansion | Add contract coverage for readiness endpoint and live-send fallback before provider credentials are used |

This review keeps Communication Planner's core narrow: wrong-person prevention, scoped context, draft safety, and send audit remain owned by Communication Planner.

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
| Review LINE Harness adapter architecture | LINE adapter event mapping, dry-run send evidence, and license gate |
| Review X Harness and IG Harness adapter architecture | X/Instagram adapter event mapping, exclusions, and dry-run send evidence |
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
