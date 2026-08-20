import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("dashboard send decision history", () => {
  it("surfaces scoped send decision audit details without unlocking send", () => {
    const dashboardTypes = read("src/lib/dashboard.ts");
    const store = read("src/lib/store.ts");
    const dashboardClient = read("src/app/dashboard-client.tsx");
    const styles = read("src/app/styles.css");
    const dashboardDoc = read("docs/operator-dashboard.md");

    assert.match(dashboardTypes, /sendDecisions\?: DashboardSendDecision\[\]/);
    assert.match(store, /getReplySendDecisions\(\{/);
    assert.match(store, /adapterDelivery\.deliveryMode/);
    assert.match(store, /adapterDelivery\.adapterReference/);
    assert.match(dashboardClient, /aria-label="send decision history"/);
    assert.match(dashboardClient, /Send History/);
    assert.match(dashboardClient, /selectedConversation\.sendDecisions \?\? \[\]/);
    assert.match(dashboardClient, /decision\.safetyCheckId/);
    assert.match(dashboardClient, /decision\.contentHash/);
    assert.match(styles, /\.send-history-card/);
    assert.match(dashboardDoc, /Send Decision History/);
    assert.match(dashboardDoc, /does not unlock sending by itself/);
  });
});
