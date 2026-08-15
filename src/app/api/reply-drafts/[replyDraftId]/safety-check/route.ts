import { fail, ok, readJson, requestMeta } from "@/lib/http";
import { createSafetyCheck } from "@/lib/store";
import type { SafetyCheckInput } from "@/lib/types";

type RouteContext = { params: Promise<{ replyDraftId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { replyDraftId } = await context.params;
  const body = (await readJson<SafetyCheckInput>(request)) ?? {};

  const safetyCheck = await createSafetyCheck(replyDraftId, body);
  if (!safetyCheck) return fail("NOT_FOUND", "ReplyDraft not found", 404, meta);

  return ok({ safetyCheck }, { ...meta, eventName: "communication.reply_safety.checked.v1" });
}
