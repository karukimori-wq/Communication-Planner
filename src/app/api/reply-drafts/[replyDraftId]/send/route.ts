import { fail, ok, requestMeta } from "@/lib/http";
import { canSendReplyDraft, getConversation, ingestChannelMessage, markReplyDraftSent } from "@/lib/store";
import type { SendReplyDraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

function validateSendConfirmation(input: SendReplyDraftInput | null, draft: { workspaceId: string; personId: string; conversationId: string }) {
  if (!input?.workspaceId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "workspaceId is required before send" };
  if (!input?.personId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "personId is required before send" };
  if (!input?.conversationId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "conversationId is required before send" };
  if (input.workspaceId !== draft.workspaceId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "workspaceId does not match reply draft" };
  if (input.personId !== draft.personId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "personId does not match reply draft" };
  if (input.conversationId !== draft.conversationId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "conversationId does not match reply draft" };
  return { ok: true as const };
}

export async function POST(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const body = await request.json().catch(() => null) as SendReplyDraftInput | null;
  const decision = canSendReplyDraft(replyDraftId);

  if (!decision.ok) {
    return fail(decision.code, decision.message, decision.code === "NOT_FOUND" ? 404 : 409, meta);
  }

  const confirmation = validateSendConfirmation(body, decision.draft);
  if (!confirmation.ok) {
    return fail(confirmation.code, confirmation.message, 409, meta);
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
