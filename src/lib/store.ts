import { contentHash } from "./hash";
import { dashboardOperations, dashboardSeedWorkspaceId, type DashboardConversation, type DashboardSnapshot } from "./dashboard";
import type {
  ChannelIdentity,
  ChannelMessageInput,
  CommunicationNextAction,
  CommunicationPerson,
  Conversation,
  ConversationContext,
  Message,
  ReplySendDecision,
  Promise,
  ReplyDraft,
  SafetyCheck,
  SafetyCheckInput,
  Topic,
  UpdateReplyDraftInput
} from "./types";

type StoreState = {
  persons: CommunicationPerson[];
  channelIdentities: ChannelIdentity[];
  conversations: Conversation[];
  messages: Message[];
  contexts: ConversationContext[];
  topics: Topic[];
  promises: Promise[];
  nextActions: CommunicationNextAction[];
  replyDrafts: ReplyDraft[];
  safetyChecks: SafetyCheck[];
  sendDecisions: ReplySendDecision[];
};

const globalStore = globalThis as typeof globalThis & { communicationPlannerStore?: StoreState };

export const store: StoreState =
  globalStore.communicationPlannerStore ??
  (globalStore.communicationPlannerStore = {
    persons: [],
    channelIdentities: [],
    conversations: [],
    messages: [],
    contexts: [],
    topics: [],
    promises: [],
    nextActions: [],
    replyDrafts: [],
    safetyChecks: [],
    sendDecisions: []
  });

export function resetStoreForTests() {
  store.persons.length = 0;
  store.channelIdentities.length = 0;
  store.conversations.length = 0;
  store.messages.length = 0;
  store.contexts.length = 0;
  store.topics.length = 0;
  store.promises.length = 0;
  store.nextActions.length = 0;
  store.replyDrafts.length = 0;
  store.safetyChecks.length = 0;
  store.sendDecisions.length = 0;
}

function now() {
  return new Date().toISOString();
}

function addDemoMessage(input: ChannelMessageInput) {
  return ingestChannelMessage(input);
}

async function addDemoReplyDraft(input: {
  replyDraftId: string;
  workspaceId: string;
  personId: string;
  conversationId: string;
  body: string;
  purpose: string;
}) {
  if (store.replyDrafts.some((draft) => draft.replyDraftId === input.replyDraftId)) return;

  const hash = await contentHash(input.body);
  store.replyDrafts.push({
    replyDraftId: input.replyDraftId,
    workspaceId: input.workspaceId,
    personId: input.personId,
    conversationId: input.conversationId,
    body: input.body,
    purpose: input.purpose,
    contentHash: hash,
    status: "draft",
    createdAt: now(),
    updatedAt: now()
  });
}

export async function ensureDemoWorkspaceSeeded(workspaceId = dashboardSeedWorkspaceId) {
  if (store.conversations.some((conversation) => conversation.workspaceId === workspaceId)) return;

  addDemoMessage({
    workspaceId,
    channel: "line",
    externalUserId: "line-user-aoi",
    externalMessageId: "demo-line-message-001",
    externalThreadId: "line-thread-aoi",
    personId: "person-aoi",
    conversationId: "conv-line-001",
    displayName: "Aoi Tanaka",
    body: "Can you confirm the latest schedule and next action?",
    topics: ["schedule confirmation", "follow-up timing"],
    promises: ["Send a clear confirmation after checking the current conversation"],
    nextActions: ["Review same-person context before drafting the reply"]
  });
  addDemoMessage({
    workspaceId,
    channel: "x",
    externalUserId: "x-user-ren",
    externalMessageId: "demo-x-message-001",
    externalThreadId: "x-thread-ren",
    personId: "person-ren",
    conversationId: "conv-x-001",
    displayName: "Ren Sato",
    body: "Please summarize where we left off.",
    topics: ["conversation recap"],
    nextActions: ["Create a scoped reply draft"]
  });
  addDemoMessage({
    workspaceId,
    channel: "instagram",
    externalUserId: "ig-user-mika",
    externalMessageId: "demo-ig-message-001",
    externalThreadId: "ig-thread-mika",
    personId: "person-mika",
    conversationId: "conv-ig-001",
    displayName: "Mika Ito",
    body: "Could you remind me what was promised?",
    topics: ["promise follow-up"],
    promises: ["Share the confirmed note after review"],
    nextActions: ["Run SafetyCheck after editing the draft"]
  });

  await addDemoReplyDraft({
    replyDraftId: "draft-line-001",
    workspaceId,
    personId: "person-aoi",
    conversationId: "conv-line-001",
    body: "Thanks for the message. I will confirm the latest details and reply with the next step shortly.",
    purpose: "confirm next action"
  });
  await addDemoReplyDraft({
    replyDraftId: "draft-x-001",
    workspaceId,
    personId: "person-ren",
    conversationId: "conv-x-001",
    body: "Here is a concise recap of the current thread and the next step we discussed.",
    purpose: "summarize context"
  });
  await addDemoReplyDraft({
    replyDraftId: "draft-ig-001",
    workspaceId,
    personId: "person-mika",
    conversationId: "conv-ig-001",
    body: "I will check the saved note for this conversation and send the confirmed promise clearly.",
    purpose: "promise follow-up"
  });
}

