import { pool } from "../db.ts";
import type { Request, Response } from "express";
import {
  UserRegister,
  type UserRegisterInput,
} from "../validators/userValidator.ts";

import { hashPassword } from "../passwordhasher.ts";

// USER REGISTER ROUTE
export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  // MAKE CONNECTION TO THE DB
  const client = await pool.connect();

  // PARSE USER DATA THOUGH ZOD
  const parsed = UserRegister.safeParse(req.body);

  // IF PARSED DATA IS NOT VALID THROW AN ERROR
  if (!parsed.success) {
    // Why: safe narrowing makes `parsed.data` non-optional below.
    return res
      .status(400)
      .json({ message: "bad request", errors: parsed.error.flatten() });
  }

  // IF DATA IS VALID ASSIGN IT TO A VARIABLE
  const data: UserRegisterInput = parsed.data;

  // TRANSACTION BLOCK
  try {
    console.log("Reached transaction");

    // PASSWORD HASH
    const hashed = await hashPassword(data.password);

    // INITIATE PG TRANSACTION
    await client.query("BEGIN TRANSACTION");

    // INSERT USER INTO DB
    const userData = await client.query(
      "INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING id, email",
      [data.username, data.email, hashed],
    );

    // COMMIT CHANGES TO DB
    await client.query("COMMIT TRANSACTION");

    // EXTRACT AND ASSIGN USER DATA TO A VARIABLE
    const transactionResult = [userData.rows[0].id, userData.rows[0].email];

    // IF THE WHOLE TRANSACTION IS A SUCCESS RETURN A POSITIVE RESPONSE
    return res
      .status(201)
      .json({ message: "success", status: "good", data: transactionResult });

    // IF CATCHED AN ERROR DURING TRANSACTION
  } catch (error) {
    const transactionError = error;
    try {
      await pool.query("ROLLBACK TRANSACTION");
    } catch {}
    throw transactionError;

    // IF NOT ERROR HAS OCCURED AND TRANSACTION IS A SUCCESS RELEASE THE CLIENT
  } finally {
    client.release();
  }
};

export const functionName = async (): Promise<void> => {};
