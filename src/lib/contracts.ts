export type EndpointContract = {
  method: "GET" | "POST" | "PATCH" | "OPTIONS";
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
    method: "POST",
    path: "/api/adapters/line/webhook",
    operation: "adapters.line.webhook.ingest",
    status: "implemented",
    requiredFields: ["workspaceId", "externalUserId or provider user id", "body or provider text message"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.received.v1",
    sourceOfTruth: ["LINE Harness-compatible webhook payload", "Message", "Conversation", "ChannelIdentity"],
    safetyRules: ["Normalize LINE provider payload before core ingestion", "Store inbound messages only"]
  },
  {
    method: "POST",
    path: "/api/adapters/x/webhook",
    operation: "adapters.x.webhook.ingest",
    status: "implemented",
    requiredFields: ["workspaceId", "externalUserId or provider user id", "body or provider text message"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.received.v1",
    sourceOfTruth: ["X Harness-compatible webhook payload", "Message", "Conversation", "ChannelIdentity"],
    safetyRules: ["Normalize X provider payload before core ingestion", "Do not import marketing automation concepts"]
  },
  {
    method: "POST",
    path: "/api/adapters/instagram/webhook",
    operation: "adapters.instagram.webhook.ingest",
    status: "implemented",
    requiredFields: ["workspaceId", "externalUserId or provider user id", "body or provider text message"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.received.v1",
    sourceOfTruth: ["Instagram Harness-compatible webhook payload", "Message", "Conversation", "ChannelIdentity"],
    safetyRules: ["Normalize Instagram provider payload before core ingestion", "Store DM messages as person-scoped conversations"]
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
    requiredFields: ["replyDraftId", "workspaceId", "personId", "conversationId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.reply_safety.checked.v1",
    sourceOfTruth: ["SafetyCheck"],
    safetyRules: ["SafetyCheck must be tied to the draft content hash", "SafetyCheck scope must match the reply draft"]
  },
  {
    method: "PATCH",
    path: "/api/reply-drafts/{replyDraftId}",
    operation: "replyDrafts.update",
    status: "implemented",
    requiredFields: ["replyDraftId", "workspaceId", "personId", "conversationId", "body or purpose"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.reply_draft.updated.v1",
    sourceOfTruth: ["ReplyDraft"],
    safetyRules: ["ReplyDraft update must match workspaceId + personId + conversationId", "Updating body must refresh content hash and require a new SafetyCheck"]
  },
  {
    method: "POST",
    path: "/api/reply-drafts/{replyDraftId}/send",
    operation: "replyDrafts.send",
    status: "implemented",
    requiredFields: ["replyDraftId", "workspaceId", "personId", "conversationId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.sent.v1",
    sourceOfTruth: ["Message", "ReplyDraft", "SafetyCheck"],
    safetyRules: ["Latest SafetyCheck must pass", "SafetyCheck hash must match draft hash", "Send confirmation scope must match the reply draft", "Outbound message must use the original conversation channel"]
  }
];
