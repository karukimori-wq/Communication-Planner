import { fail, ok, readJson, requestMeta } from "@/lib/http";
import { updateReplyDraft } from "@/lib/store";
import type { UpdateReplyDraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const body = (await readJson<UpdateReplyDraftInput>(request)) ?? {};
  const result = await updateReplyDraft(replyDraftId, body);

  if (!result.ok) {
    return fail(result.code, result.message, result.code === "NOT_FOUND" ? 404 : 409, meta);
  }

  return ok({ replyDraft: result.draft }, { ...meta, eventName: "communication.reply_draft.updated.v1" });
}
