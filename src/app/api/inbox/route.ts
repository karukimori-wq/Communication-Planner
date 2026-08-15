import { fail, ok, requestMeta } from "@/lib/http";
import { getInbox } from "@/lib/store";

export function GET(request: Request) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  return ok({ items: getInbox(workspaceId) }, meta);
}
