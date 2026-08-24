import { ok, requestMeta } from "@/lib/http";
import { getAllProviderSendReadiness } from "@/lib/adapters/readiness";

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const adapters = getAllProviderSendReadiness();
  const blockedChannels = adapters.filter((adapter) => !adapter.liveSendReady).map((adapter) => adapter.channel);

  return ok(
    {
      deliveryMode: {
        requested: adapters[0]?.requestedDeliveryMode ?? "dry_run",
        effectiveDefault: adapters.every((adapter) => adapter.effectiveDeliveryMode === "live") ? "live" : "dry_run"
      },
      summary: {
        totalChannels: adapters.length,
        liveReadyChannels: adapters.filter((adapter) => adapter.liveSendReady).length,
        blockedChannels,
        blockerCount: adapters.reduce((count, adapter) => count + adapter.blockers.length, 0),
        allLiveReady: blockedChannels.length === 0
      },
      adapters
    },
    meta
  );
}
