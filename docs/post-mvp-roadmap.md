# Communication Planner post-MVP roadmap

MVP production safety gate is complete. The next phase is controlled real-provider operation.

## Phase A — provider readiness

1. Keep `COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE=dry_run` by default.
2. Configure credentials independently for LINE, X, and Instagram; never expose values through APIs or logs.
3. Require webhook signature verification, provider rate-limit policy, and provider error mapping before any channel can become live-send ready.
4. Use `/contracts/status` as the primary Platform Admin readiness surface, including `adapterReadinessSummary`.
5. Use `/api/adapters/readiness` for per-channel blocker drilldown without exposing secret values.
6. Enable live delivery channel-by-channel only after provider-specific inbound and outbound verification.

## Phase B — production operator UX

- D1 remains the source for Dashboard conversations, context, latest ReplyDraft, SafetyCheck state, and SendDecision history.
- Recipient, conversation context, and original channel remain visible before send.
- Changing recipient or draft invalidates UI confirmation state.
- API/D1 gates remain authoritative even if the UI is bypassed.

## Phase C — AI assistance

AI reply generation may be added only after the provider boundary is stable. Reply generation must require workspaceId, personId, and conversationId and retrieve context only for the same workspaceId + personId. Generated text remains a ReplyDraft and cannot bypass SafetyCheck.

## Release gates

A provider may be enabled for live send only when:

- its credentials are configured;
- its webhook signature secret is configured;
- signature verification is enabled;
- provider rate limiting is enabled;
- provider error mapping is enabled;
- provider-specific inbound and outbound verification are enabled;
- Production E2E remains green;
- wrong-person, wrong-channel, stale-check, and duplicate-send guards remain green.
