"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot } from "@/lib/dashboard";

export function CommunicationDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);
  const [selectedConversationId, setSelectedConversationId] = useState(snapshot.conversations[0]?.conversationId ?? "");
  const [scopeConfirmed, setScopeConfirmed] = useState(true);
  const [channelConfirmed, setChannelConfirmed] = useState(true);
  const [contextPinned, setContextPinned] = useState(true);
  const [safetyPassed, setSafetyPassed] = useState(snapshot.conversations[0]?.safety.latestSafetyCheckStatus === "passed");
  const [draftBody, setDraftBody] = useState(snapshot.conversations[0]?.replyDraft?.body ?? "");
  const [actionStatus, setActionStatus] = useState("Ready");
  const [isBusy, setIsBusy] = useState(false);

  const selectedConversation = useMemo(
    () =>
      currentSnapshot.conversations.find((conversation) => conversation.conversationId === selectedConversationId) ??
      currentSnapshot.conversations[0],
    [selectedConversationId, currentSnapshot.conversations]
  );

  useEffect(() => {
    setDraftBody(selectedConversation?.replyDraft?.body ?? "");
    setSafetyPassed(selectedConversation?.safety.latestSafetyCheckStatus === "passed");
  }, [selectedConversation]);

  if (!selectedConversation) {
    return (
      <section className="empty-panel">
        <h2>No conversations yet</h2>
        <p>Connect a LINE, X, or Instagram adapter webhook to start building a person-scoped inbox.</p>
      </section>
    );
  }

  async function refreshDashboard() {
    const response = await fetch(`/api/dashboard?workspaceId=${encodeURIComponent(currentSnapshot.workspaceId)}`);
    const envelope = await response.json();
    if (!response.ok || envelope.status !== "success") {
      throw new Error(envelope.error?.message ?? "Dashboard refresh failed");
    }
    setCurrentSnapshot(envelope.data.snapshot);
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setIsBusy(true);
    setActionStatus(`${label}...`);
    try {
      await action();
      await refreshDashboard();
      setActionStatus(`${label} done`);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : `${label} failed`);
    } finally {
      setIsBusy(false);
    }
  }

  async function updateDraft() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: currentSnapshot.workspaceId,
        personId: selectedConversation.personId,
        conversationId: selectedConversation.conversationId,
        body: draftBody
      })
    });
    const envelope = await response.json();
    if (!response.ok || envelope.status !== "success") {
      throw new Error(envelope.error?.message ?? "Draft update failed");
    }
  }

  async function runSafetyCheck() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}/safety-check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: currentSnapshot.workspaceId,
        personId: selectedConversation.personId,
        conversationId: selectedConversation.conversationId,
        status: "passed"
      })
    });
    const envelope = await response.json();
    if (!response.ok || envelope.status !== "success") {
      throw new Error(envelope.error?.message ?? "SafetyCheck failed");
    }
  }

  async function sendReply() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId: currentSnapshot.workspaceId,
        personId: selectedConversation.personId,
        conversationId: selectedConversation.conversationId,
        channel: selectedConversation.channel
      })
    });
    const envelope = await response.json();
    if (!response.ok || envelope.status !== "success") {
      throw new Error(envelope.error?.message ?? "Send failed");
    }
  }

  const gateChecks = [
    { id: "scope-confirmed", label: "workspace + person + conversation confirmed", checked: scopeConfirmed, setChecked: setScopeConfirmed },
    { id: "channel-confirmed", label: `${selectedConversation.channel} channel confirmed`, checked: channelConfirmed, setChecked: setChannelConfirmed },
    { id: "context-pinned", label: "same-person context pinned", checked: contextPinned, setChecked: setContextPinned },
    { id: "safety-passed", label: "latest SafetyCheck passed for current draft hash", checked: safetyPassed, setChecked: setSafetyPassed }
  ];
  const sendUnlocked = gateChecks.every((check) => check.checked) && selectedConversation.safety.sendReady;

  return (
    <div className="dashboard-grid">
      <section className="panel inbox-panel" aria-label="inbox">
        <div className="panel-heading">
          <p className="eyebrow">Inbox</p>
          <h2>Conversations</h2>
        </div>
        <div className="conversation-list">
          {currentSnapshot.conversations.map((conversation) => (
            <button
              type="button"
              className={conversation.conversationId === selectedConversation.conversationId ? "conversation-item active" : "conversation-item"}
              key={conversation.conversationId}
              onClick={() => {
                setSelectedConversationId(conversation.conversationId);
                setActionStatus("Ready");
              }}
            >
              <span className="conversation-topline">
                <strong>{conversation.displayName}</strong>
                <small>{conversation.channel}</small>
              </span>
              <span>{conversation.lastMessagePreview}</span>
              <small>{conversation.waitingState}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel context-panel" aria-label="person context">
        <div className="panel-heading">
          <p className="eyebrow">Person Context</p>
          <h2>{selectedConversation.displayName}</h2>
        </div>
        <p className="context-summary">{selectedConversation.context.summary}</p>
        <dl className="scope-list">
          <div>
            <dt>Person</dt>
            <dd>{selectedConversation.personId}</dd>
          </div>
          <div>
            <dt>Conversation</dt>
            <dd>{selectedConversation.conversationId}</dd>
          </div>
          <div>
            <dt>Channel</dt>
            <dd>{selectedConversation.channel}</dd>
          </div>
        </dl>
        <div className="insight-columns">
          <InsightList title="Topics" items={selectedConversation.context.topics} />
          <InsightList title="Promises" items={selectedConversation.context.promises} />
          <InsightList title="Next Actions" items={selectedConversation.context.nextActions} />
        </div>
      </section>

      <section className="panel reply-panel" aria-label="reply safety">
        <div className="panel-heading">
          <p className="eyebrow">Reply Draft</p>
          <h2>Review before send</h2>
        </div>
        {selectedConversation.replyDraft ? (
          <div className="draft-editor">
            <label htmlFor="reply-draft-body">Draft body</label>
            <textarea id="reply-draft-body" value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={7} />
            <small>
              Purpose: {selectedConversation.replyDraft.purpose} / Hash: {selectedConversation.replyDraft.contentHash} / Status:{" "}
              {selectedConversation.replyDraft.status}
            </small>
            <button
              className="secondary-button"
              disabled={isBusy || draftBody.trim().length === 0}
              onClick={() => runAction("Draft update", updateDraft)}
              type="button"
            >
              Save draft
            </button>
          </div>
        ) : (
          <div className="draft-box">
            <p>No reply draft yet.</p>
          </div>
        )}

        <div className="gate-box" data-send-gate={sendUnlocked ? "unlocked" : "locked"}>
          <div className="gate-header">
            <div>
              <p className="eyebrow">Safety Gate</p>
              <strong>{sendUnlocked ? "Send unlocked" : "Send locked"}</strong>
            </div>
            <span className={sendUnlocked ? "status-pill success" : "status-pill warning"}>
              {sendUnlocked ? "ready" : "blocked"}
            </span>
          </div>
          <p className="gate-reason">API readiness: {selectedConversation.safety.blockedReason ?? "ready"}</p>
          <div className="check-list">
            {gateChecks.map((check) => (
              <label key={check.id} className="check-row" htmlFor={check.id}>
                <input
                  id={check.id}
                  type="checkbox"
                  checked={check.checked}
                  onChange={(event) => check.setChecked(event.target.checked)}
                />
                <span>{check.label}</span>
              </label>
            ))}
          </div>
          <div className="action-row">
            <button
              className="secondary-button"
              disabled={isBusy || !selectedConversation.replyDraft}
              onClick={() => runAction("SafetyCheck", runSafetyCheck)}
              type="button"
            >
              Run SafetyCheck
            </button>
            <button
              className="send-button"
              disabled={isBusy || !sendUnlocked}
              onClick={() => runAction("Send", sendReply)}
              type="button"
            >
              Send reply
            </button>
          </div>
          <p className="action-status" aria-live="polite">
            {actionStatus}
          </p>
        </div>
      </section>

      <section className="panel operations-panel" aria-label="adapter and AI platform status">
        <div className="panel-heading">
          <p className="eyebrow">Operations</p>
          <h2>Adapters and AI tasks</h2>
        </div>
        <div className="status-grid">
          {currentSnapshot.adapterStates.map((adapter) => (
            <div className="status-row" key={adapter.channel}>
              <span>{adapter.channel}</span>
              <strong>{adapter.status}</strong>
              <small>{adapter.ossReference}</small>
            </div>
          ))}
        </div>
        <div className="ai-task-list">
          {currentSnapshot.aiTasks.map((task) => (
            <div className="ai-task" key={task.operation}>
              <strong>{task.operation}</strong>
              <span>{task.boundary}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="insight-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>No records.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
