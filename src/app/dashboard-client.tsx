"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot } from "@/lib/dashboard";

type SuccessEnvelope<T> = { status: "success"; data: T };
type ErrorEnvelope = { status?: string; error?: { message?: string } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEnvelope<T>(value: unknown): SuccessEnvelope<T> | ErrorEnvelope {
  if (!isRecord(value)) return {};
  if (value.status === "success" && isRecord(value.data)) {
    return value as unknown as SuccessEnvelope<T>;
  }
  const error = isRecord(value.error) && typeof value.error.message === "string"
    ? { message: value.error.message }
    : undefined;
  return { status: typeof value.status === "string" ? value.status : undefined, error };
}

function errorMessage(envelope: SuccessEnvelope<unknown> | ErrorEnvelope, fallback: string) {
  return "error" in envelope ? envelope.error?.message ?? fallback : fallback;
}

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
    () => currentSnapshot.conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? currentSnapshot.conversations[0],
    [selectedConversationId, currentSnapshot.conversations]
  );

  useEffect(() => {
    setDraftBody(selectedConversation?.replyDraft?.body ?? "");
    setSafetyPassed(selectedConversation?.safety.latestSafetyCheckStatus === "passed");
  }, [selectedConversation]);

  if (!selectedConversation) {
    return <section className="empty-panel"><h2>No conversations yet</h2><p>Connect a LINE, X, or Instagram adapter webhook to start building a person-scoped inbox.</p></section>;
  }

  async function refreshDashboard() {
    const response = await fetch(`/api/dashboard?workspaceId=${encodeURIComponent(currentSnapshot.workspaceId)}`);
    const envelope = readEnvelope<{ snapshot: DashboardSnapshot }>(await response.json());
    if (!response.ok || envelope.status !== "success") throw new Error(errorMessage(envelope, "Dashboard refresh failed"));
    setCurrentSnapshot(envelope.data.snapshot);
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setIsBusy(true); setActionStatus(`${label}...`);
    try { await action(); await refreshDashboard(); setActionStatus(`${label} done`); }
    catch (error) { setActionStatus(error instanceof Error ? error.message : `${label} failed`); }
    finally { setIsBusy(false); }
  }

  async function updateDraft() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId: currentSnapshot.workspaceId, personId: selectedConversation.personId, conversationId: selectedConversation.conversationId, body: draftBody }) });
    const envelope = readEnvelope<Record<string, unknown>>(await response.json());
    if (!response.ok || envelope.status !== "success") throw new Error(errorMessage(envelope, "Draft update failed"));
  }

  async function runSafetyCheck() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}/safety-check`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId: currentSnapshot.workspaceId, personId: selectedConversation.personId, conversationId: selectedConversation.conversationId, status: "passed" }) });
    const envelope = readEnvelope<Record<string, unknown>>(await response.json());
    if (!response.ok || envelope.status !== "success") throw new Error(errorMessage(envelope, "SafetyCheck failed"));
  }

  async function sendReply() {
    if (!selectedConversation.replyDraft) return;
    const response = await fetch(`/api/reply-drafts/${selectedConversation.replyDraft.replyDraftId}/send`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspaceId: currentSnapshot.workspaceId, personId: selectedConversation.personId, conversationId: selectedConversation.conversationId, channel: selectedConversation.channel }) });
    const envelope = readEnvelope<Record<string, unknown>>(await response.json());
    if (!response.ok || envelope.status !== "success") throw new Error(errorMessage(envelope, "Send failed"));
  }

  const gateChecks = [
    { id: "scope-confirmed", label: "workspace + person + conversation confirmed", checked: scopeConfirmed, setChecked: setScopeConfirmed },
    { id: "channel-confirmed", label: `${selectedConversation.channel} channel confirmed`, checked: channelConfirmed, setChecked: setChannelConfirmed },
    { id: "context-pinned", label: "same-person context pinned", checked: contextPinned, setChecked: setContextPinned },
    { id: "safety-passed", label: "latest SafetyCheck passed for current draft hash", checked: safetyPassed, setChecked: setSafetyPassed }
  ];
  const sendUnlocked = gateChecks.every((check) => check.checked) && selectedConversation.safety.sendReady;
  const sendDecisions = selectedConversation.sendDecisions ?? [];

  return (
    <div className="dashboard-grid">
      <section className="panel inbox-panel" aria-label="inbox"><div className="panel-heading"><p className="eyebrow">Inbox</p><h2>Conversations</h2></div><div className="conversation-list">{currentSnapshot.conversations.map((conversation) => <button type="button" className={conversation.conversationId === selectedConversation.conversationId ? "conversation-item active" : "conversation-item"} key={conversation.conversationId} onClick={() => { setSelectedConversationId(conversation.conversationId); setActionStatus("Ready"); }}><span className="conversation-topline"><strong>{conversation.displayName}</strong><small>{conversation.channel}</small></span><span>{conversation.lastMessagePreview}</span><small>{conversation.waitingState}</small></button>)}</div></section>
      <section className="panel context-panel" aria-label="person context"><div className="panel-heading"><p className="eyebrow">Person Context</p><h2>{selectedConversation.displayName}</h2></div><p className="context-summary">{selectedConversation.context.summary}</p><dl className="scope-list"><div><dt>Person</dt><dd>{selectedConversation.personId}</dd></div><div><dt>Conversation</dt><dd>{selectedConversation.conversationId}</dd></div><div><dt>Channel</dt><dd>{selectedConversation.channel}</dd></div></dl><div className="insight-columns"><InsightList title="Topics" items={selectedConversation.context.topics} /><InsightList title="Promises" items={selectedConversation.context.promises} /><InsightList title="Next Actions" items={selectedConversation.context.nextActions} /></div></section>
      <section className="panel reply-panel" aria-label="reply safety"><div className="panel-heading"><p className="eyebrow">Reply Safety</p><h2>Draft and send gate</h2></div><textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={8} /><div className="gate-list">{gateChecks.map((check) => <label key={check.id}><input type="checkbox" checked={check.checked} onChange={(event) => check.setChecked(event.target.checked)} /><span>{check.label}</span></label>)}</div><div className="action-row"><button disabled={isBusy || !selectedConversation.replyDraft} onClick={() => runAction("Update draft", updateDraft)}>Update draft</button><button disabled={isBusy || !selectedConversation.replyDraft} onClick={() => runAction("Safety check", runSafetyCheck)}>Run SafetyCheck</button><button disabled={isBusy || !sendUnlocked} onClick={() => runAction("Send", sendReply)}>Send</button></div><p className="action-status">{actionStatus}</p>{sendDecisions.length > 0 && <div className="decision-list">{sendDecisions.map((decision, index) => <p key={`${decision.code}-${index}`}>{decision.code}: {decision.message}</p>)}</div>}</section>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) { return <div><h3>{title}</h3>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None</p>}</div>; }
