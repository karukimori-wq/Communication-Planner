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
| Add OSS adoption strategy | Done |
| Add Harness channel adapter strategy | Done |
| Review Chatwoot unified inbox and conversation patterns | Todo |
| Review LINE Harness adapter architecture | Todo |
| Review X Harness adapter architecture | Todo |
| Review IG Harness adapter architecture | Todo |
| Define adapter event mapping for LINE/X/Instagram | Todo |
| Add LINE adapter stub | Todo |
| Add X adapter stub | Todo |
| Add Instagram adapter stub | Todo |
| Choose application stack | Todo |
| Implement `/health` | Todo |
| Implement `/version` | Todo |
| Implement `/contracts/status` | Todo |
| Implement reply draft validation requiring `personId` and `conversationId` | Todo |
| Implement SafetyCheck before send gate | Todo |

## Suggested Implementation Order

1. Review OSS references and record what will be reused as architecture, package, or code.
2. Review Harness adapter repositories and define canonical event mappings.
3. Add app scaffold.
4. Add contract/status endpoints.
5. Add in-memory or local persistence model for MVP.
6. Add channel event ingestion.
7. Add LINE/X/Instagram adapter stubs.
8. Add person-scoped inbox and context reads.
9. Add reply draft creation.
10. Add safety check.
11. Add send gate.

## OSS Review Targets

| OSS | Target Use |
| --- | --- |
| Chatwoot | Unified inbox, conversation list, assignment and unread-state patterns |
| LINE Harness | LINE webhook, identity mapping, message send/receive adapter reference |
| X Harness | X DM/reply adapter reference |
| IG Harness | Instagram DM adapter reference |

## Acceptance Criteria

- `/contracts/status` returns `status: "success"` when ownership and event rules are aligned.
- Reply draft creation rejects missing `personId`.
- Reply draft creation rejects missing `conversationId`.
- Context retrieval cannot cross person boundaries.
- Send rejects unchecked drafts.
- Send rejects stale or failed checks.
- Any copied OSS code has a recorded license and ownership review.
- Any OSS-inspired adapter emits Communication Planner stable events.
- LINE/X/Instagram adapter stubs cannot send without SafetyCheck authorization.
