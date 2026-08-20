import type { DashboardSnapshot } from "./dashboard";
import { getReplySendDecisions } from "./store";

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

      return {
        ...conversation,
        sendDecisions: sendDecisions.map((decision) => ({
          sendDecisionId: decision.sendDecisionId,
          safetyCheckId: decision.safetyCheckId,
          messageId: decision.messageId,
          channel: decision.channel,
          contentHash: decision.contentHash,
          deliveryMode: decision.adapterDelivery.deliveryMode,
          adapterReference: decision.adapterDelivery.adapterReference,
          decidedAt: decision.decidedAt
        }))
      };
    })
  };
}
