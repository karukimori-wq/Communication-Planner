import type { ChannelAdapter, ProviderInboundEvent, ProviderSendRequest } from "./types";

export const instagramAdapter: ChannelAdapter = {
  channel: "instagram",
  normalizeInbound(event: ProviderInboundEvent) {
    return {
      workspaceId: event.workspaceId,
      channel: "instagram",
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
      adapterReference: "Shudesu/ig-harness-oss",
      idempotencyKey: request.idempotencyKey,
      externalMessageId: `instagram-dry-run:${request.replyDraftId}`,
      reason: "Instagram provider delivery is dry-run until production credentials are configured."
    };
  }
};
