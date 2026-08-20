import { fail, ok, requestMeta } from "@/lib/http";
import { getReplyDraft, getReplySendDecisions } from "@/lib/store";
import type { ReplySendDecision } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

function toSendDecisionHistoryItem(decision: ReplySendDecision) {
  return {
    sendDecisionId: decision.sendDecisionId,
    replyDraftId: decision.replyDraftId,
    safetyCheckId: decision.safetyCheckId,
    messageId: decision.messageId,
    workspaceId: decision.workspaceId,
    personId: decision.personId,
    conversationId: decision.conversationId,
    channel: decision.channel,
    contentHash: decision.contentHash,
    deliveryMode: decision.adapterDelivery.deliveryMode,
    adapterReference: decision.adapterDelivery.adapterReference,
    accepted: decision.adapterDelivery.accepted,
    externalMessageId: decision.adapterDelivery.externalMessageId,
    providerStatus: decision.adapterDelivery.providerStatus,
    providerCode: decision.adapterDelivery.providerCode,
    decidedAt: decision.decidedAt
  };
}

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const { replyDraftId } = await context.params;
  const workspaceId = searchParams.get("workspaceId");
  const personId = searchParams.get("personId");
  const conversationId = searchParams.get("conversationId");
  const draft = getReplyDraft(replyDraftId);

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);
  if (!personId) return fail("VALIDATION_ERROR", "personId is required", 400, meta);
  if (!conversationId) return fail("VALIDATION_ERROR", "conversationId is required", 400, meta);

  if (!draft) {
    return fail("NOT_FOUND", "ReplyDraft not found", 404, meta);
  }

  if (draft.workspaceId !== workspaceId || draft.personId !== personId || draft.conversationId !== conversationId) {
    return fail("REPLY_DRAFT_SCOPE_MISMATCH", "Scope does not match reply draft", 403, meta);
  }

  const sendDecisions = getReplySendDecisions({ replyDraftId, workspaceId, personId, conversationId }).map(toSendDecisionHistoryItem);

  return ok({ sendDecisions }, meta);
}
