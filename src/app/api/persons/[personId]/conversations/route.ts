import { fail, ok, requestMeta } from "@/lib/http";
import { getPersonConversations } from "@/lib/store";

type RouteContext = { params: Promise<{ personId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { personId } = await context.params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  return ok({ conversations: getPersonConversations(workspaceId, personId) }, meta);
}
