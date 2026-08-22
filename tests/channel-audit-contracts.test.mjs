import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
function read(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("channel audit contract guards", () => {
  it("validates channel event channel and direction before ingestion", () => {
    const route = read("src/app/api/channel-events/messages/route.ts"); const d1 = read("src/lib/persistence/d1.ts"); const apiDesign = read("docs/api-design.md");
    assert.match(route, /const supportedChannels = new Set<Channel>\(\["line", "x", "instagram", "unknown"\]\)/); assert.match(route, /const supportedDirections = new Set<MessageDirection>\(\["inbound", "outbound"\]\)/);
    assert.match(route, /function normalizeChannel/); assert.match(route, /function normalizeDirection/); assert.match(route, /UNSUPPORTED_CHANNEL/); assert.match(route, /UNSUPPORTED_DIRECTION/);
    assert.match(route, /const input = \{ workspaceId, channel, externalUserId,/); assert.match(route, /body: messageBody, direction,/); assert.match(route, /ingestChannelMessage\(input\)/); assert.match(route, /D1CommunicationRepository\(db\)\.ingestChannelMessage/);
    assert.match(d1, /type PersistedChannel = "line" \| "x" \| "instagram"/); assert.match(d1, /channel: PersistedChannel/); assert.match(d1, /direction: "inbound" \| "outbound"/);
    assert.match(apiDesign, /`channel` must be one of `line`, `x`, `instagram`, or `unknown`/); assert.match(apiDesign, /`direction` must be `inbound` or `outbound`/);
  });

  it("records send decision channel and adapter delivery as immutable audit input", () => {
    const store = read("src/lib/store.ts"); const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts"); const types = read("src/lib/types.ts"); const safetyRules = read("docs/safety-rules.md"); const apiDesign = read("docs/api-design.md");
    assert.match(types, /channel\?: Channel/); assert.match(types, /channelConfirmed: true/); assert.match(types, /adapterDelivery: \{/); assert.match(store, /adapterDelivery: ReplySendDecision\["adapterDelivery"\]/); assert.match(store, /channel: input\.channel/); assert.match(store, /adapterDelivery: input\.adapterDelivery/); assert.match(store, /channelConfirmed: true/);
    assert.match(sendRoute, /getChannelIdentityForPerson\(decision\.draft\.workspaceId, decision\.draft\.personId, conversation\.channel\)/); assert.match(sendRoute, /sendThroughChannelAdapter/); assert.match(sendRoute, /CHANNEL_IDENTITY_REQUIRED/); assert.match(sendRoute, /channel: conversation\.channel,\n    adapterDelivery: adapterDelivery\.result/); assert.doesNotMatch(sendRoute, /sendDecision\.channel = conversation\.channel/); assert.doesNotMatch(sendRoute, /sendDecision\.checks\.channelConfirmed = true/);
    assert.match(safetyRules, /confirmed original conversation `channel`/); assert.match(safetyRules, /ReplySendDecision\.adapterDelivery/); assert.match(apiDesign, /`sendDecision\.channel` value is written when the decision is recorded/); assert.match(apiDesign, /sendDecision\.adapterDelivery/);
  });
});
