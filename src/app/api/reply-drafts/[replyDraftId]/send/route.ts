import { fail, ok, requestMeta } from "@/lib/http";
import { canSendReplyDraft, getConversation, ingestChannelMessage, markReplyDraftSent } from "@/lib/store";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const decision = canSendReplyDraft(replyDraftId);

  if (!decision.ok) {
    return fail(decision.code, decision.message, decision.code === "NOT_FOUND" ? 404 : 409, meta);
  }

  const conversation = getConversation(decision.draft.workspaceId, decision.draft.personId, decision.draft.conversationId);
  if (!conversation) {
    return fail("CONVERSATION_SCOPE_MISMATCH", "Conversation must exist and belong to the reply draft person", 409, meta);
  }

  const sentDraft = markReplyDraftSent(replyDraftId);
  const sentMessage = ingestChannelMessage({
    workspaceId: decision.draft.workspaceId,
    personId: decision.draft.personId,
    conversationId: decision.draft.conversationId,
    channel: conversation.channel,
    externalUserId: `person:${decision.draft.personId}`,
    externalThreadId: conversation.externalThreadId,
    direction: "outbound",
    body: decision.draft.body
  });

  return ok(
    {
      replyDraft: sentDraft,
      message: sentMessage.message,
      safetyCheck: decision.safetyCheck
    },
    { ...meta, eventName: "communication.message.sent.v1" }
  );
}
