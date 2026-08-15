# Adapter Webhook Examples

These examples define the MVP request contract for harness-compatible LINE, X, and Instagram webhook ingestion.

Each endpoint must return the common API response envelope and emit:

- `communication.message.received.v1`

Each endpoint must reject malformed provider payloads with one of:

- `INVALID_JSON`
- `INVALID_WEBHOOK_PAYLOAD`
- `MISSING_WORKSPACE_ID`
- `MISSING_EXTERNAL_USER_ID`
- `MISSING_MESSAGE_BODY`
- `UNSUPPORTED_CHANNEL`

## LINE

Endpoint:

```text
POST /api/adapters/line/webhook
```

Request:

```json
{
  "workspaceId": "ws_demo",
  "events": [
    {
      "eventId": "line_event_1",
      "source": {
        "userId": "line_user_1"
      },
      "message": {
        "id": "line_message_1",
        "text": "Hello from LINE"
      }
    }
  ]
}
```

Expected normalized fields:

```json
{
  "channel": "line",
  "workspaceId": "ws_demo",
  "externalUserId": "line_user_1",
  "externalMessageId": "line_event_1",
  "body": "Hello from LINE"
}
```

## X

Endpoint:

```text
POST /api/adapters/x/webhook
```

Request:

```json
{
  "workspaceId": "ws_demo",
  "messages": [
    {
      "messageId": "x_message_1",
      "sender": {
        "id": "x_user_1",
        "username": "x_demo"
      },
      "conversationId": "x_thread_1",
      "text": "Hello from X"
    }
  ]
}
```

Expected normalized fields:

```json
{
  "channel": "x",
  "workspaceId": "ws_demo",
  "externalUserId": "x_user_1",
  "externalMessageId": "x_message_1",
  "externalThreadId": "x_thread_1",
  "displayName": "x_demo",
  "body": "Hello from X"
}
```

## Instagram

Endpoint:

```text
POST /api/adapters/instagram/webhook
```

Request:

```json
{
  "workspaceId": "ws_demo",
  "entries": [
    {
      "id": "ig_event_1",
      "sender": {
        "id": "ig_user_1",
        "username": "ig_demo"
      },
      "thread": {
        "id": "ig_thread_1"
      },
      "message": {
        "id": "ig_message_1",
        "text": "Hello from Instagram"
      }
    }
  ]
}
```

Expected normalized fields:

```json
{
  "channel": "instagram",
  "workspaceId": "ws_demo",
  "externalUserId": "ig_user_1",
  "externalMessageId": "ig_event_1",
  "externalThreadId": "ig_thread_1",
  "displayName": "ig_demo",
  "body": "Hello from Instagram"
}
```

## Boundary Rules

- Webhook endpoints store inbound messages only.
- Provider payloads are normalized before core ingestion.
- Raw provider payloads are not part of reply generation context.
- Outbound provider delivery remains behind the ReplyDraft SafetyCheck gate.
