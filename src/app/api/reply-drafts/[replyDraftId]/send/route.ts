import { fail, ok, requestMeta } from "@/lib/http";
import { sendThroughChannelAdapter } from "@/lib/adapters/send";
import {
  canSendReplyDraft,
  getChannelIdentityForPerson,
  getConversation,
  ingestChannelMessage,
  markReplyDraftSent,
  recordReplySendDecision
} from "@/lib/store";
import type { SendReplyDraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };
type SendReplyDraftRequest = SendReplyDraftInput & { channel?: string };

function validateSendConfirmation(input: SendReplyDraftInput | null, draft: { workspaceId: string; personId: string; conversationId: string }) {
  if (!input?.workspaceId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "workspaceId is required before send" };
  if (!input?.personId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "personId is required before send" };
  if (!input?.conversationId) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "conversationId is required before send" };
  if (input.workspaceId !== draft.workspaceId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "workspaceId does not match reply draft" };
  if (input.personId !== draft.personId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "personId does not match reply draft" };
  if (input.conversationId !== draft.conversationId) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "conversationId does not match reply draft" };
  return { ok: true as const };
}

function validateChannelConfirmation(input: SendReplyDraftRequest | null, conversation: { channel: string }) {
  if (!input?.channel) return { ok: false as const, code: "SEND_CONFIRMATION_REQUIRED", message: "channel is required before send" };
  if (input.channel !== conversation.channel) return { ok: false as const, code: "SEND_SCOPE_MISMATCH", message: "channel does not match conversation" };
  return { ok: true as const };
}

export async function POST(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const body = await request.json().catch(() => null) as SendReplyDraftRequest | null;
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

  const channelConfirmation = validateChannelConfirmation(body, conversation);
  if (!channelConfirmation.ok) {
    return fail(channelConfirmation.code, channelConfirmation.message, 409, meta);
  }

  const channelIdentity = getChannelIdentityForPerson(decision.draft.workspaceId, decision.draft.personId, conversation.channel);
  if (!channelIdentity) {
    return fail("CHANNEL_IDENTITY_REQUIRED", "A channel identity is required before provider send", 409, meta);
  }

  const adapterDelivery = await sendThroughChannelAdapter({
    draft: decision.draft,
    safetyCheck: decision.safetyCheck,
    conversation,
    channelIdentity,
    meta
  });
  if (!adapterDelivery.ok) {
    return fail(adapterDelivery.code, adapterDelivery.message, adapterDelivery.httpStatus ?? 409, {
      ...meta,
      retryable: adapterDelivery.retryable
    });
  }

  const sentDraft = markReplyDraftSent(replyDraftId);
  const sentMessage = ingestChannelMessage({
    workspaceId: decision.draft.workspaceId,
    personId: decision.draft.personId,
    conversationId: decision.draft.conversationId,
    channel: conversation.channel,
    externalUserId: channelIdentity.externalUserId,
    externalThreadId: conversation.externalThreadId,
    externalMessageId: adapterDelivery.result.externalMessageId,
    direction: "outbound",
    body: decision.draft.body
  });
  const sendDecision = recordReplySendDecision({
    draft: decision.draft,
    safetyCheck: decision.safetyCheck,
    messageId: sentMessage.message.messageId,
    channel: conversation.channel,
    adapterDelivery: adapterDelivery.result
  });

  return ok(
    {
      replyDraft: sentDraft,
      message: sentMessage.message,
      safetyCheck: decision.safetyCheck,
      adapterDelivery: adapterDelivery.result,
      sendDecision
    },
    { ...meta, eventName: "communication.message.sent.v1" }
  );
}
