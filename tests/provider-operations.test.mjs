import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { describe, it, afterEach } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadTsModule(path) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replace(/import type [\s\S]*?;\n/g, "");
  const executable = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const context = {
    Buffer,
    Date,
    Map,
    Number,
    exports: {},
    globalThis: {},
    module: { exports: {} },
    process,
    require
  };

  context.exports = context.module.exports;
  vm.runInNewContext(executable, context);
  return context.module.exports;
}

function restoreEnv(keys) {
  for (const key of keys) {
    delete process.env[key];
  }
}

describe("provider operation guards", () => {
  afterEach(() => {
    restoreEnv([
      "COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION",
      "COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY",
      "COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_WINDOW_MS",
      "COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_MAX",
      "LINE_CHANNEL_SECRET"
    ]);
  });

  it("verifies LINE webhook HMAC signatures when enforcement is enabled", () => {
    const { verifyAdapterWebhookSignature } = loadTsModule("src/lib/adapters/security.ts");
    const rawBody = JSON.stringify({ workspaceId: "ws_demo", events: [] });
    process.env.LINE_CHANNEL_SECRET = "line_secret";
    process.env.COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION = "enabled";
    const signature = createHmac("sha256", "line_secret").update(rawBody).digest("base64");
    const request = new Request("https://example.test/api/adapters/line/webhook", {
      method: "POST",
      headers: { "x-line-signature": signature },
      body: rawBody
    });

    const result = verifyAdapterWebhookSignature({ channel: "line", request, rawBody });

    assert.equal(result.ok, true);
    assert.equal(result.enforced, true);
    assert.equal(result.signatureHeader, "x-line-signature");
  });

  it("rejects invalid provider webhook signatures with stable error codes", () => {
    const { verifyAdapterWebhookSignature } = loadTsModule("src/lib/adapters/security.ts");
    const rawBody = JSON.stringify({ workspaceId: "ws_demo", events: [] });
    process.env.LINE_CHANNEL_SECRET = "line_secret";
    process.env.COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION = "enabled";
    const request = new Request("https://example.test/api/adapters/line/webhook", {
      method: "POST",
      headers: { "x-line-signature": "invalid" },
      body: rawBody
    });

    assert.equal(verifyAdapterWebhookSignature({ channel: "line", request, rawBody }).code, "ADAPTER_SIGNATURE_INVALID");
  });

  it("enforces provider send rate limits per workspace, channel, and external user", () => {
    const { checkProviderRateLimit, resetProviderRateLimitForTests } = loadTsModule("src/lib/adapters/rate-limit.ts");
    process.env.COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY = "enabled";
    process.env.COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_MAX = "1";
    resetProviderRateLimitForTests();

    const input = { workspaceId: "ws_demo", channel: "line", externalUserId: "line_user_1", nowMs: 1_000 };
    assert.equal(checkProviderRateLimit(input).ok, true);
    const blocked = checkProviderRateLimit({ ...input, nowMs: 2_000 });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, "ADAPTER_RATE_LIMITED");
    assert.equal(blocked.retryable, true);
  });

  it("maps provider errors into stable Communication Planner adapter outcomes", () => {
    const { mapProviderError } = loadTsModule("src/lib/adapters/errors.ts");

    assert.equal(mapProviderError({ status: 401, code: "AUTH_FAILED" }).code, "ADAPTER_AUTH_FAILED");
    assert.equal(mapProviderError({ code: "SIGNATURE_INVALID" }).code, "ADAPTER_SIGNATURE_INVALID");
    assert.equal(mapProviderError({ status: 429 }).code, "ADAPTER_RATE_LIMITED");
    assert.equal(mapProviderError({ status: 503 }).retryable, true);
    assert.equal(mapProviderError({ status: 400 }).code, "ADAPTER_SEND_REJECTED");
  });
});
