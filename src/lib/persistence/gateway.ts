import { getReplyDraft, getReplySendDecisions } from "@/lib/store";
import { getPersistenceReadiness } from "./driver";
import { D1CommunicationRepository, type D1DatabaseLike } from "./d1";

export type ReplyDraftScope = { workspaceId: string; personId: string; conversationId: string; replyDraftId: string };

export async function getScopedSendDecisionHistory(scope: ReplyDraftScope, options?: { db?: D1DatabaseLike; env?: Record<string, string | undefined> }) {
  const readiness = getPersistenceReadiness(options?.env);
  if (readiness.driver === "d1") {
    if (!options?.db) throw new Error("D1_BINDING_UNAVAILABLE");
    const repository = new D1CommunicationRepository(options.db);
    const draft = await repository.getReplyDraft(scope);
    if (!draft) return { found: false as const, driver: "d1" as const, sendDecisions: [] };
    return { found: true as const, driver: "d1" as const, sendDecisions: await repository.listSendDecisions(scope) };
  }

  const draft = getReplyDraft(scope.replyDraftId);
  if (!draft) return { found: false as const, driver: readiness.driver, sendDecisions: [] };
  if (draft.workspaceId !== scope.workspaceId || draft.personId !== scope.personId || draft.conversationId !== scope.conversationId) throw new Error("REPLY_DRAFT_SCOPE_MISMATCH");
  return { found: true as const, driver: readiness.driver, sendDecisions: getReplySendDecisions(scope) };
}
