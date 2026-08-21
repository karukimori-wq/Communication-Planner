import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fail, ok, requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { getScopedSendDecisionHistory } from "@/lib/persistence/gateway";
import type { D1DatabaseLike } from "@/lib/persistence/d1";
import type { ReplySendDecision, SendDecisionHistoryItem } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

type D1DecisionRow = {
  id: string; reply_draft_id: string; safety_check_id: string; message_id: string; workspace_id: string; person_id: string; conversation_id: string;
  channel: "line" | "x" | "instagram"; content_hash: string; delivery_mode: "dry_run" | "live"; adapter_reference: string; adapter_delivery_json: string; decided_at: string;
};

function memoryHistoryItem(decision: ReplySendDecision): SendDecisionHistoryItem {
  return { sendDecisionId: decision.sendDecisionId, replyDraftId: decision.replyDraftId, safetyCheckId: decision.safetyCheckId, messageId: decision.messageId, workspaceId: decision.workspaceId, personId: decision.personId, conversationId: decision.conversationId, channel: decision.channel, contentHash: decision.contentHash, deliveryMode: decision.adapterDelivery.deliveryMode, adapterReference: decision.adapterDelivery.adapterReference, accepted: decision.adapterDelivery.accepted, externalMessageId: decision.adapterDelivery.externalMessageId, providerStatus: decision.adapterDelivery.providerStatus, providerCode: decision.adapterDelivery.providerCode, decidedAt: decision.decidedAt };
}

function d1HistoryItem(decision: D1DecisionRow): SendDecisionHistoryItem {
  let delivery: Record<string, unknown> = {};
  try { delivery = JSON.parse(decision.adapter_delivery_json) as Record<string, unknown>; } catch { delivery = {}; }
  return { sendDecisionId: decision.id, replyDraftId: decision.reply_draft_id, safetyCheckId: decision.safety_check_id, messageId: decision.message_id, workspaceId: decision.workspace_id, personId: decision.person_id, conversationId: decision.conversation_id, channel: decision.channel, contentHash: decision.content_hash, deliveryMode: decision.delivery_mode, adapterReference: decision.adapter_reference, accepted: delivery.accepted === true, externalMessageId: typeof delivery.externalMessageId === "string" ? delivery.externalMessageId : undefined, providerStatus: typeof delivery.providerStatus === "number" ? delivery.providerStatus : undefined, providerCode: typeof delivery.providerCode === "string" ? delivery.providerCode : undefined, decidedAt: decision.decided_at };
}

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const { replyDraftId } = await context.params;
  const workspaceId = searchParams.get("workspaceId"); const personId = searchParams.get("personId"); const conversationId = searchParams.get("conversationId");
  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);
  if (!personId) return fail("VALIDATION_ERROR", "personId is required", 400, meta);
  if (!conversationId) return fail("VALIDATION_ERROR", "conversationId is required", 400, meta);

  try {
    const readiness = getPersistenceReadiness();
    const db = readiness.driver === "d1" ? (getCloudflareContext().env.DB as unknown as D1DatabaseLike) : undefined;
    const result = await getScopedSendDecisionHistory({ replyDraftId, workspaceId, personId, conversationId }, { db });
    if (!result.found) return fail("NOT_FOUND", "ReplyDraft not found", 404, meta);
    const sendDecisions = result.driver === "d1" ? (result.sendDecisions as D1DecisionRow[]).map(d1HistoryItem) : (result.sendDecisions as ReplySendDecision[]).map(memoryHistoryItem);
    return ok({ sendDecisions, persistenceDriver: result.driver }, meta);
  } catch (error) {
    const code = error instanceof Error ? error.message : "PERSISTENCE_ERROR";
    if (code === "REPLY_DRAFT_SCOPE_MISMATCH") return fail(code, "Scope does not match reply draft", 403, meta);
    return fail("PERSISTENCE_ERROR", "Send decision history could not be loaded", 503, meta);
  }
}
