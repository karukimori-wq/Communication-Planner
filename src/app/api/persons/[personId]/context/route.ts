import { fail, ok, requestMeta } from "@/lib/http";
import { getPersonContext } from "@/lib/store";

type RouteContext = { params: Promise<{ personId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { personId } = await context.params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  const contextRecord = getPersonContext(workspaceId, personId);
  if (!contextRecord) return fail("NOT_FOUND", "Person context not found", 404, meta);

  return ok({ context: contextRecord }, meta);
}
