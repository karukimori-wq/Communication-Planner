import { fail, ok, requestMeta } from "@/lib/http";
import { getDashboardSnapshot } from "@/lib/store";

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  const snapshot = await getDashboardSnapshot(workspaceId);
  return ok({ snapshot }, meta);
}
