import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fail,ok,requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import type { D1DatabaseLike } from "@/lib/persistence/d1";
import { getD1DashboardSnapshot } from "@/lib/persistence/d1-dashboard";
import { getDashboardSnapshot } from "@/lib/store";
import { withDashboardSendDecisionHistory } from "@/lib/dashboard-send-history";
export async function GET(request:Request){const meta=requestMeta(request),{searchParams}=new URL(request.url),workspaceId=searchParams.get("workspaceId");if(!workspaceId)return fail("VALIDATION_ERROR","workspaceId is required",400,meta);const readiness=getPersistenceReadiness();if(readiness.driver==="d1")try{const db=getCloudflareContext().env.DB as unknown as D1DatabaseLike;return ok({snapshot:await getD1DashboardSnapshot(db,workspaceId),persistenceDriver:"d1"},meta);}catch{return fail("PERSISTENCE_ERROR","Dashboard could not be projected from D1",503,meta);}const snapshot=withDashboardSendDecisionHistory(await getDashboardSnapshot(workspaceId));return ok({snapshot,persistenceDriver:readiness.driver},meta);}
