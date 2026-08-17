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
  personId: string;
  conversationId: string;
  replyDraftId: string;
  safetyCheckId: string;
  contentHash: string;
  externalThreadId?: string;
  externalUserId: string;
  body: string;
  deliveryMode: "dry_run" | "live";
  idempotencyKey: string;
  traceId?: string;
  correlationId?: string;
};

export type ProviderSendResult = {
  accepted: boolean;
  deliveryMode: "dry_run" | "live";
  adapterReference: string;
  idempotencyKey: string;
  externalMessageId?: string;
  reason?: string;
};

export type ChannelAdapter = {
  channel: Channel;
  normalizeInbound(event: ProviderInboundEvent): ChannelMessageInput;
  send(request: ProviderSendRequest): Promise<ProviderSendResult>;
};
