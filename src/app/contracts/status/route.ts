import { endpointContracts } from "@/lib/contracts";
import { ok } from "@/lib/http";
import { getAllProviderSendReadiness } from "@/lib/adapters/readiness";

export function GET() {
  const adapterReadiness = getAllProviderSendReadiness();

  return ok({
    appName: "communication-planner",
    status: "success",
    contractVersion: "2026-08-15",
    identityMode: "workspace_user",
    professionalIdRequired: false,
    usesLegacyEventNames: false,
    usesReportTerminology: false,
    canonicalOwnershipChecked: true,
    endpointContractCount: endpointContracts.length,
    implementedEndpointCount: endpointContracts.filter((endpoint) => endpoint.status === "implemented").length,
    endpointContractsPath: "/api/contracts/endpoints",
    readinessChecks: {
      sendDecisionChannelAudit: true,
      adapterWebhookRawPayloadExcluded: true,
      sendRequiresChannelConfirmation: true,
      adapterWebhookSignatureVerification: adapterReadiness.every((adapter) =>
        adapter.operationalRequirements.some(
          (requirement) => requirement.key === "COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION" && requirement.met
        )
      ),
      adapterRateLimitPolicy: adapterReadiness.every((adapter) =>
        adapter.operationalRequirements.some((requirement) => requirement.key === "COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY" && requirement.met)
      ),
      adapterErrorMapping: adapterReadiness.every((adapter) =>
        adapter.operationalRequirements.some((requirement) => requirement.key === "COMMUNICATION_PLANNER_PROVIDER_ERROR_MAPPING" && requirement.met)
      ),
      providerLiveSendReady: adapterReadiness.every((adapter) => adapter.liveSendReady)
    },
    adapterReadinessPath: "/api/adapters/readiness",
    sourceOfTruth: [
      "Unified Inbox",
      "Communication Person projection",
      "ChannelIdentity",
      "Conversation",
      "Message",
      "ConversationContext",
      "ReplyDraft",
      "SafetyCheck",
      "ReplySendDecision",
      "ChannelAdapter integration state"
    ],
    stableEvents: [
      "communication.message.received.v1",
      "communication.message.sent.v1",
      "communication.context.updated.v1",
      "communication.promise.created.v1",
      "communication.next_action.created.v1",
      "communication.reply_draft.created.v1",
      "communication.reply_draft.updated.v1",
      "communication.reply_safety.checked.v1",
      "communication.person_channel.linked.v1"
    ],
    issues: []
  });
}