function findOrCreatePerson(input: Pick<ChannelMessageInput, "workspaceId" | "personId" | "displayName" | "channel" | "externalUserId">): CommunicationPerson {
  const existing = input.personId
    ? store.persons.find((person) => person.workspaceId === input.workspaceId && person.personId === input.personId)
    : undefined;

  if (existing) {
    existing.displayName = input.displayName ?? existing.displayName;
    existing.updatedAt = now();
    return existing;
  }

  const existingIdentity = store.channelIdentities.find(
    (identity) =>
      identity.workspaceId === input.workspaceId &&
      identity.channel === input.channel &&
      identity.externalUserId === input.externalUserId
  );
  const existingPerson = existingIdentity
    ? store.persons.find((person) => person.workspaceId === input.workspaceId && person.personId === existingIdentity.personId)
    : undefined;

  if (existingPerson) {
    existingPerson.displayName = input.displayName ?? existingPerson.displayName;
    existingPerson.updatedAt = now();
    return existingPerson;
  }

  const person: CommunicationPerson = {
    personId: input.personId ?? crypto.randomUUID(),
    workspaceId: input.workspaceId,
    displayName: input.displayName,
    channelIdentityIds: [],
    createdAt: now(),
    updatedAt: now()
  };
  store.persons.push(person);
  return person;
}

function findOrCreateChannelIdentity(input: ChannelMessageInput, person: CommunicationPerson): ChannelIdentity {
  const existing = store.channelIdentities.find(
    (identity) =>
      identity.workspaceId === input.workspaceId &&
      identity.channel === input.channel &&
      identity.externalUserId === input.externalUserId
  );

  if (existing) {
    return existing;
  }

  const identity: ChannelIdentity = {
    channelIdentityId: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    personId: person.personId,
    channel: input.channel,
    externalUserId: input.externalUserId,
    displayName: input.displayName,
    linkedAt: now()
  };
  store.channelIdentities.push(identity);
  person.channelIdentityIds.push(identity.channelIdentityId);
  person.updatedAt = now();
  return identity;
}

function findOrCreateConversation(input: ChannelMessageInput, personId: string): Conversation {
  const existing = input.conversationId
    ? store.conversations.find(
        (conversation) =>
          conversation.workspaceId === input.workspaceId &&
          conversation.personId === personId &&
          conversation.conversationId === input.conversationId
      )
    : store.conversations.find(
        (conversation) =>
          conversation.workspaceId === input.workspaceId &&
          conversation.personId === personId &&
          conversation.channel === input.channel &&
          conversation.externalThreadId === input.externalThreadId
      );

  if (existing) {
    existing.lastMessageAt = now();
    existing.updatedAt = now();
    return existing;
  }

  const conversation: Conversation = {
    conversationId: input.conversationId ?? crypto.randomUUID(),
    workspaceId: input.workspaceId,
    personId,
    channel: input.channel,
    externalThreadId: input.externalThreadId,
    lastMessageAt: now(),
    createdAt: now(),
    updatedAt: now()
  };
  store.conversations.push(conversation);
  return conversation;
}

function updateContext(workspaceId: string, personId: string, latestMessage: string): ConversationContext {
  const existing = store.contexts.find((context) => context.workspaceId === workspaceId && context.personId === personId);
  if (existing) {
    existing.summary = latestMessage;
    existing.updatedAt = now();
    return existing;
  }

  const context: ConversationContext = {
    contextId: crypto.randomUUID(),
    workspaceId,
    personId,
    summary: latestMessage,
    topicIds: [],
    promiseIds: [],
    nextActionIds: [],
    updatedAt: now()
  };
  store.contexts.push(context);
  return context;
}

