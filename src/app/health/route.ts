import { ok } from "@/lib/http";

export function GET() {
  return ok({
    appName: "communication-planner",
    service: "Communication Planner API",
    healthy: true
  });
}
