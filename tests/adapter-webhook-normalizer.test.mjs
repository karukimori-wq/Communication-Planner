import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadNormalizer() {
  const source = readFileSync(new URL("../src/lib/adapters/webhook.ts", import.meta.url), "utf8");
  const prepared = source
    .replace(/import \{ getAdapter \} from "@\/lib\/adapters";\n/, "")
    .replace(/import type [\s\S]*?;\n/g, "")
    .replace("export function normalizeAdapterWebhookPayload", "function normalizeAdapterWebhookPayload");

  const executable = ts.transpileModule(prepared, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText.concat("\nexports.normalizeAdapterWebhookPayload = normalizeAdapterWebhookPayload;\n");

  const context = {
    exports: {},
    getAdapter(channel) {
      return channel === "unknown" ? null : { channel };
    }
  };
  vm.runInNewContext(executable, context);
  return context.exports.normalizeAdapterWebhookPayload;
}

const normalizeAdapterWebhookPayload = loadNormalizer();

describe("adapter webhook normalizer", () => {
  it("normalizes LINE event arrays into provider inbound events", () => {
    const result = normalizeAdapterWebhookPayload("line", {
      workspaceId: "ws_demo",
      events: [
        {
          eventId: "line_event_1",
          source: { userId: "line_user_1" },
          message: { id: "line_message_1", text: "Hello from LINE" }
        }
      ]
    });

    assert.equal(result.ok, true);
    assert.equal(result.event.workspaceId, "ws_demo");
    assert.equal(result.event.providerEventId, "line_event_1");
    assert.equal(result.event.externalUserId, "line_user_1");
    assert.equal(result.event.body, "Hello from LINE");
  });

  it("normalizes X message arrays with sender and conversation ids", () => {
    const result = normalizeAdapterWebhookPayload("x", {
      workspaceId: "ws_demo",
      messages: [
        {
          messageId: "x_message_1",
          sender: { id: "x_user_1", username: "x_demo" },
          conversationId: "x_thread_1",
          text: "Hello from X"
        }
      ]
    });

    assert.equal(result.ok, true);
    assert.equal(result.event.providerEventId, "x_message_1");
    assert.equal(result.event.externalUserId, "x_user_1");
    assert.equal(result.event.externalThreadId, "x_thread_1");
    assert.equal(result.event.displayName, "x_demo");
    assert.equal(result.event.body, "Hello from X");
  });

  it("normalizes Instagram entry arrays with nested thread and message data", () => {
    const result = normalizeAdapterWebhookPayload("instagram", {
      workspaceId: "ws_demo",
      entries: [
        {
          id: "ig_event_1",
          sender: { id: "ig_user_1", username: "ig_demo" },
          thread: { id: "ig_thread_1" },
          message: { id: "ig_message_1", text: "Hello from Instagram" }
        }
      ]
    });

    assert.equal(result.ok, true);
    assert.equal(result.event.providerEventId, "ig_event_1");
    assert.equal(result.event.externalUserId, "ig_user_1");
    assert.equal(result.event.externalThreadId, "ig_thread_1");
    assert.equal(result.event.displayName, "ig_demo");
    assert.equal(result.event.body, "Hello from Instagram");
  });

  it("returns stable validation error codes", () => {
    assert.equal(normalizeAdapterWebhookPayload("line", null).code, "INVALID_WEBHOOK_PAYLOAD");
    assert.equal(normalizeAdapterWebhookPayload("line", {}).code, "MISSING_WORKSPACE_ID");
    assert.equal(normalizeAdapterWebhookPayload("line", { workspaceId: "ws_demo", body: "Hello" }).code, "MISSING_EXTERNAL_USER_ID");
    assert.equal(
      normalizeAdapterWebhookPayload("line", { workspaceId: "ws_demo", externalUserId: "line_user_1" }).code,
      "MISSING_MESSAGE_BODY"
    );
  });
});
