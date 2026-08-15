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
  async send(_request: ProviderSendRequest) {
    return {
      accepted: false,
      reason: "X provider send is not wired yet. Marketing automation concepts must stay outside Communication Planner core."
    };
  }
};
