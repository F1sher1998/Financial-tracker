import { pool } from "../db.ts";
import { Request, Response } from "express";
import { UserRegister } from "../validators/userValidator.ts";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const client = await pool.connect();
  const safeData = UserRegister.parse(req.body);
  if (!safeData) {
    return res.status(400).json({ message: "fail", status: "bad" });
  }

  try {
    await client.query("BEGIN TRANSACTION");

    const userData = await client.query(
      "INSERT INTO user (username, email, password) VALUES($1, $2, $3) RETURNING id, email",
      [safeData.username, safeData.email, safeData.password],
    );

    await client.query("COMMIT TRANSACTION");

    const transactionResult = [userData.rows[0].id, userData.rows[0].email];

    return res
      .status(201)
      .json({ message: "success", status: "good", data: transactionResult });
  } catch (error) {
    const transactionError = error;
    try {
      await pool.query("ROLLBACK TRANSACTION");
    } catch {}
    throw transactionError;
  } finally {
    client.release();
  }
};
