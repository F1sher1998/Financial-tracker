import pg from "pg";

const { Pool } = pg;
export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "noblefi_db",
  password: "159753789",
  port: 5432,
  idleTimeoutMillis: 30000,
});

pool
  .connect()
  .then(() => {
    console.log(`Connected to the database successfully`);
  })
  .catch((err) => {
    console.error(`Database connection error:`, err.stack);
  });

const result = await pool.query("SELECT NOW()");
console.log(result.rows[0]);
