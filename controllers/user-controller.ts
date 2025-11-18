import { pool } from "../db.ts";
import type { Request, Response } from "express";
import {
  UserRegister,
  type UserRegisterInput,
} from "../validators/userValidator.ts";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const client = await pool.connect();
  const parsed = UserRegister.safeParse(req.body);

  if (!parsed.success) {
    // Why: safe narrowing makes `parsed.data` non-optional below.
    return res
      .status(400)
      .json({ message: "bad request", errors: parsed.error.flatten() });
  }

  const data: UserRegisterInput = parsed.data;

  try {
    console.log("Reached transaction");
    await client.query("BEGIN TRANSACTION");

    const userData = await client.query(
      "INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING id, email",
      [data.username, data.email, data.password],
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
