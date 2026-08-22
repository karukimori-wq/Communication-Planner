import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
function read(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("route-level contract guards", () => {
  it("keeps endpoint catalog route returning implemented and planned contract counts", () => { const route=read("src/app/api/contracts/endpoints/route.ts"), contracts=read("src/lib/contracts.ts"); assert.match(route,/appName: "communication-planner"/); assert.match(route,/contractVersion: "2026-08-15"/); assert.match(route,/endpoints: endpointContracts/); assert.match(contracts,/communication\.reply_safety\.checked\.v1/); });
  it("keeps channel message ingestion route validating required fields and selecting scoped D1 persistence", () => {
    const route=read("src/app/api/channel-events/messages/route.ts"), store=read("src/lib/store.ts"), d1=read("src/lib/persistence/d1.ts");
    assert.match(route,/INVALID_JSON/); assert.match(route,/requireString\(body\.workspaceId, "workspaceId"\)/); assert.match(route,/normalizeChannel/); assert.match(route,/normalizeDirection/);
    assert.match(route,/getPersistenceReadiness/); assert.match(route,/getCloudflareContext/); assert.match(route,/D1CommunicationRepository/); assert.match(route,/ingestChannelMessage/);
    assert.match(store,/findOrCreatePerson/); assert.match(store,/appendContextInsights/);
    assert.match(d1,/async ingestChannelMessage/); assert.match(d1,/communication_persons/); assert.match(d1,/channel_identities/); assert.match(d1,/conversation_contexts/); assert.match(d1,/external_message_id/);
  });
  it("keeps adapter webhook routes normalizing OSS harness payloads without echoing raw payloads", () => { const webhook=read("src/lib/adapters/webhook-route.ts"), normalizer=read("src/lib/adapters/webhook.ts"); assert.match(webhook,/normalizeAdapterWebhookPayload/); assert.match(webhook,/verifyAdapterWebhookSignature/); assert.match(webhook,/raw: _raw/); assert.match(normalizer,/MISSING_WORKSPACE_ID/); });
  it("keeps reply workflow routes enforcing scoped draft, safety, send, and audit history contracts", () => {
    const createDraftRoute=read("src/app/api/conversations/[conversationId]/reply-drafts/route.ts"), updateDraftRoute=read("src/app/api/reply-drafts/[replyDraftId]/route.ts"), safetyRoute=read("src/app/api/reply-drafts/[replyDraftId]/safety-check/route.ts"), sendRoute=read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts"), history=read("src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts"), gateway=read("src/lib/persistence/gateway.ts");
    assert.match(createDraftRoute,/CONVERSATION_SCOPE_MISMATCH/); assert.match(updateDraftRoute,/updateReplyDraft/); assert.match(safetyRoute,/createSafetyCheck/); assert.match(sendRoute,/canSendReplyDraft/); assert.match(sendRoute,/validateSendConfirmation/); assert.match(sendRoute,/validateChannelConfirmation/); assert.match(sendRoute,/recordReplySendDecision/);
    assert.match(history,/searchParams\.get\("workspaceId"\)/); assert.match(history,/searchParams\.get\("personId"\)/); assert.match(history,/searchParams\.get\("conversationId"\)/); assert.match(history,/getScopedSendDecisionHistory\(\{ replyDraftId, workspaceId, personId, conversationId \}, \{ db \}\)/); assert.match(history,/REPLY_DRAFT_SCOPE_MISMATCH/); assert.match(gateway,/getReplySendDecisions\(scope\)/);
  });
});
