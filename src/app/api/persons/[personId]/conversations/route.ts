import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fail, ok, requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { D1CommunicationRepository, type D1DatabaseLike } from "@/lib/persistence/d1";
import { getPersonConversations } from "@/lib/store";
type RouteContext={params:Promise<{personId:string}>};
export async function GET(request:Request,context:RouteContext){const meta=requestMeta(request);const{personId}=await context.params;const{searchParams}=new URL(request.url);const workspaceId=searchParams.get("workspaceId");if(!workspaceId)return fail("VALIDATION_ERROR","workspaceId is required",400,meta);const readiness=getPersistenceReadiness();if(readiness.driver==="d1")try{const db=getCloudflareContext().env.DB as unknown as D1DatabaseLike;const conversations=await new D1CommunicationRepository(db).listPersonConversations(workspaceId,personId);return ok({conversations,persistenceDriver:"d1"},meta);}catch{return fail("PERSISTENCE_ERROR","Person conversations could not be loaded",503,meta);}return ok({conversations:getPersonConversations(workspaceId,personId),persistenceDriver:readiness.driver},meta);}
