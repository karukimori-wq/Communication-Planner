import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("static contract guards", () => {
  it("documents Communication Planner ownership exclusions", () => {
    const readme = read("README.md");
    const schemaDoc = read("docs/database-schema.md");

    for (const forbiddenOwner of [
      "Customer master",
      "Lead lifecycle",
      "Reservation",
      "Payment",
      "Sales / Revenue",
      "SNS PostDraft",
      "Numeria Report",
      "AI Usage"
    ]) {
      assert.match(readme, new RegExp(forbiddenOwner.replaceAll("/", "\\/")));
    }

    assert.match(schemaDoc, /does not store Customer master/);
    assert.match(schemaDoc, /AI Usage as owned records/);
  });

  it("keeps reply draft creation scoped to workspaceId, personId, and conversationId", () => {
    const store = read("src/lib/store.ts");
    const route = read("src/app/api/conversations/[conversationId]/reply-drafts/route.ts");

    assert.match(store, /getConversation\(input\.workspaceId, input\.personId, input\.conversationId\)/);
    assert.match(route, /requireString\(body\.workspaceId, "workspaceId"\)/);
    assert.match(route, /requireString\(body\.personId, "personId"\)/);
    assert.match(route, /CONVERSATION_SCOPE_MISMATCH/);
  });

  it("requires a current passing SafetyCheck before send", () => {
    const store = read("src/lib/store.ts");
    const updateRoute = read("src/app/api/reply-drafts/[replyDraftId]/route.ts");
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");
    const sendDecisionsRoute = read("src/app/api/reply-drafts/[replyDraftId]/send-decisions/route.ts");
    const apiDesign = read("docs/api-design.md");
    const safetyRules = read("docs/safety-rules.md");
    const schema = read("db/schema.sql");
    const schemaDoc = read("docs/database-schema.md");

    assert.match(store, /SAFETY_CHECK_REQUIRED/);
    assert.match(store, /SAFETY_CHECK_FAILED/);
    assert.match(store, /SAFETY_CHECK_SCOPE_MISMATCH/);
    assert.match(store, /STALE_SAFETY_CHECK/);
    assert.match(store, /REPLY_DRAFT_ALREADY_SENT/);
    assert.match(store, /draft\.status === "sent"/);
    assert.match(store, /export async function updateReplyDraft/);
    assert.match(store, /draft\.contentHash = await contentHash\(draft\.body\)/);
    assert.match(store, /draft\.status = "draft"/);
    assert.match(store, /safetyCheck\.checkedContentHash !== draft\.contentHash/);
    assert.match(store, /export function buildReplySendDecision/);
    assert.match(store, /sendDecisions: ReplySendDecision\[\]/);
    assert.match(store, /export function recordReplySendDecision/);
    assert.match(store, /store\.sendDecisions\.push\(decision\)/);
    assert.match(store, /adapterDelivery: input\.adapterDelivery/);
    assert.match(store, /export function getReplySendDecisions/);
    assert.match(store, /decision\.replyDraftId === input\.replyDraftId/);
    assert.match(store, /decision\.workspaceId === input\.workspaceId/);
    assert.match(store, /decision\.personId === input\.personId/);
    assert.match(store, /decision\.conversationId === input\.conversationId/);
    assert.match(store, /safetyCheckScopeMatched: true/);
    assert.match(store, /sendScopeConfirmed: true/);
    assert.match(updateRoute, /export async function PATCH/);
    assert.match(updateRoute, /communication\.reply_draft\.updated\.v1/);
    assert.match(store, /workspaceId is required for SafetyCheck scope/);
    assert.match(store, /personId is required for SafetyCheck scope/);
    assert.match(store, /conversationId is required for SafetyCheck scope/);
    assert.match(sendRoute, /canSendReplyDraft\(replyDraftId\)/);
    assert.match(sendRoute, /validateSendConfirmation\(body, decision\.draft\)/);
    assert.match(sendRoute, /validateChannelConfirmation\(body, conversation\)/);
    assert.match(sendRoute, /getChannelIdentityForPerson\(decision\.draft\.workspaceId, decision\.draft\.personId, conversation\.channel\)/);
    assert.match(sendRoute, /CHANNEL_IDENTITY_REQUIRED/);
    assert.match(sendRoute, /sendThroughChannelAdapter/);
    assert.match(sendRoute, /adapterDelivery: adapterDelivery\.result/);
    assert.match(sendRoute, /SEND_CONFIRMATION_REQUIRED/);
    assert.match(sendRoute, /SEND_SCOPE_MISMATCH/);
    assert.match(sendRoute, /recordReplySendDecision/);
    assert.match(sendRoute, /sendDecision/);
    assert.match(sendDecisionsRoute, /export async function GET/);
    assert.match(sendDecisionsRoute, /searchParams\.get\("workspaceId"\)/);
    assert.match(sendDecisionsRoute, /searchParams\.get\("personId"\)/);
    assert.match(sendDecisionsRoute, /searchParams\.get\("conversationId"\)/);
    assert.match(sendDecisionsRoute, /REPLY_DRAFT_SCOPE_MISMATCH/);
    assert.match(sendDecisionsRoute, /getReplySendDecisions\(\{ replyDraftId, workspaceId, personId, conversationId \}\)/);
    assert.match(schema, /create table if not exists reply_send_decisions/);
    assert.match(schema, /safety_check_id text not null references safety_checks/);
    assert.match(schema, /message_id text not null references messages/);
    assert.match(schema, /adapter_delivery jsonb not null default '\{\}'::jsonb/);
    assert.match(schemaDoc, /reply_send_decisions/);
    assert.match(schemaDoc, /adapter_delivery/);
    assert.match(apiDesign, /Missing or mismatched scope fields force the SafetyCheck to `failed`/);
    assert.match(apiDesign, /Successful responses include `sendDecision` audit evidence/);
    assert.match(apiDesign, /CHANNEL_IDENTITY_REQUIRED/);
    assert.match(apiDesign, /adapterDelivery\.idempotencyKey/);
    assert.match(apiDesign, /original conversation channel confirmation/);
    assert.match(apiDesign, /GET \/api\/reply-drafts\/\{replyDraftId\}\/send-decisions/);
    assert.match(safetyRules, /SafetyCheck must include `workspaceId \+ personId \+ conversationId`/);
    assert.match(safetyRules, /Send must include `workspaceId \+ personId \+ conversationId \+ channel`/);
    assert.match(safetyRules, /send response includes `sendDecision` audit evidence/);
    assert.match(safetyRules, /send decision is stored and can be read only when `replyDraftId \+ workspaceId \+ personId \+ conversationId` match the draft/);
    assert.match(safetyRules, /Provider adapter delivery may run only after the API send gate passes/);
  });

  it("sends outbound messages on the original conversation channel", () => {
    const sendRoute = read("src/app/api/reply-drafts/[replyDraftId]/send/route.ts");

    assert.match(sendRoute, /getConversation\(decision\.draft\.workspaceId, decision\.draft\.personId, decision\.draft\.conversationId\)/);
    assert.match(sendRoute, /channel: conversation\.channel/);
    assert.doesNotMatch(sendRoute, /channel: "unknown"/);
  });

  it("keeps endpoint-level contract metadata available", () => {
    const contracts = read("src/lib/contracts.ts");
    const route = read("src/app/api/contracts/endpoints/route.ts");
    const statusRoute = read("src/app/contracts/status/route.ts");
    const apiDesign = read("docs/api-design.md");
    const events = read("docs/events.md");

    assert.match(contracts, /endpointContracts/);
    assert.match(contracts, /prohibitedOwnedPayloadFields/);
    assert.match(contracts, /replyDrafts\.send/);
    assert.match(contracts, /method: "PATCH"/);
    assert.match(contracts, /replyDrafts\.update/);
    assert.match(contracts, /communication\.reply_safety\.checked\.v1/);
    assert.match(contracts, /communication\.reply_draft\.updated\.v1/);
    assert.match(contracts, /requiredFields: \["replyDraftId", "workspaceId", "personId", "conversationId", "channel"\]/);
    assert.match(contracts, /SafetyCheck scope must match the reply draft/);
    assert.match(contracts, /Send confirmation scope must match the reply draft/);
    assert.match(contracts, /Send confirmation channel must match the original conversation channel/);
    assert.match(contracts, /Send response must include sendDecision audit evidence/);
    assert.match(contracts, /replyDrafts\.sendDecisions\.list/);
    assert.match(contracts, /\/api\/reply-drafts\/\{replyDraftId\}\/send-decisions/);
    assert.match(contracts, /Send decision history must be scoped to replyDraftId \+ workspaceId \+ personId \+ conversationId/);
    assert.match(route, /implementedCount/);
    assert.match(statusRoute, /endpointContractsPath: "\/api\/contracts\/endpoints"/);
    assert.match(statusRoute, /communication\.reply_draft\.updated\.v1/);
    assert.match(apiDesign, /GET \/api\/contracts\/endpoints/);
    assert.match(events, /communication\.reply_draft\.updated\.v1/);
  });

  it("exposes harness-compatible adapter webhook entry points", () => {
    const contracts = read("src/lib/contracts.ts");
    const webhookRoute = read("src/lib/adapters/webhook-route.ts");
    const webhookNormalizer = read("src/lib/adapters/webhook.ts");
    const lineRoute = read("src/app/api/adapters/line/webhook/route.ts");
    const xRoute = read("src/app/api/adapters/x/webhook/route.ts");
    const instagramRoute = read("src/app/api/adapters/instagram/webhook/route.ts");
    const adapterDoc = read("docs/channel-adapters.md");

    assert.match(contracts, /\/api\/adapters\/line\/webhook/);
    assert.match(contracts, /\/api\/adapters\/x\/webhook/);
    assert.match(contracts, /\/api\/adapters\/instagram\/webhook/);
    assert.match(webhookRoute, /ingestChannelMessage\(adapter\.normalizeInbound\(normalized\.event\)\)/);
    assert.match(webhookNormalizer, /firstObjectAt\(payload, \["events", "messages", "entries"\]\)/);
    assert.match(lineRoute, /createAdapterWebhookRoute\("line"\)/);
    assert.match(xRoute, /createAdapterWebhookRoute\("x"\)/);
    assert.match(instagramRoute, /createAdapterWebhookRoute\("instagram"\)/);
    assert.match(adapterDoc, /Shudesu\/line-harness-oss/);
    assert.match(adapterDoc, /communication\.message\.received\.v1/);
    assert.match(adapterDoc, /Implemented Send Adapter Flow/);
    assert.match(adapterDoc, /deliveryMode: "dry_run"/);
  });

  it("keeps adapter provider send dry-run until production credentials are configured", () => {
    const adapterTypes = read("src/lib/adapters/types.ts");
    const adapterSend = read("src/lib/adapters/send.ts");
    const lineAdapter = read("src/lib/adapters/line.ts");
    const xAdapter = read("src/lib/adapters/x.ts");
    const instagramAdapter = read("src/lib/adapters/instagram.ts");
    const ossAdoption = read("docs/oss-adoption.md");
    const sprint = read("docs/sprint-1.md");

    assert.match(adapterTypes, /deliveryMode: "dry_run" \| "live"/);
    assert.match(adapterTypes, /idempotencyKey: string/);
    assert.match(adapterTypes, /adapterReference: string/);
    assert.match(adapterSend, /buildProviderSendIdempotencyKey/);
    assert.match(adapterSend, /deliveryMode: "dry_run"/);
    assert.match(adapterSend, /ADAPTER_SEND_REJECTED/);
    assert.match(lineAdapter, /Shudesu\/line-harness-oss/);
    assert.match(xAdapter, /Shudesu\/x-harness-oss/);
    assert.match(instagramAdapter, /Shudesu\/ig-harness-oss/);
    assert.match(ossAdoption, /Harness Review Snapshot/);
    assert.match(ossAdoption, /License not declared in repository metadata/);
    assert.match(sprint, /Add adapter dry-run send results \| Done/);
    assert.match(sprint, /Store adapter delivery evidence on sendDecision \| Done/);
  });

  it("keeps provider message ingestion idempotent", () => {
    const store = read("src/lib/store.ts");
    const webhookRoute = read("src/lib/adapters/webhook-route.ts");
    const adapterDoc = read("docs/channel-adapters.md");

    assert.match(store, /function findDuplicateMessage\(input: ChannelMessageInput\)/);
    assert.match(store, /message\.externalMessageId === input\.externalMessageId/);
    assert.match(store, /duplicate: true/);
    assert.match(store, /duplicate: false/);
    assert.match(store, /existingIdentity = store\.channelIdentities\.find/);
    assert.match(webhookRoute, /duplicate: result\.duplicate/);
    assert.match(adapterDoc, /Duplicate provider message ids must not create duplicate Message records/);
  });

  it("stores context insights as person-scoped Communication Planner records", () => {
    const types = read("src/lib/types.ts");
    const store = read("src/lib/store.ts");
    const route = read("src/app/api/channel-events/messages/route.ts");
    const schema = read("db/schema.sql");
    const schemaDoc = read("docs/database-schema.md");

    assert.match(types, /export type Topic/);
    assert.match(types, /export type Promise/);
    assert.match(types, /export type CommunicationNextAction/);
    assert.match(types, /topics\?: string\[\]/);
    assert.match(types, /promises\?: string\[\]/);
    assert.match(types, /nextActions\?: string\[\]/);
    assert.match(store, /function appendContextInsights/);
    assert.match(store, /sourceMessageId: input\.messageId/);
    assert.match(store, /context\.topicIds\.push/);
    assert.match(store, /context\.promiseIds\.push/);
    assert.match(store, /context\.nextActionIds\.push/);
    assert.match(route, /topics: body\.topics/);
    assert.match(route, /promises: body\.promises/);
    assert.match(route, /nextActions: body\.nextActions/);
    assert.match(schema, /create table if not exists topics/);
    assert.match(schema, /create table if not exists promises/);
    assert.match(schema, /create table if not exists communication_next_actions/);
    assert.match(schemaDoc, /source_message_id/);
  });

  it("uses only same-person context insights for generated reply drafts", () => {
    const store = read("src/lib/store.ts");
    const safetyRules = read("docs/safety-rules.md");
    const apiDesign = read("docs/api-design.md");

    assert.match(store, /function formatContextForDraft/);
    assert.match(store, /Topics: \$\{context\.topics\.map/);
    assert.match(store, /Promises: \$\{context\.promises\.map/);
    assert.match(store, /Next actions: \$\{context\.nextActions\.map/);
    assert.match(store, /getPersonContext\(input\.workspaceId, input\.personId\)/);
    assert.match(store, /formatContextForDraft\(context\)/);
    assert.match(safetyRules, /ReplyDraft context may include Topic, Promise, and Communication NextAction only from the same `workspaceId \+ personId`/);
    assert.match(apiDesign, /must not use context insight records from another `personId`/);
  });

  it("keeps CORS and preflight support enabled", () => {
    const http = read("src/lib/http.ts");
    const middleware = read("src/middleware.ts");
    const cors = read("src/lib/cors.ts");

    assert.match(cors, /Access-Control-Allow-Origin/);
    assert.match(cors, /GET,POST,PATCH,OPTIONS/);
    assert.match(http, /headers: withCors\(\)/);
    assert.match(middleware, /request\.method === "OPTIONS"/);
    assert.match(middleware, /status: 204/);
  });

  it("exposes the operator dashboard safety workflow", () => {
    const page = read("src/app/page.tsx");
    const dashboardClient = read("src/app/dashboard-client.tsx");
    const dashboardData = read("src/lib/dashboard.ts");
    const dashboardRoute = read("src/app/api/dashboard/route.ts");
    const store = read("src/lib/store.ts");
    const contracts = read("src/lib/contracts.ts");
    const apiDesign = read("docs/api-design.md");
    const dashboardDoc = read("docs/operator-dashboard.md");
    const sprint = read("docs/sprint-1.md");

    assert.match(page, /CommunicationDashboard/);
    assert.match(page, /getDashboardSnapshot/);
    assert.match(page, /dashboardSeedWorkspaceId/);
    assert.match(dashboardRoute, /export async function GET/);
    assert.match(dashboardRoute, /getDashboardSnapshot\(workspaceId\)/);
    assert.match(store, /export async function ensureDemoWorkspaceSeeded/);
    assert.match(store, /export async function getDashboardSnapshot/);
    assert.match(store, /canSendReplyDraft\(replyDraft\.replyDraftId\)/);
    assert.match(dashboardClient, /aria-label="inbox"/);
    assert.match(dashboardClient, /aria-label="person context"/);
    assert.match(dashboardClient, /aria-label="reply safety"/);
    assert.match(dashboardClient, /refreshDashboard/);
    assert.match(dashboardClient, /Save draft/);
    assert.match(dashboardClient, /Run SafetyCheck/);
    assert.match(dashboardClient, /Send reply/);
    assert.match(dashboardClient, /\/api\/dashboard\?workspaceId=/);
    assert.match(dashboardClient, /PATCH/);
    assert.match(dashboardClient, /\/safety-check/);
    assert.match(dashboardClient, /data-send-gate=\{sendUnlocked \? "unlocked" : "locked"\}/);
    assert.match(dashboardClient, /disabled=\{isBusy \|\| !sendUnlocked\}/);
    assert.match(dashboardClient, /selectedConversation\.safety\.sendReady/);
    assert.match(dashboardClient, /API readiness/);
    assert.match(dashboardClient, /workspace \+ person \+ conversation confirmed/);
    assert.match(dashboardClient, /latest SafetyCheck passed for current draft hash/);
    assert.match(dashboardData, /Shudesu\/line-harness-oss/);
    assert.match(dashboardData, /Shudesu\/x-harness-oss/);
    assert.match(dashboardData, /Shudesu\/ig-harness-oss/);
    assert.match(dashboardData, /reply\.generate/);
    assert.match(dashboardData, /safety_check/);
    assert.match(dashboardData, /context\.summarize/);
    assert.match(contracts, /path: "\/api\/dashboard"/);
    assert.match(contracts, /Expose send readiness without bypassing the API send gate/);
    assert.match(apiDesign, /GET \/api\/dashboard/);
    assert.match(dashboardDoc, /The API remains the source of truth/);
    assert.match(dashboardDoc, /PATCH \/api\/reply-drafts\/\{replyDraftId\}/);
    assert.match(dashboardDoc, /POST \/api\/reply-drafts\/\{replyDraftId\}\/send/);
    assert.match(dashboardDoc, /Send stays locked until scope, channel, context, and SafetyCheck are confirmed/);
    assert.match(dashboardDoc, /Minimum pilot readiness requires/);
    assert.match(sprint, /Add operator dashboard UI shell \| Done/);
    assert.match(sprint, /Add dashboard UI contract tests and docs \| Done/);
    assert.match(sprint, /Add store-backed dashboard snapshot API \| Done/);
    assert.match(sprint, /Add dashboard action contract guards \| Done/);
  });
});
