export type EndpointContract = {
  method: "GET" | "POST" | "OPTIONS";
  path: string;
  operation: string;
  status: "implemented" | "planned";
  requiredFields: string[];
  prohibitedPayloadFields: string[];
  eventName?: string;
  sourceOfTruth: string[];
  safetyRules: string[];
};

export const prohibitedOwnedPayloadFields = [
  "customerMaster",
  "leadLifecycle",
  "reservation",
  "payment",
  "salesAmount",
  "revenue",
  "snsPostDraft",
  "numeriaReport",
  "velvetMemory",
  "aiUsage"
];

export const endpointContracts: EndpointContract[] = [
  {
    method: "GET",
    path: "/health",
    operation: "health.check",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: [],
    safetyRules: ["Return platform status vocabulary only"]
  },
  {
    method: "GET",
    path: "/version",
    operation: "version.read",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: [],
    safetyRules: ["Return build metadata only"]
  },
  {
    method: "GET",
    path: "/contracts/status",
    operation: "contracts.status.read",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Communication Planner contract readiness"],
    safetyRules: ["Expose ownership and event readiness without business-owned records"]
  },
  {
    method: "GET",
    path: "/api/contracts/endpoints",
    operation: "contracts.endpoints.read",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Communication Planner API contract registry"],
    safetyRules: ["Expose endpoint metadata for Platform Admin and integration checks"]
  },
  {
    method: "POST",
    path: "/api/channel-events/messages",
    operation: "channelEvents.messages.ingest",
    status: "implemented",
    requiredFields: ["workspaceId", "externalUserId", "body"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.received.v1 | communication.message.sent.v1",
    sourceOfTruth: ["Message", "Conversation", "ChannelIdentity", "Communication Person projection", "ConversationContext"],
    safetyRules: ["Normalize adapter input into Communication Planner-owned message records"]
  },
  {
    method: "GET",
    path: "/api/inbox",
    operation: "inbox.list",
    status: "implemented",
    requiredFields: ["workspaceId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Unified Inbox", "Conversation", "Message"],
    safetyRules: ["Read inbox items within one workspace"]
  },
  {
    method: "GET",
    path: "/api/persons/{personId}",
    operation: "persons.read",
    status: "implemented",
    requiredFields: ["workspaceId", "personId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Communication Person projection", "ChannelIdentity"],
    safetyRules: ["Return only Communication Planner person projection"]
  },
  {
    method: "GET",
    path: "/api/persons/{personId}/conversations",
    operation: "persons.conversations.list",
    status: "implemented",
    requiredFields: ["workspaceId", "personId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Conversation"],
    safetyRules: ["Conversations must be scoped to workspaceId + personId"]
  },
  {
    method: "GET",
    path: "/api/persons/{personId}/context",
    operation: "persons.context.read",
    status: "implemented",
    requiredFields: ["workspaceId", "personId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["ConversationContext", "Topic", "Promise", "Communication NextAction"],
    safetyRules: ["Context retrieval must be scoped to workspaceId + personId"]
  },
  {
    method: "POST",
    path: "/api/conversations/{conversationId}/reply-drafts",
    operation: "replyDrafts.create",
    status: "implemented",
    requiredFields: ["workspaceId", "personId", "conversationId", "purpose"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.reply_draft.created.v1",
    sourceOfTruth: ["ReplyDraft", "ConversationContext"],
    safetyRules: ["Reply generation must require personId and conversationId", "Conversation must belong to the provided person"]
  },
  {
    method: "POST",
    path: "/api/reply-drafts/{replyDraftId}/safety-check",
    operation: "replyDrafts.safetyCheck.create",
    status: "implemented",
    requiredFields: ["replyDraftId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.reply_safety.checked.v1",
    sourceOfTruth: ["SafetyCheck"],
    safetyRules: ["SafetyCheck must be tied to the draft content hash"]
  },
  {
    method: "POST",
    path: "/api/reply-drafts/{replyDraftId}/send",
    operation: "replyDrafts.send",
    status: "implemented",
    requiredFields: ["replyDraftId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.sent.v1",
    sourceOfTruth: ["Message", "ReplyDraft", "SafetyCheck"],
    safetyRules: ["Latest SafetyCheck must pass", "SafetyCheck hash must match draft hash", "Outbound message must use the original conversation channel"]
  }
];