function findOrCreateContext(workspaceId: string, personId: string): ConversationContext {
  const existing = store.contexts.find((context) => context.workspaceId === workspaceId && context.personId === personId);
  if (existing) {
    return existing;
  }

  const context: ConversationContext = {
    contextId: crypto.randomUUID(),
    workspaceId,
    personId,
    summary: "",
    topicIds: [],
    promiseIds: [],
    nextActionIds: [],
    updatedAt: now()
  };
  store.contexts.push(context);
  return context;
}

function appendContextInsights(input: {
  workspaceId: string;
  personId: string;
  conversationId: string;
  messageId: string;
  topics?: string[];
  promises?: string[];
  nextActions?: string[];
}) {
  const context = findOrCreateContext(input.workspaceId, input.personId);
  const createdAt = now();

  for (const label of input.topics ?? []) {
    const topic: Topic = {
      topicId: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      personId: input.personId,
      conversationId: input.conversationId,
      label,
      sourceMessageId: input.messageId,
      createdAt
    };
    store.topics.push(topic);
    context.topicIds.push(topic.topicId);
  }

  for (const body of input.promises ?? []) {
    const promise: Promise = {
      promiseId: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      personId: input.personId,
      conversationId: input.conversationId,
      body,
      sourceMessageId: input.messageId,
      createdAt
    };
    store.promises.push(promise);
    context.promiseIds.push(promise.promiseId);
  }

  for (const body of input.nextActions ?? []) {
    const nextAction: CommunicationNextAction = {
      nextActionId: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      personId: input.personId,
      conversationId: input.conversationId,
      body,
      sourceMessageId: input.messageId,
      status: "open",
      createdAt
    };
    store.nextActions.push(nextAction);
    context.nextActionIds.push(nextAction.nextActionId);
  }

  context.updatedAt = createdAt;
}

function findDuplicateMessage(input: ChannelMessageInput) {
  if (!input.externalMessageId) return undefined;
  const direction = input.direction ?? "inbound";

  return store.messages.find(
    (message) =>
      message.workspaceId === input.workspaceId &&
      message.channel === input.channel &&
      message.direction === direction &&
      message.externalMessageId === input.externalMessageId
  );
}

export function ingestChannelMessage(input: ChannelMessageInput) {
  const person = findOrCreatePerson(input);
  const identity = findOrCreateChannelIdentity(input, person);
  const duplicateMessage = findDuplicateMessage(input);

  if (duplicateMessage) {
    const duplicateConversation = store.conversations.find((conversation) => conversation.conversationId === duplicateMessage.conversationId);
    return {
      person,
      identity,
      conversation: duplicateConversation,
      message: duplicateMessage,
      duplicate: true
    };
  }

  const conversation = findOrCreateConversation(input, person.personId);

  const message: Message = {
    messageId: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    personId: person.personId,
    conversationId: conversation.conversationId,
    channel: input.channel,
    direction: input.direction ?? "inbound",
    body: input.body,
    externalMessageId: input.externalMessageId,
    receivedAt: (input.direction ?? "inbound") === "inbound" ? now() : undefined,
    sentAt: input.direction === "outbound" ? now() : undefined,
    createdAt: now()
  };
  store.messages.push(message);
  updateContext(input.workspaceId, person.personId, input.body);
  appendContextInsights({
    workspaceId: input.workspaceId,
    personId: person.personId,
    conversationId: conversation.conversationId,
    messageId: message.messageId,
    topics: input.topics,
    promises: input.promises,
    nextActions: input.nextActions
  });

  return { person, identity, conversation, message, duplicate: false };
}

