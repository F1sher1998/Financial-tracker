import { pool } from "../db.ts";

export const ValidateSavingPlan = async (
  amount: number,
  period: number,
  userId: number,
): Promise<boolean> => {
  const client = await pool.connect();

  if (amount < 0) {
    console.log(false);
  }

  await client.query("BEGIN TRANSACTION");

  const result = await client.query(
    "SELECT leftover FROM salary WHERE user_id = $1",
    [userId],
  );

  const result_2 = await client.query(
    "SELECT SUM(amount) AS total FROM saving WHERE user_id = $1",
    [userId],
  );

  const leftover = result.rows[0].leftover;

  const total_savings = result_2.rows[0].total;

  const validPercent = leftover * 0.4;

  if (validPercent * period < amount) {
    await client.query("COMMIT TRANSACTION");
    client.release();
    return false;
  }

  if (total_savings > validPercent * 12) {
    await client.query("COMMIT TRANSACTION");
    client.release();
    return false;
  }

  await client.query("COMMIT TRANSACTION");
  client.release();
  return true;
};

ValidateSavingPlan(1230, 4, 10);
