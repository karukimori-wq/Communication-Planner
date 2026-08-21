export type D1RunResult = { success: boolean; meta?: unknown };
export type D1PreparedStatement = { bind(...values: unknown[]): D1PreparedStatement; first<T = Record<string, unknown>>(): Promise<T | null>; run(): Promise<D1RunResult>; all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> };
export type D1DatabaseLike = { prepare(query: string): D1PreparedStatement; batch(statements: D1PreparedStatement[]): Promise<D1RunResult[]> };
type Scope = { workspaceId: string; personId: string; conversationId: string };
type PersistedChannel = "line" | "x" | "instagram";

export type D1ChannelMessageInput = {
  workspaceId: string;
  channel: PersistedChannel;
  externalUserId: string;
  body: string;
  direction: "inbound" | "outbound";
  externalMessageId?: string;
  externalThreadId?: string;
  displayName?: string;
  personId?: string;
  conversationId?: string;
  topics?: string[];
  promises?: string[];
  nextActions?: string[];
};

export class D1CommunicationRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async healthcheck() { const row = await this.db.prepare("SELECT 1 AS ok").first<{ ok: number }>(); return row?.ok === 1; }
  async getPersonScope(workspaceId: string, personId: string) { return this.db.prepare("SELECT id, workspace_id, display_name, profile_summary, created_at, updated_at FROM communication_persons WHERE workspace_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId).first(); }
  async getConversationScope(workspaceId: string, personId: string, conversationId: string) { return this.db.prepare("SELECT id, workspace_id, person_id, channel_identity_id, channel, external_thread_id, status, last_message_at, created_at, updated_at FROM conversations WHERE workspace_id = ? AND person_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId, conversationId).first<{ id: string; channel: PersistedChannel }>(); }
  async getPersonContext(workspaceId: string, personId: string) { return this.db.prepare("SELECT id, workspace_id, person_id, summary, promises_json, next_actions_json, updated_at FROM conversation_contexts WHERE workspace_id = ? AND person_id = ? LIMIT 1").bind(workspaceId, personId).first(); }

  async ingestChannelMessage(input: D1ChannelMessageInput) {
    const now = new Date().toISOString();
    const externalThreadId = input.externalThreadId ?? `${input.channel}:${input.externalUserId}`;
    if (input.externalMessageId) {
      const duplicate = await this.db.prepare("SELECT id, person_id, conversation_id, channel, direction, body, external_message_id, received_at, created_at FROM messages WHERE workspace_id = ? AND channel = ? AND external_message_id = ? LIMIT 1").bind(input.workspaceId, input.channel, input.externalMessageId).first<{ id: string; person_id: string; conversation_id: string }>();
      if (duplicate) return { duplicate: true, messageId: duplicate.id, personId: duplicate.person_id, conversationId: duplicate.conversation_id };
    }

    const existingIdentity = await this.db.prepare("SELECT id, person_id FROM channel_identities WHERE workspace_id = ? AND channel = ? AND channel_user_id = ? LIMIT 1").bind(input.workspaceId, input.channel, input.externalUserId).first<{ id: string; person_id: string }>();
    const personId = input.personId ?? existingIdentity?.person_id ?? crypto.randomUUID();
    const channelIdentityId = existingIdentity?.id ?? crypto.randomUUID();
    const conversationId = input.conversationId ?? crypto.randomUUID();
    const messageId = crypto.randomUUID();

    const statements: D1PreparedStatement[] = [];
    const existingPerson = await this.getPersonScope(input.workspaceId, personId);
    if (!existingPerson) {
      statements.push(this.db.prepare("INSERT INTO communication_persons (id, workspace_id, display_name, profile_summary, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)").bind(personId, input.workspaceId, input.displayName ?? input.externalUserId, now, now));
    } else {
      statements.push(this.db.prepare("UPDATE communication_persons SET display_name = COALESCE(?, display_name), updated_at = ? WHERE workspace_id = ? AND id = ?").bind(input.displayName ?? null, now, input.workspaceId, personId));
    }
    if (!existingIdentity) {
      statements.push(this.db.prepare("INSERT INTO channel_identities (id, workspace_id, person_id, channel, channel_user_id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(channelIdentityId, input.workspaceId, personId, input.channel, input.externalUserId, input.displayName ?? null, now, now));
    }

    let conversation = input.conversationId ? await this.getConversationScope(input.workspaceId, personId, input.conversationId) : null;
    if (!conversation) {
      conversation = await this.db.prepare("SELECT id, channel FROM conversations WHERE workspace_id = ? AND person_id = ? AND channel = ? AND external_thread_id = ? LIMIT 1").bind(input.workspaceId, personId, input.channel, externalThreadId).first<{ id: string; channel: PersistedChannel }>();
    }
    const resolvedConversationId = conversation?.id ?? conversationId;
    if (!conversation) {
      statements.push(this.db.prepare("INSERT INTO conversations (id, workspace_id, person_id, channel_identity_id, channel, external_thread_id, status, last_message_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)").bind(resolvedConversationId, input.workspaceId, personId, channelIdentityId, input.channel, externalThreadId, now, now, now));
    } else {
      statements.push(this.db.prepare("UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE workspace_id = ? AND person_id = ? AND id = ?").bind(now, now, input.workspaceId, personId, resolvedConversationId));
    }

    statements.push(this.db.prepare("INSERT INTO messages (id, workspace_id, person_id, conversation_id, channel, external_message_id, direction, body, received_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(messageId, input.workspaceId, personId, resolvedConversationId, input.channel, input.externalMessageId ?? messageId, input.direction, input.body, now, now));
    statements.push(this.db.prepare("INSERT INTO conversation_contexts (id, workspace_id, person_id, summary, promises_json, next_actions_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(workspace_id, person_id) DO UPDATE SET summary = excluded.summary, promises_json = excluded.promises_json, next_actions_json = excluded.next_actions_json, updated_at = excluded.updated_at").bind(crypto.randomUUID(), input.workspaceId, personId, input.body, JSON.stringify(input.promises ?? []), JSON.stringify(input.nextActions ?? []), now));
    for (const label of input.topics ?? []) statements.push(this.db.prepare("INSERT INTO topics (id, workspace_id, person_id, conversation_id, source_message_id, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), input.workspaceId, personId, resolvedConversationId, messageId, label, now));
    for (const body of input.promises ?? []) statements.push(this.db.prepare("INSERT INTO promises (id, workspace_id, person_id, conversation_id, source_message_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), input.workspaceId, personId, resolvedConversationId, messageId, body, now));
    for (const body of input.nextActions ?? []) statements.push(this.db.prepare("INSERT INTO communication_next_actions (id, workspace_id, person_id, conversation_id, source_message_id, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)").bind(crypto.randomUUID(), input.workspaceId, personId, resolvedConversationId, messageId, body, now));
    await this.db.batch(statements);
    return { duplicate: false, messageId, personId, conversationId: resolvedConversationId };
  }

  async getReplyDraft(scope: Scope & { replyDraftId: string }) { return this.db.prepare("SELECT id, workspace_id, person_id, conversation_id, body, status, created_at, updated_at FROM reply_drafts WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ? LIMIT 1").bind(scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).first(); }
  async updateReplyDraft(scope: Scope & { replyDraftId: string; body: string; updatedAt: string }) { const draft = await this.getReplyDraft(scope); if (!draft) throw new Error("REPLY_DRAFT_SCOPE_MISMATCH"); return this.db.prepare("UPDATE reply_drafts SET body = ?, status = 'draft', updated_at = ? WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ?").bind(scope.body, scope.updatedAt, scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).run(); }
  async getLatestSafetyCheck(scope: Scope & { replyDraftId: string }) { return this.db.prepare("SELECT id, workspace_id, person_id, conversation_id, reply_draft_id, status, issues_json, checked_at FROM safety_checks WHERE reply_draft_id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ? ORDER BY checked_at DESC LIMIT 1").bind(scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).first<{ id: string; status: string }>(); }
  async createSafetyCheck(input: Scope & { safetyCheckId: string; replyDraftId: string; status: "passed" | "blocked" | "warning"; issues: string[]; checkedAt: string }) { const draft = await this.getReplyDraft(input); if (!draft) throw new Error("SAFETY_CHECK_SCOPE_MISMATCH"); const insert = this.db.prepare("INSERT INTO safety_checks (id, workspace_id, person_id, conversation_id, reply_draft_id, status, issues_json, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(input.safetyCheckId, input.workspaceId, input.personId, input.conversationId, input.replyDraftId, input.status, JSON.stringify(input.issues), input.checkedAt); const update = this.db.prepare("UPDATE reply_drafts SET status = ?, updated_at = ? WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ?").bind(input.status === "passed" ? "safety_checked" : "blocked", input.checkedAt, input.replyDraftId, input.workspaceId, input.personId, input.conversationId); return this.db.batch([insert, update]); }
  async assertSendReady(scope: Scope & { replyDraftId: string }) { const draft = await this.getReplyDraft(scope); if (!draft) throw new Error("REPLY_DRAFT_SCOPE_MISMATCH"); const safety = await this.getLatestSafetyCheck(scope); if (!safety) throw new Error("SAFETY_CHECK_REQUIRED"); if (safety.status !== "passed") throw new Error("SAFETY_CHECK_FAILED"); return { draft, safety }; }
  async getSendDecisionByIdempotencyKey(workspaceId: string, idempotencyKey: string) { return this.db.prepare("SELECT * FROM reply_send_decisions WHERE workspace_id = ? AND idempotency_key = ? LIMIT 1").bind(workspaceId, idempotencyKey).first(); }
  async listSendDecisions(scope: Scope & { replyDraftId: string }) { return (await this.db.prepare("SELECT * FROM reply_send_decisions WHERE workspace_id = ? AND person_id = ? AND conversation_id = ? AND reply_draft_id = ? ORDER BY decided_at DESC").bind(scope.workspaceId, scope.personId, scope.conversationId, scope.replyDraftId).all()).results; }
  async recordSuccessfulSend(input: Scope & { replyDraftId: string; sendDecisionId: string; messageId: string; externalMessageId: string; channel: PersistedChannel; body: string; contentHash: string; deliveryMode: "dry_run" | "live"; adapterReference: string; idempotencyKey: string; adapterDelivery: unknown; decidedAt: string }) { const existing = await this.getSendDecisionByIdempotencyKey(input.workspaceId, input.idempotencyKey); if (existing) return { duplicate: true, decision: existing }; const { safety } = await this.assertSendReady(input); const conversation = await this.getConversationScope(input.workspaceId, input.personId, input.conversationId); if (!conversation) throw new Error("CONVERSATION_SCOPE_MISMATCH"); if (conversation.channel !== input.channel) throw new Error("SEND_CHANNEL_MISMATCH"); const message = this.db.prepare("INSERT INTO messages (id, workspace_id, person_id, conversation_id, channel, external_message_id, direction, body, received_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 'outbound', ?, ?, ?)").bind(input.messageId, input.workspaceId, input.personId, input.conversationId, input.channel, input.externalMessageId, input.body, input.decidedAt, input.decidedAt); const decision = this.db.prepare("INSERT INTO reply_send_decisions (id, workspace_id, person_id, conversation_id, reply_draft_id, safety_check_id, message_id, channel, content_hash, delivery_mode, adapter_reference, idempotency_key, adapter_delivery_json, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(input.sendDecisionId, input.workspaceId, input.personId, input.conversationId, input.replyDraftId, safety.id, input.messageId, input.channel, input.contentHash, input.deliveryMode, input.adapterReference, input.idempotencyKey, JSON.stringify(input.adapterDelivery ?? {}), input.decidedAt); const draft = this.db.prepare("UPDATE reply_drafts SET status = 'sent', updated_at = ? WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ?").bind(input.decidedAt, input.replyDraftId, input.workspaceId, input.personId, input.conversationId); await this.db.batch([message, decision, draft]); return { duplicate: false, decision: await this.getSendDecisionByIdempotencyKey(input.workspaceId, input.idempotencyKey) }; }
}
