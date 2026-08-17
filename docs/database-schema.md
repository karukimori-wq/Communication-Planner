# Database Schema

This schema defines Communication Planner persistence boundaries for the MVP and the first production database migration.

The database stores only 1-to-1 communication operation data. It does not store Customer master, Lead lifecycle, Reservation, Payment, Sales/Revenue, SNS PostDraft, Numeria Report, Velvet Memory, or AI Usage as owned records.

## Tables

| Table | Purpose |
| --- | --- |
| `communication_persons` | Person projection used only inside Communication Planner |
| `channel_identities` | Mapping between a Communication Person and a channel identity |
| `conversations` | Person-scoped channel conversation threads |
| `messages` | Inbound and outbound messages normalized from adapters |
| `conversation_contexts` | Person-scoped context allowed for reply drafting |
| `topics` | Person-scoped topics extracted or supplied from messages |
| `promises` | Person-scoped commitments extracted or supplied from messages |
| `communication_next_actions` | Person-scoped follow-up actions extracted or supplied from messages |
| `reply_drafts` | Draft replies tied to one person and one conversation |
| `safety_checks` | Safety result for a specific draft content hash |
| `reply_send_decisions` | Reply-draft-scoped audit history for successful send gates, including confirmed channel and adapter delivery evidence |
| `channel_adapter_states` | Integration cursors, webhook state, and channel health |

## Ownership Rules

- Every core table includes `workspace_id`.
- Person-scoped reads must include `workspace_id + person_id`.
- Conversation reads must validate that `conversation.person_id` matches the requested person.
- Topic, Promise, and Communication NextAction rows must keep `workspace_id + person_id + conversation_id + source_message_id`.
- A reply draft must include both `person_id` and `conversation_id`.
- A send operation must require a passing `safety_checks` row with the same `reply_draft_id` and `checked_content_hash`.
- A send decision must keep `workspace_id + person_id + conversation_id + reply_draft_id + safety_check_id + message_id + channel + adapter_delivery`.
- Send decision channel audit uses `workspace_id + conversation_id + channel + decided_at`.
- `channel_adapter_states` is integration state only and cannot override canonical Communication Planner records.

## Migration

The initial SQL is stored in [db/schema.sql](../db/schema.sql).

The DDL is written for PostgreSQL-compatible databases and keeps platform identifiers as text to avoid coupling the MVP to a specific identity provider or external system.
