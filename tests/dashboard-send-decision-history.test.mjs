import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("dashboard send decision history", () => {
  it("surfaces scoped send decision audit details without unlocking send", () => {
    const dashboardTypes = read("src/lib/dashboard.ts");
    const dashboardSendHistory = read("src/lib/dashboard-send-history.ts");
    const dashboardRoute = read("src/app/api/dashboard/route.ts");
    const page = read("src/app/page.tsx");
    const dashboardClient = read("src/app/dashboard-client.tsx");
    const styles = read("src/app/styles.css");
    const dashboardDoc = read("docs/operator-dashboard.md");

    assert.match(dashboardTypes, /sendDecisions\?: DashboardSendDecision\[\]/);
    assert.match(dashboardSendHistory, /getReplySendDecisions\(\{/);
    assert.match(dashboardSendHistory, /sendDecisions: sendDecisions\.map/);
    assert.match(dashboardSendHistory, /adapterDelivery\.deliveryMode/);
    assert.match(dashboardSendHistory, /adapterDelivery\.adapterReference/);
    assert.match(dashboardRoute, /withDashboardSendDecisionHistory\(await getDashboardSnapshot\(workspaceId\)\)/);
    assert.match(page, /withDashboardSendDecisionHistory\(await getDashboardSnapshot\(dashboardSeedWorkspaceId\)\)/);
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
