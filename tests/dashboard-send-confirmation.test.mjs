import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("dashboard send confirmation summary", () => {
  it("keeps visible recipient, conversation, channel, and draft hash before send", () => {
    const dashboardClient = read("src/app/dashboard-client.tsx");
    const styles = read("src/app/styles.css");
    const dashboardDoc = read("docs/operator-dashboard.md");

    assert.match(dashboardClient, /aria-label="send confirmation summary"/);
    assert.match(dashboardClient, /Send Confirmation/);
    assert.match(dashboardClient, /selectedConversation\.displayName/);
    assert.match(dashboardClient, /selectedConversation\.conversationId/);
    assert.match(dashboardClient, /selectedConversation\.channel/);
    assert.match(dashboardClient, /selectedConversation\.replyDraft\?\.contentHash/);
    assert.match(styles, /\.send-confirmation-card/);
    assert.match(dashboardDoc, /Send Confirmation Summary/);
    assert.match(dashboardDoc, /not a replacement for the API send gate/);
  });
});
