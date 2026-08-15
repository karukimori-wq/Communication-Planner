import { fail, ok, requestMeta } from "@/lib/http";
import { getPerson } from "@/lib/store";

type RouteContext = { params: Promise<{ personId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const meta = requestMeta(request);
  const { personId } = await context.params;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  const person = getPerson(workspaceId, personId);
  if (!person) return fail("NOT_FOUND", "Person not found", 404, meta);

  return ok({ person }, meta);
}
