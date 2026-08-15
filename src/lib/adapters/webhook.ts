import { getAdapter } from "@/lib/adapters";
import type { ProviderInboundEvent } from "@/lib/adapters/types";
import type { Channel } from "@/lib/types";

type JsonObject = Record<string, unknown>;

export type AdapterWebhookResult =
  | {
      ok: true;
      event: ProviderInboundEvent;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringAt(source: JsonObject, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return undefined;
}

function nestedObjectAt(source: JsonObject, keys: string[]): JsonObject | undefined {
  for (const key of keys) {
    const value = source[key];
    if (isObject(value)) return value;
  }
  return undefined;
}

function firstObjectAt(source: JsonObject, keys: string[]): JsonObject | undefined {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value) && isObject(value[0])) return value[0];
  }
  return undefined;
}

function resolveProviderBody(payload: JsonObject, message?: JsonObject): string | undefined {
  return (
    stringAt(payload, ["body", "text", "messageText", "content"]) ??
    (message ? stringAt(message, ["body", "text", "messageText", "content"]) : undefined)
  );
}

function resolveExternalUserId(payload: JsonObject, source?: JsonObject, sender?: JsonObject): string | undefined {
  return (
    stringAt(payload, ["externalUserId", "userId", "senderId", "fromUserId", "recipientId"]) ??
    (sender ? stringAt(sender, ["id", "userId", "externalUserId"]) : undefined) ??
    (source ? stringAt(source, ["userId", "externalUserId", "id"]) : undefined)
  );
}

export function normalizeAdapterWebhookPayload(channel: Exclude<Channel, "unknown">, payload: unknown): AdapterWebhookResult {
  if (!isObject(payload)) {
    return {
      ok: false,
      code: "INVALID_WEBHOOK_PAYLOAD",
      message: "Adapter webhook body must be a JSON object"
    };
  }

  const workspaceId = stringAt(payload, ["workspaceId", "tenantId", "teamId"]);
  if (!workspaceId) {
    return {
      ok: false,
      code: "MISSING_WORKSPACE_ID",
      message: "workspaceId is required"
    };
  }

  const event = firstObjectAt(payload, ["events", "messages", "entries"]) ?? payload;
  const message = nestedObjectAt(event, ["message", "directMessage", "dm"]);
  const source = nestedObjectAt(event, ["source", "conversation", "thread"]);
  const sender = nestedObjectAt(event, ["sender", "from", "user"]);
  const body = resolveProviderBody(event, message);
  const externalUserId = resolveExternalUserId(event, source, sender);

  if (!externalUserId) {
    return {
      ok: false,
      code: "MISSING_EXTERNAL_USER_ID",
      message: "externalUserId or provider user id is required"
    };
  }

  if (!body) {
    return {
      ok: false,
      code: "MISSING_MESSAGE_BODY",
      message: "body or provider text message is required"
    };
  }

  const providerEventId =
    stringAt(event, ["providerEventId", "eventId", "messageId", "id"]) ??
    (message ? stringAt(message, ["id", "messageId"]) : undefined);
  const externalThreadId =
    stringAt(event, ["externalThreadId", "threadId", "conversationId", "roomId", "chatId"]) ??
    (source ? stringAt(source, ["id", "threadId", "conversationId", "roomId", "chatId"]) : undefined);
  const displayName =
    stringAt(event, ["displayName", "senderName", "username", "name"]) ??
    (sender ? stringAt(sender, ["displayName", "username", "name"]) : undefined);

  const adapter = getAdapter(channel);
  if (!adapter) {
    return {
      ok: false,
      code: "UNSUPPORTED_CHANNEL",
      message: `Unsupported channel: ${channel}`
    };
  }

  return {
    ok: true,
    event: {
      workspaceId,
      providerEventId,
      externalUserId,
      externalThreadId,
      displayName,
      body,
      raw: payload
    }
  };
}
