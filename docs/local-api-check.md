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

## Adapter Webhooks

LINE:

```bash
curl -X POST http://localhost:3000/api/adapters/line/webhook \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","events":[{"eventId":"line_event_1","source":{"userId":"line_user_1"},"message":{"id":"line_message_1","text":"Hello from LINE"}}]}'
```

X:

```bash
curl -X POST http://localhost:3000/api/adapters/x/webhook \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","messages":[{"messageId":"x_message_1","sender":{"id":"x_user_1","username":"x_demo"},"conversationId":"x_thread_1","text":"Hello from X"}]}'
```

Instagram:

```bash
curl -X POST http://localhost:3000/api/adapters/instagram/webhook \
  -H 'Content-Type: application/json' \
  -d '{"workspaceId":"ws_demo","entries":[{"id":"ig_event_1","sender":{"id":"ig_user_1","username":"ig_demo"},"thread":{"id":"ig_thread_1"},"message":{"id":"ig_message_1","text":"Hello from Instagram"}}]}'
```

Each adapter webhook should emit `communication.message.received.v1`.

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
