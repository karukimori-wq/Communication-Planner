import { getAdapter } from "@/lib/adapters";
import { getProviderSendReadiness } from "@/lib/adapters/readiness";
import type { ProviderSendResult } from "@/lib/adapters/types";
import type { ChannelIdentity, Conversation, ReplyDraft, SafetyCheck } from "@/lib/types";

type RequestMeta = {
  traceId?: string;
  correlationId?: string;
};

export function buildProviderSendIdempotencyKey(draft: ReplyDraft) {
  return `${draft.workspaceId}:${draft.replyDraftId}:${draft.contentHash}`;
}

export async function sendThroughChannelAdapter(input: {
  draft: ReplyDraft;
  safetyCheck: SafetyCheck;
  conversation: Conversation;
  channelIdentity: ChannelIdentity;
  meta: RequestMeta;
}) {
  const adapter = getAdapter(input.conversation.channel);
  if (!adapter) {
    return {
      ok: false as const,
      code: "UNSUPPORTED_CHANNEL",
      message: `Unsupported channel: ${input.conversation.channel}`
    };
  }
  if (input.conversation.channel === "unknown") {
    return {
      ok: false as const,
      code: "UNSUPPORTED_CHANNEL",
      message: "Unknown channel cannot be sent through a provider adapter"
    };
  }

  const readiness = getProviderSendReadiness(input.conversation.channel);

  const result = await adapter.send({
    workspaceId: input.draft.workspaceId,
    personId: input.draft.personId,
    conversationId: input.draft.conversationId,
    replyDraftId: input.draft.replyDraftId,
    safetyCheckId: input.safetyCheck.safetyCheckId,
    contentHash: input.draft.contentHash,
    externalUserId: input.channelIdentity.externalUserId,
    externalThreadId: input.conversation.externalThreadId,
    body: input.draft.body,
    deliveryMode: readiness.effectiveDeliveryMode,
    idempotencyKey: buildProviderSendIdempotencyKey(input.draft),
    traceId: input.meta.traceId,
    correlationId: input.meta.correlationId
  });

  if (!result.accepted) {
    return {
      ok: false as const,
      code: "ADAPTER_SEND_REJECTED",
      message: result.reason ?? "Channel adapter rejected the send request",
      result
    };
  }

  return { ok: true as const, result: result satisfies ProviderSendResult };
}
