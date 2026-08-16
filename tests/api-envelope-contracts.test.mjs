import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("API envelope contract guards", () => {
  it("keeps HTTP helpers aligned on CORS, trace metadata, and error envelope shape", () => {
    const http = read("src/lib/http.ts");
    const cors = read("src/lib/cors.ts");

    assert.match(http, /traceId: request\.headers\.get\("x-trace-id"\) \?\? crypto\.randomUUID\(\)/);
    assert.match(http, /correlationId: request\.headers\.get\("x-correlation-id"\) \?\? undefined/);
    assert.match(http, /sourceApp: request\.headers\.get\("x-source-app"\) \?\? undefined/);
    assert.match(http, /status: init\?\.status \?\? "success"/);
    assert.match(http, /data,/);
    assert.match(http, /eventName: init\?\.eventName/);
    assert.match(http, /timestamp: new Date\(\)\.toISOString\(\)/);
    assert.match(http, /status: "error"/);
    assert.match(http, /error,/);
    assert.match(http, /retryable: init\?\.retryable \?\? false/);
    assert.match(http, /NextResponse\.json\(body, \{ headers: withCors\(\) \}\)/);
    assert.match(http, /NextResponse\.json\(body, \{ status: httpStatus, headers: withCors\(\) \}\)/);
    assert.match(http, /return new Response\(null, \{ status: 204, headers: withCors\(\) \}\)/);

    assert.match(cors, /"Access-Control-Allow-Origin": "\*"/);
    assert.match(cors, /"Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS"/);
    assert.match(cors, /X-Trace-Id, X-Correlation-Id, X-Source-App/);
    assert.match(cors, /"Access-Control-Max-Age": "86400"/);
    assert.match(cors, /\.\.\.corsHeaders/);
    assert.match(cors, /\.\.\.headers/);
  });

  it("keeps request-scoped routes passing metadata and event names through the envelope", () => {
    const requestRoutes = [
      "src/app/api/channel-events/messages/route.ts",
      "src/lib/adapters/webhook-route.ts",
      "src/app/api/conversations/[conversationId]/reply-drafts/route.ts",
      "src/app/api/reply-drafts/[replyDraftId]/route.ts",
      "src/app/api/reply-drafts/[replyDraftId]/safety-check/route.ts",
      "src/app/api/reply-drafts/[replyDraftId]/send/route.ts",
      "src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts",
      "src/app/api/inbox/route.ts",
      "src/app/api/persons/[personId]/route.ts",
      "src/app/api/persons/[personId]/context/route.ts",
      "src/app/api/persons/[personId]/conversations/route.ts"
    ];

    for (const routePath of requestRoutes) {
      const route = read(routePath);
      assert.match(route, /const meta = requestMeta\(request\)/, `${routePath} must read request metadata`);
      assert.match(route, /fail\([^)]*meta\)/s, `${routePath} must include metadata in error responses`);
      assert.match(route, /ok\([\s\S]*(,\s*meta|,\s*\{\s*\.\.\.meta,\s*eventName:)/, `${routePath} must include metadata in success responses`);
    }

    assert.match(read("src/app/api/channel-events/messages/route.ts"), /communication\.message\.sent\.v1/);
    assert.match(read("src/app/api/channel-events/messages/route.ts"), /communication\.message\.received\.v1/);
    assert.match(read("src/lib/adapters/webhook-route.ts"), /communication\.message\.received\.v1/);
    assert.match(read("src/app/api/conversations/[conversationId]/reply-drafts/route.ts"), /communication\.reply_draft\.created\.v1/);
    assert.match(read("src/app/api/reply-drafts/[replyDraftId]/route.ts"), /communication\.reply_draft\.updated\.v1/);
    assert.match(read("src/app/api/reply-drafts/[replyDraftId]/safety-check/route.ts"), /communication\.reply_safety\.checked\.v1/);
    assert.match(read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts"), /communication\.message\.sent\.v1/);
  });

  it("keeps static contract endpoints inside the success envelope", () => {
    const endpointContractsRoute = read("src/app/api/contracts/endpoints/route.ts");
    const statusRoute = read("src/app/contracts/status/route.ts");
    const healthRoute = read("src/app/health/route.ts");
    const versionRoute = read("src/app/version/route.ts");

    for (const route of [endpointContractsRoute, statusRoute, healthRoute, versionRoute]) {
      assert.match(route, /import \{ ok \} from "@\/lib\/http"/);
      assert.match(route, /return ok\(/);
    }

    assert.match(endpointContractsRoute, /implementedCount/);
    assert.match(statusRoute, /endpointContractsPath/);
  });
});
