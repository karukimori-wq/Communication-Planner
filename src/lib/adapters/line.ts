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
  async send(_request: ProviderSendRequest) {
    return {
      accepted: false,
      reason: "LINE provider send is not wired yet. Use ReplyDraft send gate before enabling adapter delivery."
    };
  }
};
