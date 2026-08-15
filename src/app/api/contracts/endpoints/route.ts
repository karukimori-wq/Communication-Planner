import { endpointContracts } from "@/lib/contracts";
import { ok } from "@/lib/http";

export function GET() {
  return ok({
    appName: "communication-planner",
    contractVersion: "2026-08-15",
    endpoints: endpointContracts,
    implementedCount: endpointContracts.filter((endpoint) => endpoint.status === "implemented").length,
    plannedCount: endpointContracts.filter((endpoint) => endpoint.status === "planned").length
  });
}
