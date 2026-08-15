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

    assert.match(store, /SAFETY_CHECK_REQUIRED/);
    assert.match(store, /SAFETY_CHECK_FAILED/);
    assert.match(store, /STALE_SAFETY_CHECK/);
    assert.match(store, /safetyCheck\.checkedContentHash !== draft\.contentHash/);
    assert.match(sendRoute, /canSendReplyDraft\(replyDraftId\)/);
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
