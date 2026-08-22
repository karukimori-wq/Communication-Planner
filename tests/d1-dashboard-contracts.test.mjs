import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe,it } from "node:test";
function read(path){return readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
describe("D1 dashboard contracts",()=>{
 it("projects dashboard from D1 in production instead of memory",()=>{const route=read("src/app/api/dashboard/route.ts"),projection=read("src/lib/persistence/d1-dashboard.ts");assert.match(route,/getPersistenceReadiness/);assert.match(route,/readiness\.driver==="d1"/);assert.match(route,/getD1DashboardSnapshot/);assert.match(route,/persistenceDriver:"d1"/);assert.match(projection,/FROM conversations/);assert.match(projection,/conversation_contexts/);assert.match(projection,/reply_drafts/);assert.match(projection,/safety_checks/);assert.match(projection,/reply_send_decisions/);});
 it("keeps every dashboard context and safety lookup person scoped",()=>{const p=read("src/lib/persistence/d1-dashboard.ts");assert.match(p,/conversation_contexts WHERE workspace_id=\? AND person_id=\?/);assert.match(p,/topics WHERE workspace_id=\? AND person_id=\?/);assert.match(p,/reply_drafts WHERE workspace_id=\? AND person_id=\? AND conversation_id=\?/);assert.match(p,/safety_checks WHERE workspace_id=\? AND person_id=\? AND conversation_id=\? AND reply_draft_id=\?/);assert.match(p,/reply_send_decisions WHERE workspace_id=\? AND person_id=\? AND conversation_id=\? AND reply_draft_id=\?/);});
 it("derives send readiness from a fresh passing content hash",()=>{const p=read("src/lib/persistence/d1-dashboard.ts");assert.match(p,/contentHash\(draft\.body\)/);assert.match(p,/safety\.checked_content_hash===hash/);assert.match(p,/STALE_SAFETY_CHECK/);assert.match(p,/REPLY_DRAFT_ALREADY_SENT/);});
});
