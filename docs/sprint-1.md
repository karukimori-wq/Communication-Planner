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
| Choose application stack | Done |
| Add app scaffold | Done |
| Implement `/health` | Done |
| Implement `/version` | Done |
| Implement `/contracts/status` | Done |
| Add endpoint-level contract metadata API | Done |
| Add channel event ingestion | Done |
| Add person-scoped inbox and context reads | Done |
| Add LINE adapter stub | Done |
| Add X adapter stub | Done |
| Add Instagram adapter stub | Done |
| Implement reply draft validation requiring `personId` and `conversationId` | Done |
| Implement SafetyCheck before send gate | Done |
| Preserve original conversation channel on outbound send | Done |
| Add CORS and `OPTIONS` preflight support | Done |
| Add initial PostgreSQL schema | Done |
| Add dependency-free contract tests | Done |
| Add package lock and GitHub Actions CI | Done |
| Add LINE/X/Instagram harness-compatible webhook entry points | Done |
| Add operator dashboard UI shell | Done |
| Add visible person/context/reply draft panels | Done |
| Add UI send safety gate controls | Done |
| Add AI Platform Core task boundary display | Done |
| Add adapter operations status display | Done |
| Add dashboard UI contract tests and docs | Done |
| Add store-backed dashboard snapshot API | Done |
| Add deterministic demo workspace seed | Done |
| Add dashboard draft edit action | Done |
| Add dashboard SafetyCheck action | Done |
| Add dashboard send action | Done |
| Add API send readiness display | Done |
| Add dashboard pilot readiness docs | Done |
| Add dashboard action contract guards | Done |
| Review Chatwoot unified inbox and conversation patterns | Todo |
| Review Chatwoot unified inbox and conversation patterns | Done |
| Review LINE Harness adapter architecture | Done |
| Review X Harness adapter architecture | Done |
| Review IG Harness adapter architecture | Done |
| Define adapter event mapping for LINE/X/Instagram | Done |
| Review LINE Harness metadata and license gate | Done |
| Review X Harness metadata and license gate | Done |
| Review IG Harness metadata and license gate | Done |
| Add provider send request contract | Done |
| Add adapter dry-run send results | Done |
| Require ChannelIdentity before provider send | Done |
| Store adapter delivery evidence on sendDecision | Done |
| Add adapter send contract docs/tests | Done |
| Add provider production readiness endpoint | Done |
| Add live send fallback gate | Done |
| Add Harness OSS structure review decisions | Done |
| Add webhook signature verification | Done |
| Add provider rate-limit policy | Done |
| Add provider error mapping | Done |
| Add provider operation executable tests | Done |
| Sync docs/tests to GitHub main | Done |
| Verify local production build | Done |
| Create or link Vercel production project | Blocked |
| Configure production runtime env vars | Blocked |
| Register Communication Planner runtime URL in Platform Admin | Blocked |
| Verify LINE/X/Instagram live webhook/send E2E | Blocked |

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
12. Add CORS/preflight support for frontend and adapter callers.
13. Define production database schema.
14. Add contract tests for core safety rules.
15. Add CI for test/build verification on main.
16. Add endpoint-level metadata for Platform Admin and integration checks.
17. Add harness-compatible webhook entry points for LINE/X/Instagram.

## OSS Review Targets

| OSS | Target Use |
| --- | --- |
| Chatwoot | Unified inbox, conversation list, assignment and unread-state patterns |
| LINE Harness | LINE webhook, identity mapping, message send/receive adapter reference |
| X Harness | X DM/reply adapter reference |
| IG Harness | Instagram DM adapter reference |

## Acceptance Criteria

- `/contracts/status` returns `status: "success"` when ownership and event rules are aligned.
- `/api/contracts/endpoints` returns endpoint metadata for Platform Admin and integration checks.
- Reply draft creation rejects missing `personId`.
- Reply draft creation rejects missing `conversationId`.
- Context retrieval cannot cross person boundaries.
- Send rejects unchecked drafts.
- Send rejects stale or failed checks.
- Outbound send uses the original conversation channel.
- API responses include CORS headers.
- Preflight `OPTIONS` requests return `204` on API and contract routes.
- Initial database schema preserves Communication Planner ownership boundaries.
- Contract tests cover ownership, conversation scoping, SafetyCheck gating, outbound channel preservation, endpoint metadata, and CORS/preflight guards.
- GitHub Actions runs install, test, and build verification.
- LINE/X/Instagram webhook entry points normalize provider payloads into inbound Communication Planner messages.
- Any copied OSS code has a recorded license and ownership review.
- Any OSS-inspired adapter emits Communication Planner stable events.
- LINE/X/Instagram adapter stubs cannot send without SafetyCheck authorization.
- Production deployment is not considered ready until a hosted runtime URL is finalized and `/health`, `/version`, `/contracts/status`, and `/api/adapters/readiness` pass against that URL.
- Live provider delivery remains disabled until provider credentials, webhook signature verification, rate-limit policy, and provider error mapping are configured in production.
