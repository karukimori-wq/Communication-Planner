import { getAdapter } from "@/lib/adapters";
import { mapProviderError } from "@/lib/adapters/errors";
import { checkProviderRateLimit } from "@/lib/adapters/rate-limit";
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
  const rateLimit = checkProviderRateLimit({
    workspaceId: input.draft.workspaceId,
    channel: input.conversation.channel,
    externalUserId: input.channelIdentity.externalUserId
  });

  if (!rateLimit.ok) {
    return {
      ok: false as const,
      code: rateLimit.code,
      message: rateLimit.message,
      httpStatus: 429,
      retryable: rateLimit.retryable
    };
  }

  let result: ProviderSendResult;
  try {
    result = await adapter.send({
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
  } catch (error) {
    const mapped = mapProviderError(error instanceof Error ? { message: error.message } : { message: "Provider adapter threw an unknown error" });
    return {
      ok: false as const,
      code: mapped.code,
      message: mapped.message,
      httpStatus: mapped.httpStatus,
      retryable: mapped.retryable
    };
  }

  if (!result.accepted) {
    const mapped = mapProviderError({
      status: result.providerStatus,
      code: result.providerCode,
      message: result.reason
    });
    return {
      ok: false as const,
      code: mapped.code,
      message: mapped.message,
      httpStatus: mapped.httpStatus,
      retryable: mapped.retryable,
      result
    };
  }

  return {
    ok: true as const,
    result: {
      ...result,
      rateLimit
    } satisfies ProviderSendResult
  };
}
