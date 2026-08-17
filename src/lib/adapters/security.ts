import { createHmac, timingSafeEqual } from "node:crypto";
import type { Channel } from "@/lib/types";

type VerificationResult =
  | {
      ok: true;
      enforced: boolean;
      signatureHeader: string;
    }
  | {
      ok: false;
      code: "ADAPTER_SIGNATURE_MISSING" | "ADAPTER_SIGNATURE_INVALID" | "ADAPTER_SIGNATURE_NOT_CONFIGURED";
      message: string;
      retryable: false;
    };

const signatureHeaderNames: Record<Exclude<Channel, "unknown">, string[]> = {
  line: ["x-line-signature"],
  x: ["x-twitter-webhooks-signature", "x-x-signature", "x-hub-signature-256"],
  instagram: ["x-hub-signature-256"]
};

const secretKeys: Record<Exclude<Channel, "unknown">, string[]> = {
  line: ["LINE_CHANNEL_SECRET"],
  x: ["X_WEBHOOK_SIGNING_SECRET", "X_API_SECRET"],
  instagram: ["INSTAGRAM_APP_SECRET"]
};

function configured(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getWebhookSignatureSecretStatus(channel: Exclude<Channel, "unknown">) {
  return secretKeys[channel].map((key) => ({
    key,
    configured: configured(process.env[key])
  }));
}

function getFirstConfiguredSecret(channel: Exclude<Channel, "unknown">) {
  for (const key of secretKeys[channel]) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function getSignatureHeader(request: Request, channel: Exclude<Channel, "unknown">) {
  for (const header of signatureHeaderNames[channel]) {
    const value = request.headers.get(header);
    if (value) return { header, value };
  }
  return undefined;
}

function normalizeSignature(value: string) {
  return value.trim().replace(/^sha256=/, "");
}

function computeSignature(rawBody: string, secret: string, channel: Exclude<Channel, "unknown">) {
  const digest = createHmac("sha256", secret).update(rawBody).digest(channel === "line" ? "base64" : "hex");
  return digest;
}

function signatureEquals(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function verifyAdapterWebhookSignature(input: {
  channel: Exclude<Channel, "unknown">;
  request: Request;
  rawBody: string;
  enforce?: boolean;
}): VerificationResult {
  const enforce = input.enforce ?? process.env.COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION === "enabled";
  if (!enforce) {
    return { ok: true, enforced: false, signatureHeader: "not-enforced" };
  }

  const secret = getFirstConfiguredSecret(input.channel);
  if (!secret) {
    return {
      ok: false,
      code: "ADAPTER_SIGNATURE_NOT_CONFIGURED",
      message: `${input.channel} webhook signature secret is not configured`,
      retryable: false
    };
  }

  const signature = getSignatureHeader(input.request, input.channel);
  if (!signature) {
    return {
      ok: false,
      code: "ADAPTER_SIGNATURE_MISSING",
      message: `${input.channel} webhook signature header is required`,
      retryable: false
    };
  }

  const expected = computeSignature(input.rawBody, secret, input.channel);
  const actual = normalizeSignature(signature.value);
  if (!signatureEquals(actual, expected)) {
    return {
      ok: false,
      code: "ADAPTER_SIGNATURE_INVALID",
      message: `${input.channel} webhook signature is invalid`,
      retryable: false
    };
  }

  return { ok: true, enforced: true, signatureHeader: signature.header };
}
