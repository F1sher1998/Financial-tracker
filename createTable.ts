import { pool } from "./db.ts";

const createTable = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "",
      //5"CREATE TABLE subscription (id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id), amount INT NOT NULL, start_date DATE, end_date DATE, regularity TEXT, created_at TIMESTAMP, updated_at TIMESTAMP)",
      //4"CREATE TABLE expense (id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id), date DATE NOT NULL, amount INT NOT NULL, category TEXT NOT NULL, created_at TIMESTAMP)",
      //3"CREATE TABLE saving (id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id), reason TEXT, amount INT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, created_at TIMESTAMP)",
      //2"CREATE TABLE salary (id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id), reason TEXT, amount INT, weekly INT, monthly INT, quarterly INT, yearly INT, leftover INT, updated_at TIMESTAMP)",
      //1"CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT, password TEXT, email TEXT, token TEXT, created_at TIMESTAMP, updated_at TIMESTAMP)",
    );

    await client.query("COMMIT");
    console.log("table ensured");
  } catch (error) {
    let transactionError = error;
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw transactionError;
  } finally {
    console.log("success");
    client.release();
  }
};

async function main(): Promise<void> {
  await createTable();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
