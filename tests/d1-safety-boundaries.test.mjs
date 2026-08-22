import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe,it } from "node:test";
function read(path){return readFileSync(new URL(`../${path}`,import.meta.url),"utf8");}
describe("D1 anti-misdelivery safety boundaries",()=>{
  it("scopes context, drafts, safety and send decisions to the same person and conversation",()=>{const d=read("src/lib/persistence/d1.ts");assert.match(d,/conversation_contexts[\s\S]*workspace_id=\? AND person_id=\?/);assert.match(d,/reply_drafts[\s\S]*workspace_id=\? AND person_id=\? AND conversation_id=\?/);assert.match(d,/safety_checks[\s\S]*workspace_id=\? AND person_id=\? AND conversation_id=\?/);assert.match(d,/reply_send_decisions[\s\S]*workspace_id=\? AND person_id=\? AND conversation_id=\? AND reply_draft_id=\?/);assert.match(d,/CONVERSATION_SCOPE_MISMATCH/);assert.match(d,/SEND_CHANNEL_MISMATCH/);});
  it("rejects missing, failed, stale and already-sent safety states",()=>{const d=read("src/lib/persistence/d1.ts"),r=read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");for(const code of ["SAFETY_CHECK_REQUIRED","SAFETY_CHECK_FAILED","STALE_SAFETY_CHECK","REPLY_DRAFT_ALREADY_SENT"]){assert.match(d,new RegExp(code));assert.match(r,new RegExp(code));}assert.match(d,/checked_content_hash/);assert.match(d,/hashText\(d\.body\)/);});
});
