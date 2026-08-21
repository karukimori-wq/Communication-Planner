export type D1RunResult = { success: boolean; meta?: unknown };
export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1RunResult>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
};
export type D1DatabaseLike = { prepare(query: string): D1PreparedStatement; batch(statements: D1PreparedStatement[]): Promise<D1RunResult[]> };

export class D1CommunicationRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async healthcheck() {
    const row = await this.db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    return row?.ok === 1;
  }

  async getPersonScope(workspaceId: string, personId: string) {
    return this.db.prepare("SELECT id, workspace_id, display_name, profile_summary, created_at, updated_at FROM communication_persons WHERE workspace_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId).first();
  }

  async getConversationScope(workspaceId: string, personId: string, conversationId: string) {
    return this.db.prepare("SELECT id, workspace_id, person_id, channel_identity_id, channel, external_thread_id, status, last_message_at, created_at, updated_at FROM conversations WHERE workspace_id = ? AND person_id = ? AND id = ? LIMIT 1").bind(workspaceId, personId, conversationId).first();
  }

  async getPersonContext(workspaceId: string, personId: string) {
    return this.db.prepare("SELECT id, workspace_id, person_id, summary, promises_json, next_actions_json, updated_at FROM conversation_contexts WHERE workspace_id = ? AND person_id = ? LIMIT 1").bind(workspaceId, personId).first();
  }
}
