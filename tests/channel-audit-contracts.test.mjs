import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("channel audit contract guards", () => {
  it("validates channel event channel and direction before ingestion", () => {
    const route = read("src/app/api/channel-events/messages/route.ts");
    const apiDesign = read("docs/api-design.md");

    assert.match(route, /const supportedChannels = new Set<Channel>\(\["line", "x", "instagram", "unknown"\]\)/);
    assert.match(route, /const supportedDirections = new Set<MessageDirection>\(\["inbound", "outbound"\]\)/);
    assert.match(route, /function normalizeChannel/);
    assert.match(route, /function normalizeDirection/);
    assert.match(route, /UNSUPPORTED_CHANNEL/);
    assert.match(route, /UNSUPPORTED_DIRECTION/);
    assert.match(route, /channel,\n    externalUserId/);
    assert.match(route, /direction,/);
    assert.match(apiDesign, /`channel` must be one of `line`, `x`, `instagram`, or `unknown`/);
    assert.match(apiDesign, /`direction` must be `inbound` or `outbound`/);
  });

  it("records send decision channel as immutable audit input", () => {
    const store = read("src/lib/store.ts");
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");
    const types = read("src/lib/types.ts");
    const safetyRules = read("docs/safety-rules.md");
    const apiDesign = read("docs/api-design.md");

    assert.match(types, /channel\?: Channel/);
    assert.match(types, /channelConfirmed: true/);
    assert.match(store, /recordReplySendDecision\(input: \{\n  draft: ReplyDraft;\n  safetyCheck: SafetyCheck;\n  messageId: string;\n  channel: ReplySendDecision\["channel"\];\n\}\)/);
    assert.match(store, /channel: input\.channel/);
    assert.match(store, /channelConfirmed: true/);
    assert.match(store, /buildReplySendDecision\(input: \{\n  draft: ReplyDraft;\n  safetyCheck: SafetyCheck;\n  messageId: string;\n  channel: ReplySendDecision\["channel"\];\n\}\)/);
    assert.match(sendRoute, /recordReplySendDecision\(\{\n    draft: decision\.draft,\n    safetyCheck: decision\.safetyCheck,\n    messageId: sentMessage\.message\.messageId,\n    channel: conversation\.channel\n  \}\)/);
    assert.doesNotMatch(sendRoute, /sendDecision\.channel = conversation\.channel/);
    assert.doesNotMatch(sendRoute, /sendDecision\.checks\.channelConfirmed = true/);
    assert.match(safetyRules, /confirmed channel at record time/);
    assert.match(apiDesign, /`sendDecision\.channel` value is written when the decision is recorded/);
  });
});
