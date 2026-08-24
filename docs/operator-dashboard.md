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

## Implemented Actions

The dashboard now reads from `GET /api/dashboard?workspaceId=...` and refreshes after every operator action.

| Action | API | Gate |
| --- | --- | --- |
| Save draft | `PATCH /api/reply-drafts/{replyDraftId}` | Requires `workspaceId + personId + conversationId` |
| Run SafetyCheck | `POST /api/reply-drafts/{replyDraftId}/safety-check` | Requires full draft scope |
| Send reply | `POST /api/reply-drafts/{replyDraftId}/send` | Requires full scope, original channel, and API send readiness |

## Send Unlock Rules

The UI must keep the send button disabled until all of these are true:

- `workspaceId + personId + conversationId` are confirmed.
- The selected channel matches the original conversation channel.
- Same-person context is pinned for review.
- The latest SafetyCheck passed for the current ReplyDraft content hash.
- The ReplyDraft is not already sent.

These UI rules mirror the API send gate. The API remains the source of truth and still rejects unsafe send attempts.

The UI additionally displays the API readiness reason, such as `SAFETY_CHECK_REQUIRED`, `STALE_SAFETY_CHECK`, or `REPLY_DRAFT_ALREADY_SENT`, so operators can see why a send is blocked.

## Send Confirmation Summary

The Safety Gate shows a compact confirmation summary immediately before the send action.

It must display:

- visible person name
- `conversationId`
- original conversation `channel`
- current ReplyDraft content hash

This summary is built from the existing dashboard snapshot fields and is not a replacement for the API send gate. The API still rejects mismatched `workspaceId + personId + conversationId + channel` requests.

## Send Decision History

The Reply Draft panel shows send decision history for the selected draft after the Safety Gate.

Each entry must show:

- confirmed channel
- adapter delivery mode
- SafetyCheck id
- ReplyDraft content hash
- adapter reference
- decision timestamp

This history is a read-only audit summary. It is derived from `reply_send_decisions` and does not unlock sending by itself.

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

Adapter readiness should show blocker categories by key name: `credentialRequirements`, `webhookSignatureSecrets`, `providerVerificationRequirements`, `operationalRequirements`, and `rateLimitPolicy`.

## Pilot Readiness

Minimum pilot readiness requires:

- Dashboard data loaded from the Communication Planner store.
- Draft editing through the scoped ReplyDraft API.
- SafetyCheck creation through the scoped SafetyCheck API.
- Send attempts blocked by the API until the dashboard and API agree on scope, channel, and current draft hash.
- Adapter operations shown as readiness state, with provider delivery still behind the send gate.
- Provider verification blockers visible before any live delivery request is treated as ready.
