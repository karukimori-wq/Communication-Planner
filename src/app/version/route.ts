import { ok } from "@/lib/http";
import packageJson from "../../../package.json";

export function GET() {
  return ok({
    appName: "communication-planner",
    version: packageJson.version,
    contractVersion: "2026-08-15",
    build: process.env.VERCEL_GIT_COMMIT_SHA ?? "local"
  });
}
