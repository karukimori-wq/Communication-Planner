import { fail, ok, requestMeta } from "@/lib/http";
import { getDashboardSnapshot } from "@/lib/store";
import { withDashboardSendDecisionHistory } from "@/lib/dashboard-send-history";

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) return fail("VALIDATION_ERROR", "workspaceId is required", 400, meta);

  const snapshot = withDashboardSendDecisionHistory(await getDashboardSnapshot(workspaceId));
  return ok({ snapshot }, meta);
}
