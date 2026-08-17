import type { Channel, PlatformStatus, ReplyDraftStatus, SafetyStatus } from "./types";

type DashboardContext = {
  summary: string;
  topics: string[];
  promises: string[];
  nextActions: string[];
};

type DashboardReplyDraft = {
  replyDraftId: string;
  body: string;
  purpose: string;
  contentHash: string;
  status: ReplyDraftStatus;
};

type DashboardSafety = {
  latestSafetyCheckId?: string;
  latestSafetyCheckStatus?: SafetyStatus;
  sendReady: boolean;
  blockedReason?: string;
};

export type DashboardConversation = {
  conversationId: string;
  personId: string;
  displayName: string;
  channel: Channel;
  lastMessagePreview: string;
  waitingState: string;
  context: DashboardContext;
  replyDraft: DashboardReplyDraft | null;
  safety: DashboardSafety;
};

export type DashboardSnapshot = {
  workspaceId: string;
  contractStatus: PlatformStatus;
  conversations: DashboardConversation[];
  adapterStates: Array<{
    channel: Channel;
    status: PlatformStatus;
    ossReference: string;
  }>;
  aiTasks: Array<{
    operation: string;
    boundary: string;
  }>;
};

export const dashboardSeedWorkspaceId = "demo-workspace";

export const dashboardOperations = {
  adapterStates: [
    { channel: "line", status: "success", ossReference: "Shudesu/line-harness-oss" },
    { channel: "x", status: "warning", ossReference: "Shudesu/x-harness-oss" },
    { channel: "instagram", status: "warning", ossReference: "Shudesu/ig-harness-oss" }
  ] satisfies DashboardSnapshot["adapterStates"],
  aiTasks: [
    { operation: "reply.generate", boundary: "Use same-person context only before creating ReplyDraft" },
    { operation: "safety_check", boundary: "Compare draft hash and scope before send" },
    { operation: "context.summarize", boundary: "Write Communication Planner context, not customer master data" }
  ] satisfies DashboardSnapshot["aiTasks"]
};
