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
- The latest SafetyCheck belongs to the same draft.
- The SafetyCheck status is `passed`.
- The checked content hash matches the current draft content hash.

## AI Platform Core Boundary

AI Platform Core may return a draft candidate or safety candidate, but Communication Planner owns:

- Final ReplyDraft storage
- Final SafetyCheck record
- Send decision
- Message sent record
