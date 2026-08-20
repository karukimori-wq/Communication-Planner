import { platformAdminRegistration } from "@/lib/contracts";
import { ok, requestMeta } from "@/lib/http";

export function GET(request: Request) {
  const meta = requestMeta(request);

  return ok(platformAdminRegistration, meta);
}
