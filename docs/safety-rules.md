# Communication Planner Safety Rules

## Most Important Rule

Communication Planner must prevent wrong-person and wrong-conversation replies.

## Hard Requirements

1. Reply generation requires `personId`.
2. Reply generation requires `conversationId`.
3. Context retrieval is limited to `workspaceId + personId`.
4. Reply generation must not use context from another person.
5. SafetyCheck is required before send.
6. Send must fail when SafetyCheck is missing.
7. Send must fail when SafetyCheck failed.
8. Send must fail when SafetyCheck is stale compared with the latest draft content.
9. ReplyDraft context may include Topic, Promise, and Communication NextAction only from the same `workspaceId + personId`.
10. SafetyCheck must include `workspaceId + personId + conversationId`; missing or mismatched scope must fail.
11. Send must include `workspaceId + personId + conversationId + channel`; missing or mismatched confirmation scope or channel must fail.
12. A `sent` ReplyDraft must not be sent again.
13. Passed send decisions must be stored as reply-draft-scoped audit history.

## SafetyCheck Scope

SafetyCheck should verify:

- Recipient fit
- Conversation fit
- Context consistency
- Prohibited cross-person context
- Cross-person Topic, Promise, or NextAction leakage
- Sensitive or source-of-truth payload leakage
- Basic tone and professionalism

## Send Gate

`POST /api/reply-drafts/{replyDraftId}/send` must validate:

- The draft exists.
- The draft has `workspaceId`.
- The draft has `personId`.
- The draft has `conversationId`.
- The draft status is not `sent`.
- The latest SafetyCheck belongs to the same draft.
- The latest SafetyCheck includes matching `workspaceId + personId + conversationId`.
- The SafetyCheck status is `passed`.
- The checked content hash matches the current draft content hash.
- The send request confirms the same `workspaceId + personId + conversationId` as the draft.
- The send request confirms the same `channel` as the original conversation.
- The send decision stores the confirmed original conversation `channel`.
- The send decision receives the confirmed channel at record time and stores `channelConfirmed` in the passed gate checks.
- The send response includes `sendDecision` audit evidence for the passed gate checks.
- The send decision is stored and can be read only when `replyDraftId + workspaceId + personId + conversationId` match the draft.
- Provider adapter delivery may run only after the API send gate passes.
- Provider adapter delivery must resolve a matching `ChannelIdentity` before send.
- Current provider delivery must stay `dry_run` until production credentials, signature verification, rate-limit handling, and provider error mapping are configured.
- `ReplySendDecision.adapterDelivery` must store delivery mode, adapter reference, idempotency key, and external provider/dry-run message id.
- If live provider delivery is requested but `/api/adapters/readiness` reports any blocker, the effective provider delivery mode must remain `dry_run`.
- Provider webhook payloads must pass signature verification before ingestion when enforcement is enabled.
- Provider sends must pass the configured rate-limit policy before adapter delivery.
- Provider-specific errors must be mapped into stable Communication Planner adapter outcomes before being returned by API routes.

## AI Platform Core Boundary

AI Platform Core may return a draft candidate or safety candidate, but Communication Planner owns:

- Final ReplyDraft storage
- Final SafetyCheck record
- Send decision
- Message sent record
