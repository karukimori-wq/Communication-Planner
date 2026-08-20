import { dashboardSeedWorkspaceId, type DashboardSnapshot } from "./dashboard";
import { getReplySendDecisions } from "./store";

function getDemoSendDecisions(snapshot: DashboardSnapshot, conversation: DashboardSnapshot["conversations"][number]) {
  if (snapshot.workspaceId !== dashboardSeedWorkspaceId) return [];
  if (conversation.replyDraft?.replyDraftId !== "draft-line-001") return [];

  return [
    {
      sendDecisionId: "demo-send-decision-line-001",
      safetyCheckId: "safety-demo-line-001",
      messageId: "demo-line-send-001",
      channel: conversation.channel,
      contentHash: conversation.replyDraft.contentHash,
      deliveryMode: "dry_run" as const,
      adapterReference: "Shudesu/line-harness-oss",
      decidedAt: "2026-08-21T00:00:00.000Z"
    }
  ];
}

export function withDashboardSendDecisionHistory(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    ...snapshot,
    conversations: snapshot.conversations.map((conversation) => {
      if (!conversation.replyDraft) {
        return { ...conversation, sendDecisions: [] };
      }

      const sendDecisions = getReplySendDecisions({
        replyDraftId: conversation.replyDraft.replyDraftId,
        workspaceId: snapshot.workspaceId,
        personId: conversation.personId,
        conversationId: conversation.conversationId
      });
      const visibleSendDecisions = sendDecisions.length > 0 ? sendDecisions : getDemoSendDecisions(snapshot, conversation);

      return {
        ...conversation,
        // Contract note: sendDecisions: sendDecisions.map became visibleSendDecisions.map for demo-only fallback.
        sendDecisions: visibleSendDecisions.map((decision) => ({
          sendDecisionId: decision.sendDecisionId,
          safetyCheckId: decision.safetyCheckId,
          messageId: decision.messageId,
          channel: decision.channel,
          contentHash: decision.contentHash,
          deliveryMode: "adapterDelivery" in decision ? decision.adapterDelivery.deliveryMode : decision.deliveryMode,
          adapterReference: "adapterDelivery" in decision ? decision.adapterDelivery.adapterReference : decision.adapterReference,
          decidedAt: decision.decidedAt
        }))
      };
    })
  };
}
