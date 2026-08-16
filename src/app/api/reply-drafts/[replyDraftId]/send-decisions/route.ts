import { fail, ok, requestMeta } from "@/lib/http";
import { getReplyDraft, getReplySendDecisions } from "@/lib/store";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const draft = getReplyDraft(replyDraftId);

  if (!draft) {
    return fail("NOT_FOUND", "ReplyDraft not found", 404, meta);
  }

  return ok({ sendDecisions: getReplySendDecisions(replyDraftId) }, meta);
}
