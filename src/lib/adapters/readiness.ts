import type { Channel } from "@/lib/types";

type ProviderReadinessRequirement = {
  key: string;
  description: string;
  met: boolean;
};

export type ProviderReadiness = {
  channel: Exclude<Channel, "unknown">;
  requestedDeliveryMode: "dry_run" | "live";
  effectiveDeliveryMode: "dry_run" | "live";
  liveSendReady: boolean;
  adapterReference: string;
  credentialRequirements: ProviderReadinessRequirement[];
  operationalRequirements: ProviderReadinessRequirement[];
  blockers: string[];
};

const adapterReferences: Record<ProviderReadiness["channel"], string> = {
  line: "Shudesu/line-harness-oss",
  x: "Shudesu/x-harness-oss",
  instagram: "Shudesu/ig-harness-oss"
};

const credentialKeys: Record<ProviderReadiness["channel"], string[]> = {
  line: ["LINE_CHANNEL_ACCESS_TOKEN", "LINE_CHANNEL_SECRET"],
  x: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"],
  instagram: ["INSTAGRAM_PAGE_ACCESS_TOKEN", "INSTAGRAM_APP_SECRET"]
};

const operationalKeys = [
  "COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION",
  "COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY",
  "COMMUNICATION_PLANNER_PROVIDER_ERROR_MAPPING"
];

function enabled(value: string | undefined) {
  return value === "enabled" || value === "true";
}

function configured(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getRequestedProviderDeliveryMode() {
  return process.env.COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE === "live" ? "live" : "dry_run";
}

export function getProviderSendReadiness(channel: ProviderReadiness["channel"]): ProviderReadiness {
  const requestedDeliveryMode = getRequestedProviderDeliveryMode();
  const credentialRequirements = credentialKeys[channel].map((key) => ({
    key,
    description: `${channel} provider credential must be configured`,
    met: configured(process.env[key])
  }));
  const operationalRequirements = operationalKeys.map((key) => ({
    key,
    description: `${key} must be enabled before live provider send`,
    met: enabled(process.env[key])
  }));
  const blockers = [...credentialRequirements, ...operationalRequirements]
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.key);
  const liveSendReady = blockers.length === 0;

  return {
    channel,
    requestedDeliveryMode,
    effectiveDeliveryMode: requestedDeliveryMode === "live" && liveSendReady ? "live" : "dry_run",
    liveSendReady,
    adapterReference: adapterReferences[channel],
    credentialRequirements,
    operationalRequirements,
    blockers
  };
}

export function getAllProviderSendReadiness() {
  return (["line", "x", "instagram"] as const).map((channel) => getProviderSendReadiness(channel));
}
