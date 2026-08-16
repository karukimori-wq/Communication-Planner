import { fail, ok, requestMeta } from "@/lib/http";
import { getReplyDraft, getReplySendDecisions } from "@/lib/store";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const { replyDraftId } = await context.params;
  const workspaceId = searchParams.get("workspaceId");
  const personId = searchParams.get("personId");
  const conversationId = searchParams.get("conversationId");
  const draft = getReplyDraft(replyDraftId);

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);
  if (!personId) return fail("VALIDATION_ERROR", "personId is required", 400, meta);
  if (!conversationId) return fail("VALIDATION_ERROR", "conversationId is required", 400, meta);

  if (!draft) {
    return fail("NOT_FOUND", "ReplyDraft not found", 404, meta);
  }

  if (draft.workspaceId !== workspaceId || draft.personId !== personId || draft.conversationId !== conversationId) {
    return fail("REPLY_DRAFT_SCOPE_MISMATCH", "Scope does not match reply draft", 403, meta);
  }

  return ok({ sendDecisions: getReplySendDecisions({ replyDraftId, workspaceId, personId, conversationId }) }, meta);
}
