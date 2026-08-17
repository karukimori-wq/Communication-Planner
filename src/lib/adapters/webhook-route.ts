import { normalizeAdapterWebhookPayload } from "@/lib/adapters/webhook";
import { getAdapter } from "@/lib/adapters";
import { verifyAdapterWebhookSignature } from "@/lib/adapters/security";
import { fail, ok, requestMeta } from "@/lib/http";
import { ingestChannelMessage } from "@/lib/store";
import type { Channel } from "@/lib/types";

export function createAdapterWebhookRoute(channel: Exclude<Channel, "unknown">) {
  return async function POST(request: Request) {
    const meta = requestMeta(request);
    const rawBody = await request.text();
    const signature = verifyAdapterWebhookSignature({ channel, request, rawBody });
    if (!signature.ok) {
      const httpStatus = signature.code === "ADAPTER_SIGNATURE_NOT_CONFIGURED" ? 503 : 401;
      return fail(signature.code, signature.message, httpStatus, meta);
    }

    const body = parseJson(rawBody);
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
        signatureVerification: {
          enforced: signature.enforced,
          header: signature.signatureHeader
        },
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

function parseJson(rawBody: string): unknown | null {
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}
