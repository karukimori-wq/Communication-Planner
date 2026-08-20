import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("send decision history route contract", () => {
  it("requires full draft scope before returning send decisions", () => {
    const route = read("src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts");
    const store = read("src/lib/store.ts");
    const types = read("src/lib/types.ts");

    assert.match(route, /const \{ searchParams \} = new URL\(request\.url\)/);
    assert.match(route, /const workspaceId = searchParams\.get\("workspaceId"\)/);
    assert.match(route, /const personId = searchParams\.get\("personId"\)/);
    assert.match(route, /const conversationId = searchParams\.get\("conversationId"\)/);
    assert.match(route, /if \(!workspaceId\) return fail\("VALIDATION_ERROR", "workspaceId is required", 400, meta\)/);
    assert.match(route, /if \(!personId\) return fail\("VALIDATION_ERROR", "personId is required", 400, meta\)/);
    assert.match(route, /if \(!conversationId\) return fail\("VALIDATION_ERROR", "conversationId is required", 400, meta\)/);
    assert.match(route, /return fail\("NOT_FOUND", "ReplyDraft not found", 404, meta\)/);
    assert.match(route, /return fail\("REPLY_DRAFT_SCOPE_MISMATCH", "Scope does not match reply draft", 403, meta\)/);
    assert.match(route, /import type \{ ReplySendDecision, SendDecisionHistoryItem \} from "@\/lib\/types"/);
    assert.match(route, /function toSendDecisionHistoryItem\(decision: ReplySendDecision\): SendDecisionHistoryItem/);
    assert.match(route, /deliveryMode: decision\.adapterDelivery\.deliveryMode/);
    assert.match(route, /adapterReference: decision\.adapterDelivery\.adapterReference/);
    assert.match(route, /providerStatus: decision\.adapterDelivery\.providerStatus/);
    assert.match(route, /providerCode: decision\.adapterDelivery\.providerCode/);
    assert.doesNotMatch(route, /return ok\(\{ sendDecisions: getReplySendDecisions/);
    assert.match(route, /getReplySendDecisions\(\{ replyDraftId, workspaceId, personId, conversationId \}\)\.map\(toSendDecisionHistoryItem\)/);
    assert.match(route, /return ok\(\{ sendDecisions \}, meta\)/);

    assert.match(store, /export function getReplySendDecisions\(input: \{ replyDraftId: string; workspaceId: string; personId: string; conversationId: string \}\)/);
    assert.match(store, /decision\.replyDraftId === input\.replyDraftId/);
    assert.match(store, /decision\.workspaceId === input\.workspaceId/);
    assert.match(store, /decision\.personId === input\.personId/);
    assert.match(store, /decision\.conversationId === input\.conversationId/);
    assert.match(types, /export type SendDecisionHistoryItem = \{/);
    assert.match(types, /deliveryMode: ReplySendDecision\["adapterDelivery"\]\["deliveryMode"\]/);
    assert.match(types, /providerStatus\?: number/);
    assert.match(types, /providerCode\?: string/);
    assert.doesNotMatch(types, /SendDecisionHistoryItem[\s\S]*idempotencyKey/);
    assert.doesNotMatch(types, /SendDecisionHistoryItem[\s\S]*checks:/);
  });

  it("keeps route documentation and endpoint metadata aligned", () => {
    const contracts = read("src/lib/contracts.ts");
    const apiDesign = read("docs/api-design.md");
    const localApiCheck = read("docs/local-api-check.md");
    const testing = read("docs/testing.md");

    assert.match(contracts, /operation: "replyDrafts\.sendDecisions\.list"/);
    assert.match(contracts, /requiredFields: \["replyDraftId", "workspaceId", "personId", "conversationId"\]/);
    assert.match(contracts, /Send decision history must be scoped to replyDraftId \+ workspaceId \+ personId \+ conversationId/);
    assert.match(contracts, /Send decision audit must store the confirmed channel/);
    assert.match(contracts, /Send decision audit must store adapter delivery evidence/);
    assert.match(apiDesign, /Query fields:\n\n- `workspaceId`\n- `personId`\n- `conversationId`/);
    assert.match(apiDesign, /The request scope must match the draft's `workspaceId \+ personId \+ conversationId`/);
    assert.match(apiDesign, /channel that was confirmed at send time and adapter delivery evidence/);
    assert.match(apiDesign, /The history response is a sanitized audit projection/);
    assert.match(apiDesign, /The response shape is represented by `SendDecisionHistoryItem`/);
    assert.match(apiDesign, /does not return adapter idempotency keys or internal gate check objects/);
    assert.match(localApiCheck, /send-decisions\?workspaceId=ws_demo&personId=\{personId\}&conversationId=\{conversationId\}/);
    assert.match(testing, /Send decision history route requires `workspaceId \+ personId \+ conversationId` before returning audit records/);
  });
});
