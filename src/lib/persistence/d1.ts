export type D1RunResult = { success: boolean; meta?: unknown };
export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1RunResult>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
};
export type D1DatabaseLike = { prepare(query: string): D1PreparedStatement; batch(statements: D1PreparedStatement[]): Promise<D1RunResult[]> };

type Scope = { workspaceId: string; personId: string; conversationId: string };

export class D1CommunicationRepository {
  constructor(private readonly db: D1DatabaseLike) {}
  async healthcheck() { const row = await this.db.prepare("SELECT 1 AS ok").first<{ ok: number }>(); return row?.ok === 1; }
  async getPersonScope(workspaceId: string, personId: string) { return this.db.prepare("SELECT id, workspace_id, display_name, profile_summary, created_at, updated_at FROM communication_persons WHERE workspace_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId).first(); }
  async getConversationScope(workspaceId: string, personId: string, conversationId: string) { return this.db.prepare("SELECT id, workspace_id, person_id, channel_identity_id, channel, external_thread_id, status, last_message_at, created_at, updated_at FROM conversations WHERE workspace_id = ? AND person_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId, conversationId).first(); }
  async getPersonContext(workspaceId: string, personId: string) { return this.db.prepare("SELECT id, workspace_id, person_id, summary, promises_json, next_actions_json, updated_at FROM conversation_contexts WHERE workspace_id = ? AND person_id = ? LIMIT 1").bind(workspaceId, personId).first(); }

  async getReplyDraft(scope: Scope & { replyDraftId: string }) {
    return this.db.prepare("SELECT id, workspace_id, person_id, conversation_id, body, status, created_at, updated_at FROM reply_drafts WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ? LIMIT 1").bind(scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).first();
  }

  async updateReplyDraft(scope: Scope & { replyDraftId: string; body: string; updatedAt: string }) {
    const draft = await this.getReplyDraft(scope);
    if (!draft) throw new Error("REPLY_DRAFT_SCOPE_MISMATCH");
    return this.db.prepare("UPDATE reply_drafts SET body = ?, status = 'draft', updated_at = ? WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ?").bind(scope.body, scope.updatedAt, scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).run();
  }

  async getLatestSafetyCheck(scope: Scope & { replyDraftId: string }) {
    return this.db.prepare("SELECT id, workspace_id, person_id, conversation_id, reply_draft_id, status, issues_json, checked_at FROM safety_checks WHERE reply_draft_id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ? ORDER BY checked_at DESC LIMIT 1").bind(scope.replyDraftId, scope.workspaceId, scope.personId, scope.conversationId).first();
  }

  async createSafetyCheck(input: Scope & { safetyCheckId: string; replyDraftId: string; status: "passed" | "blocked" | "warning"; issues: string[]; checkedAt: string }) {
    const draft = await this.getReplyDraft(input);
    if (!draft) throw new Error("SAFETY_CHECK_SCOPE_MISMATCH");
    const insert = this.db.prepare("INSERT INTO safety_checks (id, workspace_id, person_id, conversation_id, reply_draft_id, status, issues_json, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(input.safetyCheckId, input.workspaceId, input.personId, input.conversationId, input.replyDraftId, input.status, JSON.stringify(input.issues), input.checkedAt);
    const update = this.db.prepare("UPDATE reply_drafts SET status = ?, updated_at = ? WHERE id = ? AND workspace_id = ? AND person_id = ? AND conversation_id = ?").bind(input.status === "passed" ? "safety_checked" : "blocked", input.checkedAt, input.replyDraftId, input.workspaceId, input.personId, input.conversationId);
    return this.db.batch([insert, update]);
  }

  async assertSendReady(scope: Scope & { replyDraftId: string }) {
    const draft = await this.getReplyDraft(scope);
    if (!draft) throw new Error("REPLY_DRAFT_SCOPE_MISMATCH");
    const safety = await this.getLatestSafetyCheck(scope);
    if (!safety) throw new Error("SAFETY_CHECK_REQUIRED");
    if (safety.status !== "passed") throw new Error("SAFETY_CHECK_FAILED");
    return { draft, safety };
  }
}
