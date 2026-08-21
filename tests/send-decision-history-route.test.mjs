import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
function read(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("send decision history route contract", () => {
  it("requires full draft scope before returning send decisions", () => {
    const route = read("src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts");
    const gateway = read("src/lib/persistence/gateway.ts");
    const d1 = read("src/lib/persistence/d1.ts");
    const types = read("src/lib/types.ts");
    assert.match(route, /searchParams\.get\("workspaceId"\)/);
    assert.match(route, /searchParams\.get\("personId"\)/);
    assert.match(route, /searchParams\.get\("conversationId"\)/);
    assert.match(route, /if \(!workspaceId\) return fail\("VALIDATION_ERROR", "workspaceId is required", 400, meta\)/);
    assert.match(route, /if \(!personId\) return fail\("VALIDATION_ERROR", "personId is required", 400, meta\)/);
    assert.match(route, /if \(!conversationId\) return fail\("VALIDATION_ERROR", "conversationId is required", 400, meta\)/);
    assert.match(route, /getScopedSendDecisionHistory\(\{ replyDraftId, workspaceId, personId, conversationId \}, \{ db \}\)/);
    assert.match(route, /if \(!result\.found\) return fail\("NOT_FOUND", "ReplyDraft not found", 404, meta\)/);
    assert.match(route, /if \(code === "REPLY_DRAFT_SCOPE_MISMATCH"\) return fail\(code, "Scope does not match reply draft", 403, meta\)/);
    assert.match(route, /persistenceDriver: result\.driver/);
    assert.match(gateway, /draft\.workspaceId !== scope\.workspaceId \|\| draft\.personId !== scope\.personId \|\| draft\.conversationId !== scope\.conversationId/);
    assert.match(gateway, /getReplySendDecisions\(scope\)/);
    assert.match(d1, /workspace_id = \? AND person_id = \? AND conversation_id = \? AND reply_draft_id = \?/);
    assert.match(types, /export type SendDecisionHistoryItem = \{/);
    assert.doesNotMatch(types, /SendDecisionHistoryItem[\s\S]*idempotencyKey/);
  });

  it("keeps route documentation and endpoint metadata aligned", () => {
    const contracts = read("src/lib/contracts.ts"); const apiDesign = read("docs/api-design.md"); const localApiCheck = read("docs/local-api-check.md"); const testing = read("docs/testing.md");
    assert.match(contracts, /operation: "replyDrafts\.sendDecisions\.list"/);
    assert.match(contracts, /requiredFields: \["replyDraftId", "workspaceId", "personId", "conversationId"\]/);
    assert.match(apiDesign, /The history response is a sanitized audit projection/);
    assert.match(localApiCheck, /send-decisions\?workspaceId=ws_demo&personId=\{personId\}&conversationId=\{conversationId\}/);
    assert.match(testing, /Send decision history route requires `workspaceId \+ personId \+ conversationId` before returning audit records/);
  });
});
