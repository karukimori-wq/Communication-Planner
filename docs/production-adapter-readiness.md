# Production Adapter Readiness

Communication Planner currently keeps provider sends in `dry_run` unless all live-send gates are explicitly configured.

## Endpoint

`GET /api/adapters/readiness`

The endpoint returns per-channel readiness without exposing secret values.

## Live Send Gate

Live provider delivery requires:

- `COMMUNICATION_PLANNER_PROVIDER_DELIVERY_MODE=live`
- provider credentials for the target channel
- `COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION=enabled`
- `COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY=enabled`
- `COMMUNICATION_PLANNER_PROVIDER_ERROR_MAPPING=enabled`
- provider request/response behavior covered by executable tests

If any requirement is missing, the effective delivery mode remains `dry_run`.

## Webhook Signature Verification

Provider webhooks use raw request body verification before payload normalization.

| Channel | Accepted signature headers | Secret source |
| --- | --- | --- |
| LINE | `x-line-signature` | `LINE_CHANNEL_SECRET` |
| X | `x-twitter-webhooks-signature`, `x-x-signature`, `x-hub-signature-256` | `X_WEBHOOK_SIGNING_SECRET` or `X_API_SECRET` |
| Instagram | `x-hub-signature-256` | `INSTAGRAM_APP_SECRET` |

When `COMMUNICATION_PLANNER_WEBHOOK_SIGNATURE_VERIFICATION=enabled`, missing or invalid signatures are rejected before a Message, Conversation, or ChannelIdentity can be created.

## Provider Rate Limit Policy

Provider sends pass through an in-memory policy before adapter delivery:

- `COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_POLICY=enabled`
- `COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_WINDOW_MS`, default `60000`
- `COMMUNICATION_PLANNER_PROVIDER_RATE_LIMIT_MAX`, default `60`

The limit key is `workspaceId + channel + externalUserId`, so one person's provider traffic cannot block a different person or channel.

## Channel Credentials

| Channel | Required env vars | OSS reference |
| --- | --- | --- |
| LINE | `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET` | `Shudesu/line-harness-oss` |
| X | `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` | `Shudesu/x-harness-oss` |
| Instagram | `INSTAGRAM_PAGE_ACCESS_TOKEN`, `INSTAGRAM_APP_SECRET` | `Shudesu/ig-harness-oss` |

## Production Rollout Status

Deployment readiness was checked on 2026-08-18.

| Step | Status | Notes |
| --- | --- | --- |
| GitHub main source sync | Done | Latest synced commit: `a38d081f800cb77c8376e40929423f7bfc480e2c` |
| Local production build | Done | `npm run build` completed successfully |
| Vercel project discovery | Blocked | No existing `communication-planner` project was found in the connected Vercel team |
| Vercel production deploy | Blocked | Vercel CLI is logged out and the connector deploy call returned `INVALID_ARGUMENT` without a linked project |
| Production runtime URL | Blocked | Cannot be finalized until a Vercel project or approved hosting target exists |
| Production env vars | Blocked | Provider credentials and secrets must be supplied outside source control |
| Platform Admin runtime URL registration | Blocked | Requires the finalized Communication Planner production URL |
| LINE/X/Instagram live E2E verification | Blocked | Requires provider credentials, webhook URLs, and real provider callback configuration |

Until those blockers are cleared, provider delivery must remain `dry_run`.

Operational follow-up is documented in:

- `docs/production-deployment-runbook.md`
- `docs/platform-admin-registration.md`
- `.env.example`

## Provider Error Mapping

Provider adapters must map provider failures into stable Communication Planner outcomes before live delivery is enabled:

| Provider condition | Communication Planner outcome |
| --- | --- |
| Authentication failure | `ADAPTER_AUTH_FAILED` |
| Signature verification failure | `ADAPTER_SIGNATURE_INVALID` |
| Rate limit or temporary provider throttle | `ADAPTER_RATE_LIMITED` |
| Duplicate idempotency key | Reuse the existing provider result when available |
| Provider send rejection | `ADAPTER_SEND_REJECTED` |

The API send route returns the mapped HTTP status and retryability instead of exposing provider-specific error payloads.

## Adoption Decision

No Harness source code is copied into Communication Planner at this stage.

The repositories are used as implementation references for provider-specific SDK, webhook, identity, and operations patterns. Communication Planner keeps final send authorization, wrong-person prevention, and reply audit records inside its own core.
