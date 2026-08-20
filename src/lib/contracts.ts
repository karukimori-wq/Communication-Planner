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

export type PlatformAdminRegistration = {
  appName: "communication-planner";
  displayName: "Communication Planner";
  runtimeUrlEnvKey: "COMMUNICATION_PLANNER_BASE_URL";
  runtimeUrlStatus: "pending" | "configured";
  requiredHealthEndpoints: {
    method: "GET";
    path: string;
    purpose: string;
  }[];
  stableEvents: string[];
  sourceOfTruth: string[];
  prohibitedSourceOfTruth: string[];
  registrationGate: string[];
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

export const communicationPlannerSourceOfTruth = [
  "Unified Inbox",
  "Communication Person projection",
  "ChannelIdentity",
  "Conversation",
  "Message",
  "ConversationContext",
  "Topic",
  "Promise",
  "Communication NextAction",
  "ReplyDraft",
  "SafetyCheck",
  "ReplySendDecision",
  "ChannelAdapter integration state"
];

export const communicationPlannerStableEvents = [
  "communication.message.received.v1",
  "communication.message.sent.v1",
  "communication.context.updated.v1",
  "communication.promise.created.v1",
  "communication.next_action.created.v1",
  "communication.reply_draft.created.v1",
  "communication.reply_draft.updated.v1",
  "communication.reply_safety.checked.v1",
  "communication.person_channel.linked.v1"
];

export const platformAdminRegistration: PlatformAdminRegistration = {
  appName: "communication-planner",
  displayName: "Communication Planner",
  runtimeUrlEnvKey: "COMMUNICATION_PLANNER_BASE_URL",
  runtimeUrlStatus: process.env.COMMUNICATION_PLANNER_BASE_URL ? "configured" : "pending",
  requiredHealthEndpoints: [
    {
      method: "GET",
      path: "/health",
      purpose: "Runtime health"
    },
    {
      method: "GET",
      path: "/version",
      purpose: "Build and version metadata"
    },
    {
      method: "GET",
      path: "/contracts/status",
      purpose: "Contract readiness"
    },
    {
      method: "GET",
      path: "/api/adapters/readiness",
      purpose: "Provider readiness and dry-run/live gate visibility"
    }
  ],
  stableEvents: communicationPlannerStableEvents,
  sourceOfTruth: communicationPlannerSourceOfTruth,
  prohibitedSourceOfTruth: prohibitedOwnedPayloadFields,
  registrationGate: [
    "Production runtime URL is finalized",
    "Health endpoints return HTTP 200",
    "/contracts/status returns success",
    "/api/adapters/readiness confirms dry_run unless every live-send gate is configured"
  ]
};

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
    method: "GET",
    path: "/api/platform-admin/registration",
    operation: "platformAdmin.registration.read",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Communication Planner app registration metadata"],
    safetyRules: ["Expose registration metadata without secrets or business-owned records"]
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
    path: "/api/adapters/readiness",
    operation: "adapters.readiness.read",
    status: "implemented",
    requiredFields: [],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["ChannelAdapter integration state", "Provider credential readiness"],
    safetyRules: ["Expose provider send readiness without returning secret values", "Live provider send must fall back to dry_run until credentials and operational gates pass"]
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
    path: "/api/dashboard",
    operation: "dashboard.read",
    status: "implemented",
    requiredFields: ["workspaceId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["Unified Inbox", "ConversationContext", "ReplyDraft", "SafetyCheck", "ChannelAdapter integration state"],
    safetyRules: ["Read one workspace dashboard snapshot", "Expose send readiness without bypassing the API send gate"]
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
    requiredFields: ["replyDraftId", "workspaceId", "personId", "conversationId", "channel"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    eventName: "communication.message.sent.v1",
    sourceOfTruth: ["Message", "ReplyDraft", "SafetyCheck", "ReplySendDecision", "ChannelAdapter integration state"],
    safetyRules: ["Latest SafetyCheck must pass", "SafetyCheck hash must match draft hash", "SafetyCheck scope must match the reply draft", "Send confirmation scope must match the reply draft", "Send confirmation channel must match the original conversation channel", "ChannelIdentity must exist before provider send", "Send decision audit must store the confirmed channel", "Send decision audit must store adapter delivery evidence", "Send response must include sendDecision audit evidence", "Outbound message must use the original conversation channel"]
  },
  {
    method: "GET",
    path: "/api/reply-drafts/{replyDraftId}/send-decisions",
    operation: "replyDrafts.sendDecisions.list",
    status: "implemented",
    requiredFields: ["replyDraftId", "workspaceId", "personId", "conversationId"],
    prohibitedPayloadFields: prohibitedOwnedPayloadFields,
    sourceOfTruth: ["ReplySendDecision"],
    safetyRules: ["Send decision history must be scoped to replyDraftId + workspaceId + personId + conversationId"]
  }
];