export function getInbox(workspaceId: string) {
  return store.conversations
    .filter((conversation) => conversation.workspaceId === workspaceId)
    .map((conversation) => {
      const person = store.persons.find((candidate) => candidate.personId === conversation.personId);
      const lastMessage = [...store.messages]
        .reverse()
        .find((message) => message.conversationId === conversation.conversationId);

      return {
        conversationId: conversation.conversationId,
        personId: conversation.personId,
        displayName: person?.displayName,
        channel: conversation.channel,
        lastMessagePreview: lastMessage?.body,
        lastMessageAt: conversation.lastMessageAt
      };
    })
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

function getLatestReplyDraft(workspaceId: string, personId: string, conversationId: string) {
  return [...store.replyDrafts]
    .reverse()
    .find(
      (draft) =>
        draft.workspaceId === workspaceId &&
        draft.personId === personId &&
        draft.conversationId === conversationId
    );
}

function getDashboardWaitingState(conversation: Conversation, replyDraft: ReplyDraft | undefined) {
  if (!replyDraft) return "draft needed";
  if (replyDraft.status === "sent") return "sent";
  const safetyCheck = getLatestSafetyCheck(replyDraft.replyDraftId);
  if (!safetyCheck) return "safety check needed";
  if (safetyCheck.status === "failed") return "safety blocked";
  const sendDecision = canSendReplyDraft(replyDraft.replyDraftId);
  if (!sendDecision.ok) return sendDecision.code;
  return `ready on ${conversation.channel}`;
}

export async function getDashboardSnapshot(workspaceId = dashboardSeedWorkspaceId) {
  if (workspaceId === dashboardSeedWorkspaceId) {
    await ensureDemoWorkspaceSeeded(workspaceId);
  }

  const conversations: DashboardConversation[] = getInbox(workspaceId).map((item) => {
    const context = getPersonContext(workspaceId, item.personId);
    const replyDraft = getLatestReplyDraft(workspaceId, item.personId, item.conversationId);
    const latestSafetyCheck = replyDraft ? getLatestSafetyCheck(replyDraft.replyDraftId) : undefined;
    const sendDecision = replyDraft ? canSendReplyDraft(replyDraft.replyDraftId) : undefined;
    const conversation = getConversation(workspaceId, item.personId, item.conversationId);

    return {
      conversationId: item.conversationId,
      personId: item.personId,
      displayName: item.displayName ?? item.personId,
      channel: item.channel,
      lastMessagePreview: item.lastMessagePreview ?? "",
      waitingState: conversation ? getDashboardWaitingState(conversation, replyDraft) : "conversation missing",
      context: {
        summary: context?.summary ?? "",
        topics: context?.topics.map((topic) => topic.label) ?? [],
        promises: context?.promises.map((promise) => promise.body) ?? [],
        nextActions: context?.nextActions.map((nextAction) => nextAction.body) ?? []
      },
      replyDraft: replyDraft
        ? {
            replyDraftId: replyDraft.replyDraftId,
            body: replyDraft.body,
            purpose: replyDraft.purpose,
            contentHash: replyDraft.contentHash,
            status: replyDraft.status
          }
        : null,
      safety: {
        latestSafetyCheckId: latestSafetyCheck?.safetyCheckId,
        latestSafetyCheckStatus: latestSafetyCheck?.status,
        sendReady: sendDecision?.ok ?? false,
        blockedReason: sendDecision && !sendDecision.ok ? sendDecision.code : undefined
      }
    };
  });

  return {
    workspaceId,
    contractStatus: "success" as const,
    conversations,
    adapterStates: dashboardOperations.adapterStates,
    aiTasks: dashboardOperations.aiTasks
  };
}

export function getPerson(workspaceId: string, personId: string) {
  return store.persons.find((person) => person.workspaceId === workspaceId && person.personId === personId);
}

export function getConversation(workspaceId: string, personId: string, conversationId: string) {
  return store.conversations.find(
    (conversation) =>
      conversation.workspaceId === workspaceId &&
      conversation.personId === personId &&
      conversation.conversationId === conversationId
  );
}

export function getPersonConversations(workspaceId: string, personId: string) {
  return store.conversations.filter(
    (conversation) => conversation.workspaceId === workspaceId && conversation.personId === personId
  );
}

export function getChannelIdentityForPerson(workspaceId: string, personId: string, channel: ReplySendDecision["channel"]) {
  return store.channelIdentities.find(
    (identity) =>
      identity.workspaceId === workspaceId &&
      identity.personId === personId &&
      identity.channel === channel
  );
}

export function getPersonContext(workspaceId: string, personId: string) {
  const context = store.contexts.find((candidate) => candidate.workspaceId === workspaceId && candidate.personId === personId);
  if (!context) {
    return undefined;
  }

  return {
    ...context,
    topics: store.topics.filter((topic) => context.topicIds.includes(topic.topicId)),
    promises: store.promises.filter((promise) => context.promiseIds.includes(promise.promiseId)),
    nextActions: store.nextActions.filter((nextAction) => context.nextActionIds.includes(nextAction.nextActionId))
  };
}

function formatContextForDraft(context: ReturnType<typeof getPersonContext>) {
  if (!context) {
    return "No context yet.";
  }

  const parts = [`Summary: ${context.summary || "No summary yet."}`];

  if (context.topics.length > 0) {
    parts.push(`Topics: ${context.topics.map((topic) => topic.label).join(", ")}`);
  }

  if (context.promises.length > 0) {
    parts.push(`Promises: ${context.promises.map((promise) => promise.body).join(" | ")}`);
  }

  if (context.nextActions.length > 0) {
    parts.push(`Next actions: ${context.nextActions.map((nextAction) => nextAction.body).join(" | ")}`);
  }

  return parts.join("\n");
}

export async function createReplyDraft(input: { workspaceId: string; personId: string; conversationId: string; body?: string; purpose: string }) {
  const conversation = getConversation(input.workspaceId, input.personId, input.conversationId);

  if (!conversation) {
    return null;
  }

  const context = getPersonContext(input.workspaceId, input.personId);
  const body = input.body ?? `Draft for ${input.purpose}.\n${formatContextForDraft(context)}`;
  const hash = await contentHash(body);
  const draft: ReplyDraft = {
    replyDraftId: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    personId: input.personId,
    conversationId: input.conversationId,
    body,
    purpose: input.purpose,
    contentHash: hash,
    status: "draft",
    createdAt: now(),
    updatedAt: now()
  };
  store.replyDrafts.push(draft);
  return draft;
}

export function getReplyDraft(replyDraftId: string) {
  return store.replyDrafts.find((draft) => draft.replyDraftId === replyDraftId);
}

export async function updateReplyDraft(replyDraftId: string, input: UpdateReplyDraftInput) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) {
    return { ok: false as const, code: "NOT_FOUND", message: "ReplyDraft not found" };
  }

  if (draft.status === "sent") {
    return { ok: false as const, code: "REPLY_DRAFT_ALREADY_SENT", message: "Sent ReplyDraft cannot be updated" };
  }

  if (!input.workspaceId) return { ok: false as const, code: "VALIDATION_ERROR", message: "workspaceId is required" };
  if (!input.personId) return { ok: false as const, code: "VALIDATION_ERROR", message: "personId is required" };
  if (!input.conversationId) return { ok: false as const, code: "VALIDATION_ERROR", message: "conversationId is required" };
  if (input.workspaceId !== draft.workspaceId) return { ok: false as const, code: "REPLY_DRAFT_SCOPE_MISMATCH", message: "workspaceId does not match reply draft" };
  if (input.personId !== draft.personId) return { ok: false as const, code: "REPLY_DRAFT_SCOPE_MISMATCH", message: "personId does not match reply draft" };
  if (input.conversationId !== draft.conversationId) return { ok: false as const, code: "REPLY_DRAFT_SCOPE_MISMATCH", message: "conversationId does not match reply draft" };

  if (typeof input.body === "string" && input.body.trim().length > 0) {
    draft.body = input.body.trim();
    draft.contentHash = await contentHash(draft.body);
  }

  if (typeof input.purpose === "string" && input.purpose.trim().length > 0) {
    draft.purpose = input.purpose.trim();
  }

  draft.status = "draft";
  draft.updatedAt = now();
  return { ok: true as const, draft };
}

