import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("static contract guards", () => {
  it("documents Communication Planner ownership exclusions", () => {
    const readme = read("README.md");
    const schemaDoc = read("docs/database-schema.md");

    for (const forbiddenOwner of [
      "Customer master",
      "Lead lifecycle",
      "Reservation",
      "Payment",
      "Sales / Revenue",
      "SNS PostDraft",
      "Numeria Report",
      "AI Usage"
    ]) {
      assert.match(readme, new RegExp(forbiddenOwner.replaceAll("/", "\\/")));
    }

    assert.match(schemaDoc, /does not store Customer master/);
    assert.match(schemaDoc, /AI Usage as owned records/);
  });

  it("keeps reply draft creation scoped to workspaceId, personId, and conversationId", () => {
    const store = read("src/lib/store.ts");
    const route = read("src/app/api/conversations/[conversationId]/reply-drafts/route.ts");

    assert.match(store, /getConversation\(input\.workspaceId, input\.personId, input\.conversationId\)/);
    assert.match(route, /requireString\(body\.workspaceId, "workspaceId"\)/);
    assert.match(route, /requireString\(body\.personId, "personId"\)/);
    assert.match(route, /CONVERSATION_SCOPE_MISMATCH/);
  });

  it("requires a current passing SafetyCheck before send", () => {
    const store = read("src/lib/store.ts");
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");
    const apiDesign = read("docs/api-design.md");
    const safetyRules = read("docs/safety-rules.md");

    assert.match(store, /SAFETY_CHECK_REQUIRED/);
    assert.match(store, /SAFETY_CHECK_FAILED/);
    assert.match(store, /STALE_SAFETY_CHECK/);
    assert.match(store, /safetyCheck\.checkedContentHash !== draft\.contentHash/);
    assert.match(store, /workspaceId is required for SafetyCheck scope/);
    assert.match(store, /personId is required for SafetyCheck scope/);
    assert.match(store, /conversationId is required for SafetyCheck scope/);
    assert.match(sendRoute, /canSendReplyDraft\(replyDraftId\)/);
    assert.match(apiDesign, /Missing or mismatched scope fields force the SafetyCheck to `failed`/);
    assert.match(safetyRules, /SafetyCheck must include `workspaceId \+ personId \+ conversationId`/);
  });

  it("sends outbound messages on the original conversation channel", () => {
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");

    assert.match(sendRoute, /getConversation\(decision\.draft\.workspaceId, decision\.draft\.personId, decision\.draft\.conversationId\)/);
    assert.match(sendRoute, /channel: conversation\.channel/);
    assert.doesNotMatch(sendRoute, /channel: "unknown"/);
  });

  it("keeps endpoint-level contract metadata available", () => {
    const contracts = read("src/lib/contracts.ts");
    const route = read("src/app/api/contracts/endpoints/route.ts");
    const statusRoute = read("src/app/contracts/status/route.ts");
    const apiDesign = read("docs/api-design.md");

    assert.match(contracts, /endpointContracts/);
    assert.match(contracts, /prohibitedOwnedPayloadFields/);
    assert.match(contracts, /replyDrafts\.send/);
    assert.match(contracts, /communication\.reply_safety\.checked\.v1/);
    assert.match(route, /implementedCount/);
    assert.match(statusRoute, /endpointContractsPath: "\/api\/contracts\/endpoints"/);
    assert.match(apiDesign, /GET \/api\/contracts\/endpoints/);
  });

  it("exposes harness-compatible adapter webhook entry points", () => {
    const contracts = read("src/lib/contracts.ts");
    const webhookRoute = read("src/lib/adapters/webhook-route.ts");
    const webhookNormalizer = read("src/lib/adapters/webhook.ts");
    const lineRoute = read("src/app/api/adapters/line/webhook/route.ts");
    const xRoute = read("src/app/api/adapters/x/webhook/route.ts");
    const instagramRoute = read("src/app/api/adapters/instagram/webhook/route.ts");
    const adapterDoc = read("docs/channel-adapters.md");

    assert.match(contracts, /\/api\/adapters\/line\/webhook/);
    assert.match(contracts, /\/api\/adapters\/x\/webhook/);
    assert.match(contracts, /\/api\/adapters\/instagram\/webhook/);
    assert.match(webhookRoute, /ingestChannelMessage\(adapter\.normalizeInbound\(normalized\.event\)\)/);
    assert.match(webhookNormalizer, /firstObjectAt\(payload, \["events", "messages", "entries"\]\)/);
    assert.match(lineRoute, /createAdapterWebhookRoute\("line"\)/);
    assert.match(xRoute, /createAdapterWebhookRoute\("x"\)/);
    assert.match(instagramRoute, /createAdapterWebhookRoute\("instagram"\)/);
    assert.match(adapterDoc, /Shudesu\/line-harness-oss/);
    assert.match(adapterDoc, /communication\.message\.received\.v1/);
  });

  it("keeps provider message ingestion idempotent", () => {
    const store = read("src/lib/store.ts");
    const webhookRoute = read("src/lib/adapters/webhook-route.ts");
    const adapterDoc = read("docs/channel-adapters.md");

    assert.match(store, /function findDuplicateMessage\(input: ChannelMessageInput\)/);
    assert.match(store, /message\.externalMessageId === input\.externalMessageId/);
    assert.match(store, /duplicate: true/);
    assert.match(store, /duplicate: false/);
    assert.match(store, /existingIdentity = store\.channelIdentities\.find/);
    assert.match(webhookRoute, /duplicate: result\.duplicate/);
    assert.match(adapterDoc, /Duplicate provider message ids must not create duplicate Message records/);
  });

  it("stores context insights as person-scoped Communication Planner records", () => {
    const types = read("src/lib/types.ts");
    const store = read("src/lib/store.ts");
    const route = read("src/app/api/channel-events/messages/route.ts");
    const schema = read("db/schema.sql");
    const schemaDoc = read("docs/database-schema.md");

    assert.match(types, /export type Topic/);
    assert.match(types, /export type Promise/);
    assert.match(types, /export type CommunicationNextAction/);
    assert.match(types, /topics\?: string\[\]/);
    assert.match(types, /promises\?: string\[\]/);
    assert.match(types, /nextActions\?: string\[\]/);
    assert.match(store, /function appendContextInsights/);
    assert.match(store, /sourceMessageId: input\.messageId/);
    assert.match(store, /context\.topicIds\.push/);
    assert.match(store, /context\.promiseIds\.push/);
    assert.match(store, /context\.nextActionIds\.push/);
    assert.match(route, /topics: body\.topics/);
    assert.match(route, /promises: body\.promises/);
    assert.match(route, /nextActions: body\.nextActions/);
    assert.match(schema, /create table if not exists topics/);
    assert.match(schema, /create table if not exists promises/);
    assert.match(schema, /create table if not exists communication_next_actions/);
    assert.match(schemaDoc, /source_message_id/);
  });

  it("uses only same-person context insights for generated reply drafts", () => {
    const store = read("src/lib/store.ts");
    const safetyRules = read("docs/safety-rules.md");
    const apiDesign = read("docs/api-design.md");

    assert.match(store, /function formatContextForDraft/);
    assert.match(store, /Topics: \$\{context\.topics\.map/);
    assert.match(store, /Promises: \$\{context\.promises\.map/);
    assert.match(store, /Next actions: \$\{context\.nextActions\.map/);
    assert.match(store, /getPersonContext\(input\.workspaceId, input\.personId\)/);
    assert.match(store, /formatContextForDraft\(context\)/);
    assert.match(safetyRules, /ReplyDraft context may include Topic, Promise, and Communication NextAction only from the same `workspaceId \+ personId`/);
    assert.match(apiDesign, /must not use context insight records from another `personId`/);
  });

  it("keeps CORS and preflight support enabled", () => {
    const http = read("src/lib/http.ts");
    const middleware = read("src/middleware.ts");
    const cors = read("src/lib/cors.ts");

    assert.match(cors, /Access-Control-Allow-Origin/);
    assert.match(http, /headers: withCors\(\)/);
    assert.match(middleware, /request\.method === "OPTIONS"/);
    assert.match(middleware, /status: 204/);
  });
});
