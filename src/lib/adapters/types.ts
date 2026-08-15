import type { Channel, ChannelMessageInput } from "@/lib/types";

export type ProviderInboundEvent = {
  workspaceId: string;
  providerEventId?: string;
  externalUserId: string;
  externalThreadId?: string;
  body: string;
  displayName?: string;
  raw?: unknown;
};

export type ProviderSendRequest = {
  workspaceId: string;
  replyDraftId: string;
  externalUserId: string;
  body: string;
};

export type ProviderSendResult = {
  accepted: boolean;
  externalMessageId?: string;
  reason?: string;
};

export type ChannelAdapter = {
  channel: Channel;
  normalizeInbound(event: ProviderInboundEvent): ChannelMessageInput;
  send(request: ProviderSendRequest): Promise<ProviderSendResult>;
};
