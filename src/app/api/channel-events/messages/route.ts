import { getCloudflareContext } from "@opennextjs/cloudflare";
import { fail, ok, readJson, requestMeta, requireString } from "@/lib/http";
import { getPersistenceReadiness } from "@/lib/persistence/driver";
import { D1CommunicationRepository, type D1DatabaseLike } from "@/lib/persistence/d1";
import { ingestChannelMessage } from "@/lib/store";
import type { Channel, ChannelMessageInput, MessageDirection } from "@/lib/types";

const supportedChannels = new Set<Channel>(["line", "x", "instagram", "unknown"]);
const supportedDirections = new Set<MessageDirection>(["inbound", "outbound"]);
function normalizeChannel(channel: Partial<ChannelMessageInput>["channel"]) { const normalized = channel ?? "unknown"; return supportedChannels.has(normalized) ? normalized : null; }
function normalizeDirection(direction: Partial<ChannelMessageInput>["direction"]) { const normalized = direction ?? "inbound"; return supportedDirections.has(normalized) ? normalized : null; }

export async function POST(request: Request) {
  const meta = requestMeta(request);
  const body = await readJson<Partial<ChannelMessageInput>>(request);
  if (!body) return fail("INVALID_JSON", "Request body must be JSON", 400, meta);
  const workspaceId = requireString(body.workspaceId, "workspaceId"); if (typeof workspaceId !== "string") return fail(workspaceId.code, workspaceId.message, 400, meta);
  const externalUserId = requireString(body.externalUserId, "externalUserId"); if (typeof externalUserId !== "string") return fail(externalUserId.code, externalUserId.message, 400, meta);
  const messageBody = requireString(body.body, "body"); if (typeof messageBody !== "string") return fail(messageBody.code, messageBody.message, 400, meta);
  const channel = normalizeChannel(body.channel); if (!channel) return fail("UNSUPPORTED_CHANNEL", "channel must be one of line, x, instagram, or unknown", 400, meta);
  const direction = normalizeDirection(body.direction); if (!direction) return fail("UNSUPPORTED_DIRECTION", "direction must be inbound or outbound", 400, meta);

  const input = { workspaceId, channel, externalUserId, body: messageBody, direction, externalMessageId: body.externalMessageId, externalThreadId: body.externalThreadId, displayName: body.displayName, personId: body.personId, conversationId: body.conversationId, topics: body.topics, promises: body.promises, nextActions: body.nextActions };
  const readiness = getPersistenceReadiness();
  if (readiness.driver === "d1") {
    if (channel === "unknown") return fail("UNSUPPORTED_CHANNEL", "unknown channel cannot be persisted to D1", 400, meta);
    try {
      const db = getCloudflareContext().env.DB as unknown as D1DatabaseLike;
      const result = await new D1CommunicationRepository(db).ingestChannelMessage({ ...input, channel });
      return ok({ ...result, persistenceDriver: "d1", message: { direction } }, { ...meta, eventName: direction === "outbound" ? "communication.message.sent.v1" : "communication.message.received.v1" });
    } catch {
      return fail("PERSISTENCE_ERROR", "Channel message could not be persisted", 503, meta);
    }
  }

  const result = ingestChannelMessage(input);
  return ok({ ...result, persistenceDriver: readiness.driver }, { ...meta, eventName: result.message.direction === "outbound" ? "communication.message.sent.v1" : "communication.message.received.v1" });
}
