# Local API Check

After installing dependencies, run:

```bash
npm run dev
```

## Contract Endpoints

```bash
curl http://localhost:3000/health
curl http://localhost:3000/version
curl http://localhost:3000/contracts/status
```

## Message Ingestion

```bash
curl -X POST http://localhost:3000/api/channel-events/messages \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","channel":"line","externalUserId":"line_user_1","displayName":"Demo User","body":"Hello"}'
```

Save the returned `personId` and `conversationId`.

## Inbox

```bash
curl 'http://localhost:3000/api/inbox?workspaceId=ws_demo'
```

## Reply Draft

This must include `personId` and `conversationId`.

```bash
curl -X POST http://localhost:3000/api/conversations/{conversationId}/reply-drafts \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","personId":"{personId}","purpose":"reply_to_customer"}'
```

## Safety Check

```bash
curl -X POST http://localhost:3000/api/reply-drafts/{replyDraftId}/safety-check \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","personId":"{personId}","conversationId":"{conversationId}"}'
```

## Send

```bash
curl -X POST http://localhost:3000/api/reply-drafts/{replyDraftId}/send
```

Expected behavior:

- Missing `personId` in reply draft creation fails.
- Missing `conversationId` path fails because the route cannot be resolved.
- Mismatched `personId` and `conversationId` fails with `CONVERSATION_SCOPE_MISMATCH`.
- Send before SafetyCheck fails with `SAFETY_CHECK_REQUIRED`.
- Failed SafetyCheck blocks send.
- Passed fresh SafetyCheck allows send.
