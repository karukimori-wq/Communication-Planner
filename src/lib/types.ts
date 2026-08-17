export type PlatformStatus = "success" | "warning" | "error" | "skipped";
export type Channel = "line" | "x" | "instagram" | "unknown";
export type MessageDirection = "inbound" | "outbound";
export type SafetyStatus = "passed" | "failed";
export type ReplyDraftStatus = "draft" | "checked" | "sent";

export type ApiError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type ApiResponse<T> = {
  status: PlatformStatus;
  data?: T;
  error?: ApiError;
  traceId?: string;
  correlationId?: string;
  eventName?: string;
  timestamp: string;
};

export type ChannelIdentity = {
  channelIdentityId: string;
  workspaceId: string;
  personId: string;
  channel: Channel;
  externalUserId: string;
  displayName?: string;
  linkedAt: string;
};

export type CommunicationPerson = {
  personId: string;
  workspaceId: string;
  displayName?: string;
  channelIdentityIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  conversationId: string;
  workspaceId: string;
  personId: string;
  channel: Channel;
  externalThreadId?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  messageId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  channel: Channel;
  direction: MessageDirection;
  body: string;
  externalMessageId?: string;
  receivedAt?: string;
  sentAt?: string;
  createdAt: string;
};

export type ConversationContext = {
  contextId: string;
  workspaceId: string;
  personId: string;
  summary: string;
  topicIds: string[];
  promiseIds: string[];
  nextActionIds: string[];
  updatedAt: string;
};

export type Topic = {
  topicId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  label: string;
  sourceMessageId: string;
  createdAt: string;
};

export type Promise = {
  promiseId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  body: string;
  sourceMessageId: string;
  createdAt: string;
};

export type CommunicationNextAction = {
  nextActionId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  body: string;
  sourceMessageId: string;
  status: "open" | "done";
  createdAt: string;
};

export type ReplyDraft = {
  replyDraftId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  body: string;
  purpose: string;
  contentHash: string;
  status: ReplyDraftStatus;
  createdAt: string;
  updatedAt: string;
};

export type SafetyCheck = {
  safetyCheckId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  replyDraftId: string;
  status: SafetyStatus;
  checkedContentHash: string;
  issues: string[];
  checkedAt: string;
};

export type ChannelAdapterState = {
  adapterStateId: string;
  workspaceId: string;
  channel: Channel;
  status: PlatformStatus;
  lastCheckedAt: string;
  issues: string[];
};

export type ChannelMessageInput = {
  workspaceId: string;
  channel: Channel;
  externalUserId: string;
  body: string;
  direction?: MessageDirection;
  externalMessageId?: string;
  externalThreadId?: string;
  displayName?: string;
  personId?: string;
  conversationId?: string;
  topics?: string[];
  promises?: string[];
  nextActions?: string[];
};

export type CreateReplyDraftInput = {
  workspaceId: string;
  personId: string;
  conversationId: string;
  body?: string;
  purpose: string;
};

export type SafetyCheckInput = {
  workspaceId?: string;
  personId?: string;
  conversationId?: string;
  status?: SafetyStatus;
  issues?: string[];
};

export type SendReplyDraftInput = {
  workspaceId?: string;
  personId?: string;
  conversationId?: string;
  channel?: Channel;
};

export type ReplySendDecision = {
  sendDecisionId: string;
  replyDraftId: string;
  safetyCheckId: string;
  messageId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  channel: Channel;
  contentHash: string;
  adapterDelivery: {
    accepted: boolean;
    deliveryMode: "dry_run" | "live";
    adapterReference: string;
    idempotencyKey: string;
    externalMessageId?: string;
    reason?: string;
    providerStatus?: number;
    providerCode?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      resetAt: string;
    };
  };
  checks: {
    draftNotSent: true;
    safetyCheckPassed: true;
    safetyCheckScopeMatched: true;
    safetyCheckFresh: true;
    sendScopeConfirmed: true;
    channelConfirmed: true;
  };
  decidedAt: string;
};

export type UpdateReplyDraftInput = {
  workspaceId?: string;
  personId?: string;
  conversationId?: string;
  body?: string;
  purpose?: string;
};
