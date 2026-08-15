import { endpointContracts } from "@/lib/contracts";
import { ok } from "@/lib/http";

export function GET() {
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
    sourceOfTruth: [
      "Unified Inbox",
      "Communication Person projection",
      "ChannelIdentity",
      "Conversation",
      "Message",
      "ConversationContext",
      "ReplyDraft",
      "SafetyCheck",
      "ChannelAdapter integration state"
    ],
    stableEvents: [
      "communication.message.received.v1",
      "communication.message.sent.v1",
      "communication.context.updated.v1",
      "communication.promise.created.v1",
      "communication.next_action.created.v1",
      "communication.reply_draft.created.v1",
      "communication.reply_safety.checked.v1",
      "communication.person_channel.linked.v1"
    ],
    issues: []
  });
}
