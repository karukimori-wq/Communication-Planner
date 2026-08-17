import type { Channel } from "@/lib/types";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | {
      ok: true;
      limit: number;
      remaining: number;
      resetAt: string;
    }
  | {
      ok: false;
      code: "ADAPTER_RATE_LIMITED";
      message: string;
      retryable: true;
      limit: number;
      remaining: 0;
      resetAt: string;
    };

const globalRateLimitState = globalThis as typeof globalThis & {
  communicationPlannerProviderRateLimit?: Map<string, RateLimitBucket>;
};

const buckets = globalRateLimitState.communicationPlannerProviderRateLimit ?? (globalRateLimitState.communicationPlannerProviderRateLimit = new Map());

function numericEnv(key: string, fallback: number) {
  const value = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getProviderRateLimitPolicy() {
  return {
    enabled: process.env.COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY === "enabled",
    windowMs: numericEnv("COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_WINDOW_MS", 60_000),
    maxRequests: numericEnv("COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_MAX", 60)
  };
}

export function resetProviderRateLimitForTests() {
  buckets.clear();
}

export function checkProviderRateLimit(input: {
  workspaceId: string;
  channel: Exclude<Channel, "unknown">;
  externalUserId: string;
  nowMs?: number;
}): RateLimitResult {
  const policy = getProviderRateLimitPolicy();
  const nowMs = input.nowMs ?? Date.now();
  const key = `${input.workspaceId}:${input.channel}:${input.externalUserId}`;
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > nowMs ? existing : { count: 0, resetAt: nowMs + policy.windowMs };

  if (!policy.enabled) {
    buckets.set(key, bucket);
    return {
      ok: true,
      limit: policy.maxRequests,
      remaining: policy.maxRequests,
      resetAt: new Date(bucket.resetAt).toISOString()
    };
  }

  if (bucket.count >= policy.maxRequests) {
    buckets.set(key, bucket);
    return {
      ok: false,
      code: "ADAPTER_RATE_LIMITED",
      message: `Provider send rate limit exceeded for ${input.channel}`,
      retryable: true,
      limit: policy.maxRequests,
      remaining: 0,
      resetAt: new Date(bucket.resetAt).toISOString()
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    ok: true,
    limit: policy.maxRequests,
    remaining: Math.max(policy.maxRequests - bucket.count, 0),
    resetAt: new Date(bucket.resetAt).toISOString()
  };
}
