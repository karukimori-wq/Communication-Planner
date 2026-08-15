create table if not exists communication_persons (
  id text primary key,
  workspace_id text not null,
  display_name text not null,
  profile_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_communication_persons_workspace
  on communication_persons (workspace_id);

create table if not exists channel_identities (
  id text primary key,
  workspace_id text not null,
  person_id text not null references communication_persons(id) on delete cascade,
  channel text not null check (channel in ('line', 'x', 'instagram')),
  channel_user_id text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, channel, channel_user_id)
);

create index if not exists idx_channel_identities_person
  on channel_identities (workspace_id, person_id);

create table if not exists conversations (
  id text primary key,
  workspace_id text not null,
  person_id text not null references communication_persons(id) on delete cascade,
  channel_identity_id text not null references channel_identities(id) on delete restrict,
  channel text not null check (channel in ('line', 'x', 'instagram')),
  external_thread_id text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, channel, external_thread_id)
);

create index if not exists idx_conversations_inbox
  on conversations (workspace_id, status, last_message_at desc);

create index if not exists idx_conversations_person
  on conversations (workspace_id, person_id, last_message_at desc);

create table if not exists messages (
  id text primary key,
  workspace_id text not null,
  person_id text not null references communication_persons(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  channel text not null check (channel in ('line', 'x', 'instagram')),
  external_message_id text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, channel, external_message_id)
);

create index if not exists idx_messages_conversation
  on messages (workspace_id, conversation_id, received_at desc);

create table if not exists conversation_contexts (
  id text primary key,
  workspace_id text not null,
  person_id text not null references communication_persons(id) on delete cascade,
  summary text not null,
  promises jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (workspace_id, person_id)
);

create table if not exists reply_drafts (
  id text primary key,
  workspace_id text not null,
  person_id text not null references communication_persons(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  content text not null,
  content_hash text not null,
  status text not null default 'draft' check (status in ('draft', 'checked', 'sent', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reply_drafts_conversation
  on reply_drafts (workspace_id, conversation_id, created_at desc);

create table if not exists safety_checks (
  id text primary key,
  workspace_id text not null,
  reply_draft_id text not null references reply_drafts(id) on delete cascade,
  checked_content_hash text not null,
  result text not null check (result in ('passed', 'failed')),
  reasons jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now()
);

create index if not exists idx_safety_checks_latest
  on safety_checks (workspace_id, reply_draft_id, checked_at desc);

create table if not exists channel_adapter_states (
  id text primary key,
  workspace_id text not null,
  channel text not null check (channel in ('line', 'x', 'instagram')),
  adapter_name text not null,
  state jsonb not null default '{}'::jsonb,
  last_seen_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, channel, adapter_name)
);
