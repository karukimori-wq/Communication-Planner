import type { ChannelAdapter, ProviderInboundEvent, ProviderSendRequest } from "./types";

export const lineAdapter: ChannelAdapter = {
  channel: "line",
  normalizeInbound(event: ProviderInboundEvent) {
    return {
      workspaceId: event.workspaceId,
      channel: "line",
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
      adapterReference: "Shudesu/line-harness-oss",
      idempotencyKey: request.idempotencyKey,
      externalMessageId: `line-dry-run:${request.replyDraftId}`,
      reason: "LINE provider delivery is dry-run until production credentials are configured."
    };
  }
};
