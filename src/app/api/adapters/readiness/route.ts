import { ok, requestMeta } from "@/lib/http";
import { getAllProviderSendReadiness } from "@/lib/adapters/readiness";

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const adapters = getAllProviderSendReadiness();

  return ok(
    {
      deliveryMode: {
        requested: adapters[0]?.requestedDeliveryMode ?? "dry_run",
        effectiveDefault: adapters.every((adapter) => adapter.effectiveDeliveryMode === "live") ? "live" : "dry_run"
      },
      adapters
    },
    meta
  );
}
