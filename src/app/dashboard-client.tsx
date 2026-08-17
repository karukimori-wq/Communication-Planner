"use client";

import { useMemo, useState } from "react";
import type { DashboardSnapshot } from "@/lib/dashboard";

export function CommunicationDashboard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [selectedConversationId, setSelectedConversationId] = useState(snapshot.conversations[0]?.conversationId ?? "");
  const [scopeConfirmed, setScopeConfirmed] = useState(true);
  const [channelConfirmed, setChannelConfirmed] = useState(true);
  const [contextPinned, setContextPinned] = useState(true);
  const [safetyPassed, setSafetyPassed] = useState(false);

  const selectedConversation = useMemo(
    () => snapshot.conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? snapshot.conversations[0],
    [selectedConversationId, snapshot.conversations]
  );

  if (!selectedConversation) {
    return (
      <section className="empty-panel">
        <h2>No conversations yet</h2>
        <p>Connect a LINE, X, or Instagram adapter webhook to start building a person-scoped inbox.</p>
      </section>
    );
  }

  const gateChecks = [
    { id: "scope-confirmed", label: "workspace + person + conversation confirmed", checked: scopeConfirmed, setChecked: setScopeConfirmed },
    { id: "channel-confirmed", label: `${selectedConversation.channel} channel confirmed`, checked: channelConfirmed, setChecked: setChannelConfirmed },
    { id: "context-pinned", label: "same-person context pinned", checked: contextPinned, setChecked: setContextPinned },
    { id: "safety-passed", label: "latest SafetyCheck passed for current draft hash", checked: safetyPassed, setChecked: setSafetyPassed }
  ];
  const sendUnlocked = gateChecks.every((check) => check.checked) && selectedConversation.replyDraft.status !== "sent";

  return (
    <div className="dashboard-grid">
      <section className="panel inbox-panel" aria-label="inbox">
        <div className="panel-heading">
          <p className="eyebrow">Inbox</p>
          <h2>Conversations</h2>
        </div>
        <div className="conversation-list">
          {snapshot.conversations.map((conversation) => (
            <button
              type="button"
              className={conversation.conversationId === selectedConversation.conversationId ? "conversation-item active" : "conversation-item"}
              key={conversation.conversationId}
              onClick={() => {
                setSelectedConversationId(conversation.conversationId);
                setSafetyPassed(false);
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
        <div className="draft-box">
          <p>{selectedConversation.replyDraft.body}</p>
          <small>
            Purpose: {selectedConversation.replyDraft.purpose} / Hash: {selectedConversation.replyDraft.contentHash}
          </small>
        </div>

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
          <button className="send-button" disabled={!sendUnlocked} type="button">
            Send reply
          </button>
        </div>
      </section>

      <section className="panel operations-panel" aria-label="adapter and AI platform status">
        <div className="panel-heading">
          <p className="eyebrow">Operations</p>
          <h2>Adapters and AI tasks</h2>
        </div>
        <div className="status-grid">
          {snapshot.adapterStates.map((adapter) => (
            <div className="status-row" key={adapter.channel}>
              <span>{adapter.channel}</span>
              <strong>{adapter.status}</strong>
              <small>{adapter.ossReference}</small>
            </div>
          ))}
        </div>
        <div className="ai-task-list">
          {snapshot.aiTasks.map((task) => (
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
