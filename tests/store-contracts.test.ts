import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  canSendReplyDraft,
  createReplyDraft,
  createSafetyCheck,
  getPersonContext,
  ingestChannelMessage,
  resetStoreForTests,
  store
} from "../src/lib/store";

describe("Communication Planner store contracts", () => {
  beforeEach(() => {
    resetStoreForTests();
  });

  it("scopes conversation context by workspaceId and personId", () => {
    ingestChannelMessage({
      workspaceId: "workspace-a",
      personId: "person-a",
      channel: "line",
      externalUserId: "line-user-a",
      externalThreadId: "thread-a",
      body: "Person A context"
    });
    ingestChannelMessage({
      workspaceId: "workspace-a",
      personId: "person-b",
      channel: "line",
      externalUserId: "line-user-b",
      externalThreadId: "thread-b",
      body: "Person B context"
    });

    assert.equal(getPersonContext("workspace-a", "person-a")?.summary, "Person A context");
    assert.equal(getPersonContext("workspace-a", "person-b")?.summary, "Person B context");
    assert.equal(getPersonContext("workspace-b", "person-a"), undefined);
  });

  it("rejects reply draft creation when conversation does not belong to the person", async () => {
    const ingested = ingestChannelMessage({
      workspaceId: "workspace-a",
      personId: "person-a",
      channel: "instagram",
      externalUserId: "ig-user-a",
      externalThreadId: "ig-thread-a",
      body: "Initial message"
    });

    const draft = await createReplyDraft({
      workspaceId: "workspace-a",
      personId: "person-b",
      conversationId: ingested.conversation.conversationId,
      purpose: "follow up"
    });

    assert.equal(draft, null);
  });

  it("requires a passed SafetyCheck before send", async () => {
    const ingested = ingestChannelMessage({
      workspaceId: "workspace-a",
      personId: "person-a",
      channel: "x",
      externalUserId: "x-user-a",
      externalThreadId: "x-thread-a",
      body: "Initial message"
    });
    const draft = await createReplyDraft({
      workspaceId: "workspace-a",
      personId: "person-a",
      conversationId: ingested.conversation.conversationId,
      purpose: "reply",
      body: "Safe reply"
    });

    assert.ok(draft);
    assert.equal(canSendReplyDraft(draft.replyDraftId).code, "SAFETY_CHECK_REQUIRED");

    await createSafetyCheck(draft.replyDraftId, { status: "failed", issues: ["needs review"] });
    assert.equal(canSendReplyDraft(draft.replyDraftId).code, "SAFETY_CHECK_FAILED");

    await createSafetyCheck(draft.replyDraftId, { status: "passed" });
    assert.equal(canSendReplyDraft(draft.replyDraftId).ok, true);
  });

  it("preserves the original conversation channel for outbound sends", async () => {
    const ingested = ingestChannelMessage({
      workspaceId: "workspace-a",
      personId: "person-a",
      channel: "line",
      externalUserId: "line-user-a",
      externalThreadId: "line-thread-a",
      body: "Initial message"
    });
    const draft = await createReplyDraft({
      workspaceId: "workspace-a",
      personId: "person-a",
      conversationId: ingested.conversation.conversationId,
      purpose: "reply",
      body: "Outbound reply"
    });

    assert.ok(draft);
    await createSafetyCheck(draft.replyDraftId, { status: "passed" });

    ingestChannelMessage({
      workspaceId: draft.workspaceId,
      personId: draft.personId,
      conversationId: draft.conversationId,
      channel: ingested.conversation.channel,
      externalUserId: `person:${draft.personId}`,
      externalThreadId: ingested.conversation.externalThreadId,
      direction: "outbound",
      body: draft.body
    });

    const outbound = store.messages.find((message) => message.direction === "outbound");
    assert.equal(outbound?.channel, "line");
  });
});
