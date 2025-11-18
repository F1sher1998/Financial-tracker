import { pool } from "../db.ts";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import {
  UserRegister,
  type UserRegisterInput,
  UserLogin,
  type UserLoginInput,
} from "../validators/userValidator.ts";
import { SignToken } from "../jwtGenerator.ts";

import { hashPassword, verifyPassword } from "../passwordhasher.ts";

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

// USER LOGIN ROUTE
export const loginUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const client = await pool.connect();

  const parsed = UserLogin.safeParse(req.body);

  // IF PARSED DATA IS NOT VALID THROW AN ERROR
  if (!parsed.success) {
    // Why: safe narrowing makes `parsed.data` non-optional below.
    return res
      .status(400)
      .json({ message: "bad request", errors: parsed.error.flatten() });
  }

  const data: UserLoginInput = parsed.data;

  const password = data.password;
  const email = data.email;

  try {
    const userData = await client.query(
      "SELECT id, password FROM users WHERE email = $1 ",
      [email],
    );

    if (!userData)
      return res
        .status(400)
        .json({ message: "Failed to find a user", status: "bad" });

    const userPassword = userData.rows[0].password;

    const verified = await verifyPassword(password, userPassword);
    if (!verified)
      return res
        .status(400)
        .json({ message: "Failed to verify the password", status: "bad" });

    const id = userData.rows[0].id;

    const accessToken = await SignToken(
      { id: id, email: email },
      process.env.JWT_SECRET_ACCESS!,
      { expiresIn: "15m" },
    );
    const refreshToken = await SignToken(
      { id: id, email: email },
      process.env.JWT_SECRET_REFRESH!,
      { expiresIn: "1d" },
    );
    console.log(refreshToken);

    await client.query("BEGIN TRANSACTION");

    await client.query("UPDATE users SET token = $1 WHERE id = $2", [
      refreshToken,
      id,
    ]);

    await client.query("COMMIT TRANSACTION");

    return res
      .status(200)
      .json({ message: "Successfull logged in a user", status: "good" });
  } catch (error) {
    const transactionError = error;
    try {
      await client.query("ROLLBACK TRANSACTION");
    } catch {}
    throw transactionError;
  } finally {
    client.release();
  }
};
