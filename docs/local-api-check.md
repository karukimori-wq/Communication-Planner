# Local API Check

Start the development server:

```bash
npm run dev
```

## Health

```bash
curl http://localhost:3000/health
```

Expected:

- `status` is `success`
- `data.status` is `success`

## Version

```bash
curl http://localhost:3000/version
```

## Contract Status

```bash
curl http://localhost:3000/contracts/status
```

## Endpoint Contracts

```bash
curl http://localhost:3000/api/contracts/endpoints
```

Expected:

- `data.implementedCount` is present
- `data.endpoints` includes every MVP endpoint

## Ingest Message

```bash
curl -X POST http://localhost:3000/api/channel-events/messages \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","channel":"line","externalUserId":"line_user_1","displayName":"Demo User","body":"Hello"}'
```

Expected:

- Person is created or linked.
- Conversation is created or reused.
- Message is stored.
- Context is updated.
- `eventName` is `communication.message.received.v1`.

## Inbox

```bash
curl 'http://localhost:3000/api/inbox?workspaceId=ws_demo'
```

## Person Context

```bash
curl 'http://localhost:3000/api/persons/{personId}/context?workspaceId=ws_demo'
```

## Reply Draft

```bash
curl -X POST http://localhost:3000/api/conversations/{conversationId}/reply-drafts \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","personId":"{personId}","purpose":"follow up"}'
```

## Safety Check

```bash
curl -X POST http://localhost:3000/api/reply-drafts/{replyDraftId}/safety-check \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","personId":"{personId}","conversationId":"{conversationId}"}'
```

## Send

```bash
curl -X POST http://localhost:3000/api/reply-drafts/{replyDraftId}/send \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","personId":"{personId}","conversationId":"{conversationId}"}'
```

Expected behavior:

- Missing `personId` in reply draft creation fails.
- Missing `conversationId` path fails because the route cannot be resolved.
- Mismatched `personId` and `conversationId` fails with `CONVERSATION_SCOPE_MISMATCH`.
- Send before SafetyCheck fails with `SAFETY_CHECK_REQUIRED`.
- Failed SafetyCheck blocks send.
- Missing send confirmation scope fails with `SEND_CONFIRMATION_REQUIRED`.
- Mismatched send confirmation scope fails with `SEND_SCOPE_MISMATCH`.
- Passed fresh SafetyCheck allows send.