export async function createSafetyCheck(replyDraftId: string, input: SafetyCheckInput) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) {
    return null;
  }

  const issues = [...(input.issues ?? [])];
  if (!input.workspaceId) issues.push("workspaceId is required for SafetyCheck scope");
  if (!input.personId) issues.push("personId is required for SafetyCheck scope");
  if (!input.conversationId) issues.push("conversationId is required for SafetyCheck scope");
  if (input.workspaceId && input.workspaceId !== draft.workspaceId) issues.push("workspaceId does not match reply draft");
  if (input.personId && input.personId !== draft.personId) issues.push("personId does not match reply draft");
  if (input.conversationId && input.conversationId !== draft.conversationId) issues.push("conversationId does not match reply draft");

  const safetyCheck: SafetyCheck = {
    safetyCheckId: crypto.randomUUID(),
    workspaceId: draft.workspaceId,
    personId: draft.personId,
    conversationId: draft.conversationId,
    replyDraftId: draft.replyDraftId,
    status: issues.length > 0 ? "failed" : input.status ?? "passed",
    checkedContentHash: await contentHash(draft.body),
    issues,
    checkedAt: now()
  };

  store.safetyChecks.push(safetyCheck);
  draft.status = "checked";
  draft.updatedAt = now();
  return safetyCheck;
}

