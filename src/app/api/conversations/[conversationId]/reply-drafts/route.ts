import { fail, ok, readJson, requestMeta, requireString } from "@/lib/http";
import { createReplyDraft } from "@/lib/store";
import type { CreateReplyDraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ conversationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { conversationId } = await context.params;
  const body = await readJson<Partial<CreateReplyDraftInput>>(request);
  if (!body) return fail("INVALID_JSON", "Request body must be JSON", 400, meta);

  const workspaceId = requireString(body.workspaceId, "workspaceId");
  if (typeof workspaceId !== "string") return fail(workspaceId.code, workspaceId.message, 400, meta);

  const personId = requireString(body.personId, "personId");
  if (typeof personId !== "string") return fail(personId.code, personId.message, 400, meta);

  const purpose = requireString(body.purpose, "purpose");
  if (typeof purpose !== "string") return fail(purpose.code, purpose.message, 400, meta);

  const draft = await createReplyDraft({
    workspaceId,
    personId,
    conversationId,
    purpose,
    body: body.body
  });

  if (!draft) {
    return fail(
      "CONVERSATION_SCOPE_MISMATCH",
      "Conversation must exist and belong to the provided workspaceId and personId",
      404,
      meta
    );
  }

  return ok({ replyDraft: draft }, { ...meta, eventName: "communication.reply_draft.created.v1" });
}
