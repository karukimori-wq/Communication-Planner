import { normalizeAdapterWebhookPayload } from "@/lib/adapters/webhook";
import { getAdapter } from "@/lib/adapters";
import { fail, ok, readJson, requestMeta } from "@/lib/http";
import { ingestChannelMessage } from "@/lib/store";
import type { Channel } from "@/lib/types";

export function createAdapterWebhookRoute(channel: Exclude<Channel, "unknown">) {
  return async function POST(request: Request) {
    const meta = requestMeta(request);
    const body = await readJson<unknown>(request);
    if (!body) return fail("INVALID_JSON", "Request body must be JSON", 400, meta);

    const normalized = normalizeAdapterWebhookPayload(channel, body);
    if (!normalized.ok) return fail(normalized.code, normalized.message, 400, meta);

    const adapter = getAdapter(channel);
    if (!adapter) return fail("UNSUPPORTED_CHANNEL", `Unsupported channel: ${channel}`, 400, meta);

    const result = ingestChannelMessage(adapter.normalizeInbound(normalized.event));
    const { raw: _raw, ...responseEvent } = normalized.event;

    return ok(
      {
        channel,
        normalizedEvent: responseEvent,
        message: result.message,
        conversation: result.conversation,
        person: result.person,
        duplicate: result.duplicate
      },
      {
        ...meta,
        eventName: "communication.message.received.v1"
      }
    );
  };
}
