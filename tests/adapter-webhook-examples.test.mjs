import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function jsonBlocks(markdown) {
  return [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
}

describe("adapter webhook examples", () => {
  it("documents parseable request and expected normalization examples", () => {
    const doc = read("docs/adapter-webhook-examples.md");
    const blocks = jsonBlocks(doc);

    assert.equal(blocks.length, 6);
    assert.deepEqual(
      blocks.filter((_, index) => index % 2 === 1).map((block) => block.channel),
      ["line", "x", "instagram"]
    );
  });

  it("keeps webhook examples aligned with implemented routes and normalizer keys", () => {
    const doc = read("docs/adapter-webhook-examples.md");
    const normalizer = read("src/lib/adapters/webhook.ts");
    const routeFactory = read("src/lib/adapters/webhook-route.ts");

    for (const path of [
      "/api/adapters/line/webhook",
      "/api/adapters/x/webhook",
      "/api/adapters/instagram/webhook"
    ]) {
      assert.match(doc, new RegExp(path.replaceAll("/", "\\/")));
    }

    for (const key of [
      "workspaceId",
      "tenantId",
      "teamId",
      "events",
      "messages",
      "entries",
      "externalUserId",
      "userId",
      "senderId",
      "source",
      "sender",
      "message",
      "text",
      "body",
      "conversationId",
      "threadId"
    ]) {
      assert.match(normalizer, new RegExp(`"${key}"`));
    }

    assert.match(routeFactory, /eventName: "communication\.message\.received\.v1"/);
    assert.match(routeFactory, /ingestChannelMessage\(adapter\.normalizeInbound\(normalized\.event\)\)/);
  });

  it("documents required webhook error codes", () => {
    const doc = read("docs/adapter-webhook-examples.md");
    const normalizer = read("src/lib/adapters/webhook.ts");
    const routeFactory = read("src/lib/adapters/webhook-route.ts");

    for (const code of [
      "INVALID_JSON",
      "INVALID_WEBHOOK_PAYLOAD",
      "MISSING_WORKSPACE_ID",
      "MISSING_EXTERNAL_USER_ID",
      "MISSING_MESSAGE_BODY",
      "UNSUPPORTED_CHANNEL"
    ]) {
      assert.match(doc, new RegExp(code));
      assert.match(`${normalizer}\n${routeFactory}`, new RegExp(code));
    }
  });
});
