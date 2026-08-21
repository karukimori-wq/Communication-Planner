export type PersistenceDriver = "memory" | "postgres" | "d1";

export type PersistenceReadiness = {
  driver: PersistenceDriver;
  postgresConfigured: boolean;
  d1Configured: boolean;
  durablePersistenceRequested: boolean;
};

function normalizeDriver(value: string | undefined): PersistenceDriver | undefined {
  if (value === "memory" || value === "postgres" || value === "d1") return value;
  return undefined;
}

export function getPersistenceReadiness(env: Record<string, string | undefined> = process.env): PersistenceReadiness {
  const explicit = normalizeDriver(env.COMMUNICATION_PERSISTENCE_DRIVER ?? env.DB_DRIVER);
  const postgresConfigured = Boolean(env.DATABASE_URL ?? env.POSTGRES_URL);
  const d1Configured = env.CLOUDFLARE_D1_ENABLED === "true";
  const driver = explicit ?? (d1Configured ? "d1" : postgresConfigured ? "postgres" : "memory");
  return { driver, postgresConfigured, d1Configured, durablePersistenceRequested: driver !== "memory" };
}

export function assertPersistenceConfiguration(readiness = getPersistenceReadiness()) {
  if (readiness.driver === "postgres" && !readiness.postgresConfigured) throw new Error("POSTGRES_PERSISTENCE_NOT_CONFIGURED");
  if (readiness.driver === "d1" && !readiness.d1Configured) throw new Error("D1_PERSISTENCE_NOT_CONFIGURED");
  return readiness;
}
