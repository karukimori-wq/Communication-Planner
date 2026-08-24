import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("adapter readiness contract guards", () => {
  it("exposes provider readiness without leaking secret values", () => {
    const route = read("src/app/api/adapters/readiness/route.ts");
    const readiness = read("src/lib/adapters/readiness.ts");
    const contracts = read("src/lib/contracts.ts");
    const apiDesign = read("docs/api-design.md");

    assert.match(route, /getAllProviderSendReadiness/);
    assert.match(route, /requested/);
    assert.match(route, /effectiveDefault/);
    assert.match(route, /summary/);
    assert.match(route, /totalChannels/);
    assert.match(route, /liveReadyChannels/);
    assert.match(route, /blockedChannels/);
    assert.match(route, /blockerCount/);
    assert.match(route, /allLiveReady/);
    assert.match(readiness, /credentialRequirements/);
    assert.match(readiness, /webhookSignatureSecrets/);
    assert.match(readiness, /providerVerificationRequirements/);
    assert.match(readiness, /operationalRequirements/);
    assert.match(readiness, /rateLimitPolicy/);
    assert.match(readiness, /blockers/);
    assert.match(readiness, /LINE_CHANNEL_ACCESS_TOKEN/);
    assert.match(readiness, /X_API_KEY/);
    assert.match(readiness, /INSTAGRAM_PAGE_ACCESS_TOKEN/);
    assert.doesNotMatch(route, /process\.env\.[A-Z_]+/);
    assert.match(contracts, /path: "\/api\/adapters\/readiness"/);
    assert.match(contracts, /adapters\.readiness\.read/);
    assert.match(contracts, /without returning secret values/);
    assert.match(apiDesign, /GET \/api\/adapters\/readiness/);
    assert.match(apiDesign, /must not return secret values/);
    assert.match(apiDesign, /readiness summary/);
  });

  it("keeps live provider sends blocked behind production gates", () => {
    const send = read("src/lib/adapters/send.ts");
    const readiness = read("src/lib/adapters/readiness.ts");
    const readinessDoc = read("docs/production-adapter-readiness.md");
    const safetyRules = read("docs/safety-rules.md");
    const testing = read("docs/testing.md");

    assert.match(send, /getProviderSendReadiness/);
    assert.match(send, /readiness\.effectiveDeliveryMode/);
    assert.match(readiness, /COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE/);
    assert.match(readiness, /COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION/);
    assert.match(readiness, /COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY/);
    assert.match(readiness, /COMMUNICATION_PLANNER_PROVIDER_ERROR_MAPPING/);
    assert.match(readiness, /LINE_PROVIDER_INBOUND_VERIFIED/);
    assert.match(readiness, /INSTAGRAM_PROVIDER_OUTBOUND_VERIFIED/);
    assert.match(readiness, /getProviderRateLimitPolicy/);
    assert.match(readiness, /getWebhookSignatureSecretStatus/);
    assert.match(readiness, /requestedDeliveryMode === "live" && liveSendReady \? "live" : "dry_run"/);
    assert.match(readinessDoc, /If any requirement is missing, the effective delivery mode remains `dry_run`/);
    assert.match(safetyRules, /provider-specific inbound\/outbound verification/);
    assert.match(testing, /Provider send falls back to `dry_run` until live-send readiness gates pass/);
  });

  it("records the seven remaining OSS and provider-readiness steps as done", () => {
    const ossAdoption = read("docs/oss-adoption.md");
    const sprint = read("docs/sprint-1.md");
    const adapterDoc = read("docs/channel-adapters.md");

    assert.match(ossAdoption, /2026-08-17 Code Structure Review/);
    assert.match(ossAdoption, /chatwoot\/chatwoot/);
    assert.match(ossAdoption, /Shudesu\/line-harness-oss/);
    assert.match(ossAdoption, /Shudesu\/x-harness-oss/);
    assert.match(ossAdoption, /Shudesu\/ig-harness-oss/);
    assert.match(ossAdoption, /license is explicitly recorded/);
    assert.match(ossAdoption, /fallback remains `dry_run`/);
    assert.match(ossAdoption, /executable request\/response tests remain the next expansion/);
    assert.match(sprint, /Review Chatwoot unified inbox and conversation patterns \| Done/);
    assert.match(sprint, /Review LINE Harness adapter architecture \| Done/);
    assert.match(sprint, /Review X Harness adapter architecture \| Done/);
    assert.match(sprint, /Review IG Harness adapter architecture \| Done/);
    assert.match(sprint, /Add provider production readiness endpoint \| Done/);
    assert.match(sprint, /Add live send fallback gate \| Done/);
    assert.match(sprint, /Add Harness OSS structure review decisions \| Done/);
    assert.match(adapterDoc, /GET \/api\/adapters\/readiness/);
    assert.match(adapterDoc, /production-adapter-readiness\.md/);
  });
});
