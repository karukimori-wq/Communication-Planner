# Sprint 1

## Goal

Initialize Communication Planner as a contract-aligned MVP project and prepare implementation of the safest possible 1-to-1 reply workflow.

## Scope

| Task | Status |
| --- | --- |
| Initialize repository README | Done |
| Add product brief | Done |
| Add domain model | Done |
| Add API design | Done |
| Add stable event list | Done |
| Add safety rules | Done |
| Choose application stack | Todo |
| Implement `/health` | Todo |
| Implement `/version` | Todo |
| Implement `/contracts/status` | Todo |
| Implement reply draft validation requiring `personId` and `conversationId` | Todo |
| Implement SafetyCheck before send gate | Todo |

## Suggested Implementation Order

1. Add app scaffold.
2. Add contract/status endpoints.
3. Add in-memory or local persistence model for MVP.
4. Add channel event ingestion.
5. Add person-scoped inbox and context reads.
6. Add reply draft creation.
7. Add safety check.
8. Add send gate.

## Acceptance Criteria

- `/contracts/status` returns `status: "success"` when ownership and event rules are aligned.
- Reply draft creation rejects missing `personId`.
- Reply draft creation rejects missing `conversationId`.
- Context retrieval cannot cross person boundaries.
- Send rejects unchecked drafts.
- Send rejects stale or failed checks.
