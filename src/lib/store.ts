import { contentHash } from "./hash";
import type {
  ChannelIdentity,
  ChannelMessageInput,
  CommunicationPerson,
  Conversation,
  ConversationContext,
  Message,
  ReplyDraft,
  SafetyCheck,
  SafetyCheckInput
} from "./types";

type StoreState = {
  persons: CommunicationPerson[];
  channelIdentities: ChannelIdentity[];
  conversations: Conversation[];
  messages: Message[];
  contexts: ConversationContext[];
  replyDrafts: ReplyDraft[];
  safetyChecks: SafetyCheck[];
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
    replyDrafts: [],
    safetyChecks: []
  });

export function resetStoreForTests() {
  store.persons.length = 0;
  store.channelIdentities.length = 0;
  store.conversations.length = 0;
  store.messages.length = 0;
  store.contexts.length = 0;
  store.replyDrafts.length = 0;
  store.safetyChecks.length = 0;
}

function now() {
  return new Date().toISOString();
}

function findOrCreatePerson(
  input: Pick<ChannelMessageInput, "workspaceId" | "personId" | "displayName" | "channel" | "externalUserId">
): CommunicationPerson {
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
    ? store.persons.find(
        (person) => person.workspaceId === input.workspaceId && person.personId === existingIdentity.personId
      )
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

function findDuplicateMessage(input: ChannelMessageInput) {
  if (!input.externalMessageId) {
    return undefined;
  }

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
    const duplicateConversation = store.conversations.find(
      (conversation) => conversation.conversationId === duplicateMessage.conversationId
    );

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

export function getPersonContext(workspaceId: string, personId: string) {
  return store.contexts.find((context) => context.workspaceId === workspaceId && context.personId === personId);
}

export async function createReplyDraft(input: { workspaceId: string; personId: string; conversationId: string; body?: string; purpose: string }) {
  const conversation = getConversation(input.workspaceId, input.personId, input.conversationId);

  if (!conversation) {
    return null;
  }

  const context = getPersonContext(input.workspaceId, input.personId);
  const body = input.body ?? `Draft for ${input.purpose}. Context: ${context?.summary ?? "No context yet."}`;
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

export async function createSafetyCheck(replyDraftId: string, input: SafetyCheckInput) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) {
    return null;
  }

  const hash = await contentHash(draft.body);
  const check: SafetyCheck = {
    safetyCheckId: crypto.randomUUID(),
    workspaceId: draft.workspaceId,
    replyDraftId,
    contentHash: hash,
    result: input.result,
    reasons: input.reasons ?? [],
    checkedAt: now()
  };
  store.safetyChecks.push(check);
  draft.status = input.result === "pass" ? "checked" : "blocked";
  draft.updatedAt = now();
  return check;
}

export function sendReplyDraft(replyDraftId: string) {
  const draft = getReplyDraft(replyDraftId);
  if (!draft) {
    return { ok: false, reason: "draft_not_found" as const };
  }

  const safetyCheck = [...store.safetyChecks]
    .reverse()
    .find(
      (check) =>
        check.replyDraftId === replyDraftId &&
        check.contentHash === draft.contentHash &&
        check.result === "pass"
    );

  if (!safetyCheck) {
    return { ok: false, reason: "safety_check_required" as const };
  }

  const conversation = getConversation(draft.workspaceId, draft.personId, draft.conversationId);
  if (!conversation) {
    return { ok: false, reason: "conversation_not_found" as const };
  }

  const message: Message = {
    messageId: crypto.randomUUID(),
    workspaceId: draft.workspaceId,
    personId: draft.personId,
    conversationId: draft.conversationId,
    channel: conversation.channel,
    direction: "outbound",
    body: draft.body,
    sentAt: now(),
    createdAt: now()
  };
  store.messages.push(message);
  draft.status = "sent";
  draft.updatedAt = now();
  return { ok: true, message };
}
