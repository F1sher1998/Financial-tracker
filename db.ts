import pg from "pg";

const { Pool } = pg;
export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "noblefi_db",
  password: "159753789",
  port: 5432,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true,
});

export async function healthcheck(): Promise<void> {
  const r = await pool.query("SELECT NOW()");
  console.log("DB time:", r.rows[0].now);
  await pool.end();
}
