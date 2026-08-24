import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAdapter } from "@/lib/adapters";
import { verifyAdapterWebhookSignature } from "@/lib/adapters/security";
import { normalizeAdapterWebhookPayload } from "@/lib/adapters/webhook";
import { fail, ok, requestMeta } from "@/lib/http";
import { D1CommunicationRepository, type D1DatabaseLike } from "@/lib/persistence/d1";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { ingestChannelMessage } from "@/lib/store";
import type { Channel } from "@/lib/types";

export function createAdapterWebhookRoute(channel: Exclude<Channel, "unknown">) {
  return async function POST(request: Request) {
    const meta = requestMeta(request);
    const rawBody = await request.text();
    const signature = verifyAdapterWebhookSignature({ channel, request, rawBody });

    if (!signature.ok) {
      return fail(
        signature.code,
        signature.message,
        signature.code === "ADAPTER_SIGNATURE_NOT_CONFIGURED" ? 503 : 401,
        meta
      );
    }

    const body = parseJson(rawBody);
    if (!body) return fail("INVALID_JSON", "Request body must be JSON", 400, meta);

    const routedWorkspace =
      request.headers.get("x-communication-workspace-id") ??
      new URL(request.url).searchParams.get("workspaceId") ??
      undefined;
    const normalized = normalizeAdapterWebhookPayload(channel, body, {workspaceId:routedWorkspace});
    if (!normalized.ok) return fail(normalized.code, normalized.message, 400, meta);

    const adapter = getAdapter(channel);
    if (!adapter) return fail("UNSUPPORTED_CHANNEL", `Unsupported channel: ${channel}`, 400, meta);

    const input = adapter.normalizeInbound(normalized.event);
    const readiness = getPersistenceReadiness();
    let result: unknown;

    if (readiness.driver==="d1") {
      try {
        const db = getCloudflareContext().env.DB as unknown as D1DatabaseLike;
        result = await new D1CommunicationRepository(db).ingestChannelMessage({
          ...input,
          channel
        });
      } catch {
        return fail("PERSISTENCE_ERROR", "Provider message could not be persisted", 503, meta);
      }
    } else {
      result = ingestChannelMessage(adapter.normalizeInbound(normalized.event));
    }

    const { raw: _raw, ...responseEvent } = normalized.event;
    return ok(
      {
        channel,
        signatureVerification: {
          enforced: signature.enforced,
          header: signature.signatureHeader
        },
        normalizedEvent: responseEvent,
        result,
        persistenceDriver:readiness.driver
      },
      { ...meta, eventName: "communication.message.received.v1" }
    );
  };
}

function parseJson(rawBody: string): unknown | null {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}
