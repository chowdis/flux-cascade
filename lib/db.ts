import { Pool, types } from "pg";

// node-postgres returns NUMERIC/DECIMAL columns as strings (to avoid
// silent float-precision surprises) and BIGINT as strings (can exceed
// Number's safe range). TeslaMate uses numeric for most measurements
// (range, temperature, energy, cost) and nothing here needs bigint
// precision, so parse both as JS numbers globally instead of
// converting ad-hoc in every query.
types.setTypeParser(1700, (val) => parseFloat(val)); // numeric/decimal
types.setTypeParser(20, (val) => parseInt(val, 10)); // bigint

declare global {
  var __teslamatePool: Pool | undefined;
}

function createPool() {
  return new Pool({
    host: process.env.TESLAMATE_DB_HOST,
    port: Number(process.env.TESLAMATE_DB_PORT ?? 5432),
    database: process.env.TESLAMATE_DB_NAME ?? "teslamate",
    user: process.env.TESLAMATE_DB_USER,
    password: process.env.TESLAMATE_DB_PASSWORD,
    ssl:
      process.env.TESLAMATE_DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 15_000,
  });
}

// Reuse the pool across hot reloads in dev instead of opening new connections.
export const pool = global.__teslamatePool ?? createPool();

// Without this, an error on an idle connection (DB restart, network blip)
// is an unhandled 'error' event on the Pool and crashes the whole process
// instead of just failing the in-flight query.
pool.on("error", (err) => {
  console.error("Unexpected error on idle TeslaMate DB connection", err);
});

if (process.env.NODE_ENV !== "production") {
  global.__teslamatePool = pool;
}
