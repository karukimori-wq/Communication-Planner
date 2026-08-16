import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("route-level contract guards", () => {
  it("keeps endpoint catalog route returning implemented and planned contract counts", () => {
    const route = read("src/app/api/contracts/endpoints/route.ts");
    const contracts = read("src/lib/contracts.ts");

    assert.match(route, /appName: "communication-planner"/);
    assert.match(route, /contractVersion: "2026-08-15"/);
    assert.match(route, /endpoints: endpointContracts/);
    assert.match(route, /implementedCount: endpointContracts\.filter\(\(endpoint\) => endpoint\.status === "implemented"\)\.length/);
    assert.match(route, /plannedCount: endpointContracts\.filter\(\(endpoint\) => endpoint\.status === "planned"\)\.length/);
    assert.match(contracts, /communication\.message\.received\.v1 \| communication\.message\.sent\.v1/);
    assert.match(contracts, /communication\.reply_draft\.created\.v1/);
    assert.match(contracts, /communication\.reply_safety\.checked\.v1/);
    assert.match(contracts, /communication\.message\.sent\.v1/);
  });

  it("keeps channel message ingestion route validating required fields before success", () => {
    const route = read("src/app/api/channel-events/messages/route.ts");
    const store = read("src/lib/store.ts");

    assert.match(route, /readJson<Partial<ChannelMessageInput>>\(request\)/);
    assert.match(route, /INVALID_JSON/);
    assert.match(route, /requireString\(body\.workspaceId, "workspaceId"\)/);
    assert.match(route, /requireString\(body\.externalUserId, "externalUserId"\)/);
    assert.match(route, /requireString\(body\.body, "body"\)/);
    assert.match(route, /direction: body\.direction \?\? "inbound"/);
    assert.match(route, /eventName: result\.message\.direction === "outbound" \? "communication\.message\.sent\.v1" : "communication\.message\.received\.v1"/);
    assert.match(store, /findOrCreatePerson\(input\)/);
    assert.match(store, /findOrCreateChannelIdentity\(input, person\)/);
    assert.match(store, /findOrCreateConversation\(input, person\.personId\)/);
    assert.match(store, /appendContextInsights/);
  });

  it("keeps adapter webhook routes normalizing OSS harness payloads without echoing raw payloads", () => {
    const webhookRoute = read("src/lib/adapters/webhook-route.ts");
    const normalizer = read("src/lib/adapters/webhook.ts");
    const lineRoute = read("src/app/api/adapters/line/webhook/route.ts");
    const xRoute = read("src/app/api/adapters/x/webhook/route.ts");
    const instagramRoute = read("src/app/api/adapters/instagram/webhook/route.ts");

    assert.match(lineRoute, /createAdapterWebhookRoute\("line"\)/);
    assert.match(xRoute, /createAdapterWebhookRoute\("x"\)/);
    assert.match(instagramRoute, /createAdapterWebhookRoute\("instagram"\)/);
    assert.match(webhookRoute, /normalizeAdapterWebhookPayload\(channel, body\)/);
    assert.match(webhookRoute, /const \{ raw: _raw, \.\.\.responseEvent \} = normalized\.event/);
    assert.match(webhookRoute, /normalizedEvent: responseEvent/);
    assert.match(webhookRoute, /communication\.message\.received\.v1/);
    assert.match(normalizer, /firstObjectAt\(payload, \["events", "messages", "entries"\]\) \?\? payload/);
    assert.match(normalizer, /MISSING_WORKSPACE_ID/);
    assert.match(normalizer, /MISSING_EXTERNAL_USER_ID/);
    assert.match(normalizer, /MISSING_MESSAGE_BODY/);
  });

  it("keeps reply workflow routes enforcing scoped draft, safety, send, and audit history contracts", () => {
    const createDraftRoute = read("src/app/api/conversations/[conversationId]/reply-drafts/route.ts");
    const updateDraftRoute = read("src/app/api/reply-drafts/[replyDraftId]/route.ts");
    const safetyRoute = read("src/app/api/reply-drafts/[replyDraftId]/safety-check/route.ts");
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");
    const sendDecisionsRoute = read("src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts");

    assert.match(createDraftRoute, /requireString\(body\.workspaceId, "workspaceId"\)/);
    assert.match(createDraftRoute, /requireString\(body\.personId, "personId"\)/);
    assert.match(createDraftRoute, /CONVERSATION_SCOPE_MISMATCH/);
    assert.match(createDraftRoute, /communication\.reply_draft\.created\.v1/);

    assert.match(updateDraftRoute, /updateReplyDraft\(replyDraftId, body\)/);
    assert.match(updateDraftRoute, /result\.code === "NOT_FOUND" \? 404 : 409/);
    assert.match(updateDraftRoute, /communication\.reply_draft\.updated\.v1/);

    assert.match(safetyRoute, /createSafetyCheck\(replyDraftId, body\)/);
    assert.match(safetyRoute, /NOT_FOUND/);
    assert.match(safetyRoute, /communication\.reply_safety\.checked\.v1/);

    assert.match(sendRoute, /canSendReplyDraft\(replyDraftId\)/);
    assert.match(sendRoute, /validateSendConfirmation\(body, decision\.draft\)/);
    assert.match(sendRoute, /getConversation\(decision\.draft\.workspaceId, decision\.draft\.personId, decision\.draft\.conversationId\)/);
    assert.match(sendRoute, /recordReplySendDecision/);
    assert.match(sendRoute, /communication\.message\.sent\.v1/);

    assert.match(sendDecisionsRoute, /searchParams\.get\("workspaceId"\)/);
    assert.match(sendDecisionsRoute, /searchParams\.get\("personId"\)/);
    assert.match(sendDecisionsRoute, /searchParams\.get\("conversationId"\)/);
    assert.match(sendDecisionsRoute, /REPLY_DRAFT_SCOPE_MISMATCH/);
    assert.match(sendDecisionsRoute, /getReplySendDecisions\(\{ replyDraftId, workspaceId, personId, conversationId \}\)/);
  });
});
