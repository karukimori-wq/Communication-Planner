import { CommunicationDashboard } from "./dashboard-client";
import { dashboardSnapshot } from "@/lib/dashboard";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Communication Planner</p>
          <h1>1-to-1 inbox with reply safety gates</h1>
          <p className="lede">
            Person-scoped conversations, context, draft review, and send confirmation for LINE, X, and Instagram adapters.
          </p>
        </div>
        <div className="workspace-status" aria-label="workspace readiness">
          <span>Workspace</span>
          <strong>{dashboardSnapshot.workspaceId}</strong>
          <small>{dashboardSnapshot.contractStatus}</small>
        </div>
      </header>

      <CommunicationDashboard snapshot={dashboardSnapshot} />
    </main>
  );
}
