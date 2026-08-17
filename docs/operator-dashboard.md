# Operator Dashboard

The first UI surface is a single-workspace operator dashboard for the safest 1-to-1 reply workflow.

## Implemented Panels

| Panel | Purpose | Safety Boundary |
| --- | --- | --- |
| Inbox | Select a person-scoped LINE, X, or Instagram conversation | Conversation selection keeps `personId`, `conversationId`, and `channel` visible together |
| Person Context | Review same-person context before drafting | Context is presented as `workspaceId + personId` scoped information |
| Reply Draft | Review the current draft and content hash | Draft is tied to a visible purpose and hash |
| Safety Gate | Confirm send prerequisites before enabling send | Send stays locked until scope, channel, context, and SafetyCheck are confirmed |
| Operations | Show adapter and AI task readiness | OSS harness references stay adapter-scoped and AI tasks stay behind Communication Planner boundaries |

## Send Unlock Rules

The UI must keep the send button disabled until all of these are true:

- `workspaceId + personId + conversationId` are confirmed.
- The selected channel matches the original conversation channel.
- Same-person context is pinned for review.
- The latest SafetyCheck passed for the current ReplyDraft content hash.
- The ReplyDraft is not already sent.

These UI rules mirror the API send gate. The API remains the source of truth and still rejects unsafe send attempts.

## AI Platform Core Boundary

The dashboard exposes the three expected AI operations as task boundaries:

- `reply.generate`: create a ReplyDraft from same-person context only.
- `safety_check`: compare the ReplyDraft scope and content hash before send.
- `context.summarize`: update Communication Planner context records without owning customer master data.

## Adapter Boundary

The Operations panel lists LINE, X, and Instagram adapter readiness with the corresponding OSS references:

- `Shudesu/line-harness-oss`
- `Shudesu/x-harness-oss`
- `Shudesu/ig-harness-oss`

Adapters may normalize provider events and prepare provider sends, but final outbound sends remain blocked by Communication Planner's SafetyCheck and send confirmation rules.
