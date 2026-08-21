import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ok, fail, requestMeta } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import type { D1DatabaseLike } from "@/lib/persistence/d1";

export async function POST(request: Request) {
  const meta = requestMeta(request);
  const readiness = getPersistenceReadiness();
  if (readiness.driver !== "d1") return fail("D1_NOT_ACTIVE", "D1 persistence driver is not active", 409, meta);
  try {
    const db = getCloudflareContext().env.DB as unknown as D1DatabaseLike;
    await db.prepare("CREATE TABLE IF NOT EXISTS persistence_roundtrip_checks (id TEXT PRIMARY KEY, created_at TEXT NOT NULL)").run();
    const id = `rt_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    await db.prepare("INSERT INTO persistence_roundtrip_checks (id, created_at) VALUES (?, ?)").bind(id, createdAt).run();
    const row = await db.prepare("SELECT id, created_at FROM persistence_roundtrip_checks WHERE id = ? LIMIT 1").bind(id).first<{ id: string; created_at: string }>();
    if (!row || row.id !== id) return fail("D1_ROUNDTRIP_FAILED", "D1 write/read roundtrip failed", 503, meta);
    await db.prepare("DELETE FROM persistence_roundtrip_checks WHERE id = ?").bind(id).run();
    return ok({ persistenceDriver: "d1", roundtripReady: true, createdAt: row.created_at }, meta);
  } catch {
    return fail("D1_ROUNDTRIP_FAILED", "D1 write/read roundtrip failed", 503, meta);
  }
}
