import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ok, fail, requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { D1CommunicationRepository, type D1DatabaseLike } from "@/lib/persistence/d1";

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const readiness = getPersistenceReadiness();
  if (readiness.driver !== "d1") {
    return ok({ ...readiness, d1Reachable: false, databaseBackedPersistenceReady: readiness.driver === "postgres" && readiness.postgresConfigured }, meta);
  }
  try {
    const db = getCloudflareContext().env.DB as unknown as D1DatabaseLike;
    const repository = new D1CommunicationRepository(db);
    const d1Reachable = await repository.healthcheck();
    return ok({ ...readiness, d1Reachable, databaseBackedPersistenceReady: d1Reachable }, meta);
  } catch {
    return fail("D1_UNREACHABLE", "D1 persistence is configured but unreachable", 503, meta);
  }
}
