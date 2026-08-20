import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Platform Admin registration metadata", () => {
  it("exposes a machine-readable registration endpoint without secrets or business-owned records", () => {
    const route = read("src/app/api/platform-admin/registration/route.ts");
    const contracts = read("src/lib/contracts.ts");
    const registrationDoc = read("docs/platform-admin-registration.md");

    assert.match(route, /platformAdminRegistration/);
    assert.match(route, /requestMeta\(request\)/);
    assert.match(route, /ok\(platformAdminRegistration, meta\)/);
    assert.match(contracts, /export type PlatformAdminRegistration/);
    assert.match(contracts, /runtimeUrlEnvKey: "COMMUNICATION_PLANNER_BASE_URL"/);
    assert.match(contracts, /\/api\/platform-admin\/registration/);
    assert.match(contracts, /platformAdmin\.registration\.read/);
    assert.match(contracts, /prohibitedSourceOfTruth: prohibitedOwnedPayloadFields/);
    assert.match(registrationDoc, /GET \/api\/platform-admin\/registration/);
    assert.doesNotMatch(route, /process\.env\.[A-Z0-9_]*(SECRET|TOKEN|KEY)/);
  });
});
