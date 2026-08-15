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
  async send(_request: ProviderSendRequest) {
    return {
      accepted: false,
      reason: "Instagram provider send is not wired yet. Enable only after ReplyDraft SafetyCheck integration."
    };
  }
};