export function getLatestSafetyCheck(replyDraftId: string) {
  return [...store.safetyChecks]
    .reverse()
    .find((safetyCheck) => safetyCheck.replyDraftId === replyDraftId);
}

export function canSendReplyDraft(replyDraftId: string) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) {
    return { ok: false as const, code: "NOT_FOUND", message: "ReplyDraft not found" };
  }

  if (draft.status === "sent") {
    return { ok: false as const, code: "REPLY_DRAFT_ALREADY_SENT", message: "ReplyDraft has already been sent" };
  }

  const safetyCheck = getLatestSafetyCheck(replyDraftId);
  if (!safetyCheck) {
    return { ok: false as const, code: "SAFETY_CHECK_REQUIRED", message: "SafetyCheck is required before send" };
  }

  if (safetyCheck.status !== "passed") {
    return { ok: false as const, code: "SAFETY_CHECK_FAILED", message: "Latest SafetyCheck did not pass" };
  }

  if (
    safetyCheck.workspaceId !== draft.workspaceId ||
    safetyCheck.personId !== draft.personId ||
    safetyCheck.conversationId !== draft.conversationId
  ) {
    return { ok: false as const, code: "SAFETY_CHECK_SCOPE_MISMATCH", message: "Latest SafetyCheck scope does not match reply draft" };
  }

  if (safetyCheck.checkedContentHash !== draft.contentHash) {
    return { ok: false as const, code: "STALE_SAFETY_CHECK", message: "SafetyCheck is stale for current draft content" };
  }

  return { ok: true as const, draft, safetyCheck };
}

export function recordReplySendDecision(input: {
  draft: ReplyDraft;
  safetyCheck: SafetyCheck;
  messageId: string;
  channel: ReplySendDecision["channel"];
  adapterDelivery: ReplySendDecision["adapterDelivery"];
}): ReplySendDecision {
  const decision: ReplySendDecision = {
    sendDecisionId: crypto.randomUUID(),
    messageId: input.messageId,
    decidedAt: now(),
    replyDraftId: input.draft.replyDraftId,
    safetyCheckId: input.safetyCheck.safetyCheckId,
    workspaceId: input.draft.workspaceId,
    personId: input.draft.personId,
    conversationId: input.draft.conversationId,
    channel: input.channel,
    contentHash: input.draft.contentHash,
    adapterDelivery: input.adapterDelivery,
    checks: {
      draftNotSent: true,
      safetyCheckPassed: true,
      safetyCheckScopeMatched: true,
      safetyCheckFresh: true,
      sendScopeConfirmed: true,
      channelConfirmed: true
    }
  };
  store.sendDecisions.push(decision);
  return decision;
}

export function getReplySendDecisions(input: { replyDraftId: string; workspaceId: string; personId: string; conversationId: string }) {
  return store.sendDecisions.filter(
    (decision) =>
      decision.replyDraftId === input.replyDraftId &&
      decision.workspaceId === input.workspaceId &&
      decision.personId === input.personId &&
      decision.conversationId === input.conversationId
  );
}

export function buildReplySendDecision(input: {
  draft: ReplyDraft;
  safetyCheck: SafetyCheck;
  messageId: string;
  channel: ReplySendDecision["channel"];
  adapterDelivery: ReplySendDecision["adapterDelivery"];
}): ReplySendDecision {
  return {
    sendDecisionId: crypto.randomUUID(),
    messageId: input.messageId,
    decidedAt: now(),
    replyDraftId: input.draft.replyDraftId,
    safetyCheckId: input.safetyCheck.safetyCheckId,
    workspaceId: input.draft.workspaceId,
    personId: input.draft.personId,
    conversationId: input.draft.conversationId,
    channel: input.channel,
    contentHash: input.draft.contentHash,
    adapterDelivery: input.adapterDelivery,
    checks: {
      draftNotSent: true,
      safetyCheckPassed: true,
      safetyCheckScopeMatched: true,
      safetyCheckFresh: true,
      sendScopeConfirmed: true,
      channelConfirmed: true
    }
  };
}

export function markReplyDraftSent(replyDraftId: string) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) return null;
  draft.status = "sent";
  draft.updatedAt = now();
  return draft;
}
