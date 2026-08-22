import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fail, ok, requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { D1CommunicationRepository, type D1DatabaseLike } from "@/lib/persistence/d1";
import { getInbox } from "@/lib/store";

export async function GET(request: Request) {
  const meta=requestMeta(request); const {searchParams}=new URL(request.url); const workspaceId=searchParams.get("workspaceId");
  if(!workspaceId)return fail("VALIDATION_ERROR","workspaceId is required",400,meta);
  const readiness=getPersistenceReadiness();
  if(readiness.driver==="d1") try { const db=getCloudflareContext().env.DB as unknown as D1DatabaseLike; const items=await new D1CommunicationRepository(db).listInbox(workspaceId); return ok({items,persistenceDriver:"d1"},meta); } catch { return fail("PERSISTENCE_ERROR","Inbox could not be loaded",503,meta); }
  return ok({items:getInbox(workspaceId),persistenceDriver:readiness.driver},meta);
}
