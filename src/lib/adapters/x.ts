import type { ChannelAdapter, ProviderInboundEvent, ProviderSendRequest } from "./types";

export const xAdapter: ChannelAdapter = {
  channel: "x",
  normalizeInbound(event: ProviderInboundEvent) {
    return {
      workspaceId: event.workspaceId,
      channel: "x",
      externalUserId: event.externalUserId,
      externalThreadId: event.externalThreadId,
      externalMessageId: event.providerEventId,
      displayName: event.displayName,
      direction: "inbound",
      body: event.body
    };
  },
  async send(request: ProviderSendRequest) {
    return {
      accepted: true,
      deliveryMode: request.deliveryMode,
      adapterReference: "Shudesu/x-harness-oss",
      idempotencyKey: request.idempotencyKey,
      externalMessageId: `x-dry-run:${request.replyDraftId}`,
      reason: "X provider delivery is dry-run and excludes marketing automation concepts."
    };
  }
};
