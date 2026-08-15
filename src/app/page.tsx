export default function Home() {
  return (
    <main>
      <h1>Communication Planner</h1>
      <p>1-to-1 communication management for person-scoped inboxes, reply drafts, and send safety checks.</p>
      <section className="card">
        <h2>MVP API</h2>
        <p>
          Start with <code>/health</code>, <code>/version</code>, <code>/contracts/status</code>, channel message ingestion,
          person-scoped context, reply drafts, safety checks, and the send gate.
        </p>
      </section>
    </main>
  );
}
