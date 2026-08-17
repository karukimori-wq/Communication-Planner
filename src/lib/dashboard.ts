import type { Channel, PlatformStatus, ReplyDraftStatus } from "./types";

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

export type DashboardConversation = {
  conversationId: string;
  personId: string;
  displayName: string;
  channel: Channel;
  lastMessagePreview: string;
  waitingState: string;
  context: DashboardContext;
  replyDraft: DashboardReplyDraft;
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

export const dashboardSnapshot: DashboardSnapshot = {
  workspaceId: "demo-workspace",
  contractStatus: "success",
  conversations: [
    {
      conversationId: "conv-line-001",
      personId: "person-aoi",
      displayName: "Aoi Tanaka",
      channel: "line",
      lastMessagePreview: "Can you confirm the latest schedule and next action?",
      waitingState: "waiting for operator review",
      context: {
        summary: "Recent conversation is about confirming the next appointment details and keeping the reply concise.",
        topics: ["schedule confirmation", "follow-up timing"],
        promises: ["Send a clear confirmation after checking the current conversation"],
        nextActions: ["Review same-person context before drafting the reply"]
      },
      replyDraft: {
        replyDraftId: "draft-line-001",
        body: "Thanks for the message. I will confirm the latest details and reply with the next step shortly.",
        purpose: "confirm next action",
        contentHash: "demo-hash-line-001",
        status: "checked"
      }
    },
    {
      conversationId: "conv-x-001",
      personId: "person-ren",
      displayName: "Ren Sato",
      channel: "x",
      lastMessagePreview: "Please summarize where we left off.",
      waitingState: "draft needed",
      context: {
        summary: "This thread needs a short recap based only on Ren's own conversation history.",
        topics: ["conversation recap"],
        promises: [],
        nextActions: ["Create a scoped reply draft"]
      },
      replyDraft: {
        replyDraftId: "draft-x-001",
        body: "Here is a concise recap of the current thread and the next step we discussed.",
        purpose: "summarize context",
        contentHash: "demo-hash-x-001",
        status: "draft"
      }
    },
    {
      conversationId: "conv-ig-001",
      personId: "person-mika",
      displayName: "Mika Ito",
      channel: "instagram",
      lastMessagePreview: "Could you remind me what was promised?",
      waitingState: "context review",
      context: {
        summary: "The reply should mention only promises recorded from this person's Instagram conversation.",
        topics: ["promise follow-up"],
        promises: ["Share the confirmed note after review"],
        nextActions: ["Run SafetyCheck after editing the draft"]
      },
      replyDraft: {
        replyDraftId: "draft-ig-001",
        body: "I will check the saved note for this conversation and send the confirmed promise clearly.",
        purpose: "promise follow-up",
        contentHash: "demo-hash-ig-001",
        status: "draft"
      }
    }
  ],
  adapterStates: [
    { channel: "line", status: "success", ossReference: "Shudesu/line-harness-oss" },
    { channel: "x", status: "warning", ossReference: "Shudesu/x-harness-oss" },
    { channel: "instagram", status: "warning", ossReference: "Shudesu/ig-harness-oss" }
  ],
  aiTasks: [
    { operation: "reply.generate", boundary: "Use same-person context only before creating ReplyDraft" },
    { operation: "safety_check", boundary: "Compare draft hash and scope before send" },
    { operation: "context.summarize", boundary: "Write Communication Planner context, not customer master data" }
  ]
};
