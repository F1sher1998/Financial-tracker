import { pool } from "../db.ts";
import { type Request, type Response } from "express";

import {
  UserRegister,
  type UserRegisterInput,
  UserLogin,
  type UserLoginInput,
} from "../validators/userValidator.ts";

import { SignToken, VerifyToken } from "../utils/jwtGenerator.ts";
import { ValidateRefresh } from "../refresh_token.ts";

import { hashPassword, verifyPassword } from "../utils/passwordhasher.ts";

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

    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    const refreshToken = await SignToken(
      { id: id, email: email },
      process.env.JWT_SECRET_REFRESH!,
      { expiresIn: "1d" },
    );

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

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

export const findUserById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const id = req.params.id;

  if (!id)
    return res
      .status(400)
      .json({ message: "Failed to receive user's id", status: "bad" });

  const client_FUBD = await pool.connect();

  try {
    const token = req.cookies.accessToken;

    if (!token)
      try {
        const token = req.cookies.refreshToken;

        const valid = await ValidateRefresh(token);

        const userId = valid.userId;
        const userEmail = valid.userEmail;

        const accessToken = await SignToken(
          { id: userId, email: userEmail },
          process.env.JWT_SECRET_ACCESS!,
          { expiresIn: "15m" },
        );

        res.cookie("accessToken", accessToken, {
          maxAge: 15 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        });

        const refreshToken = await SignToken(
          { id: userId, email: userEmail },
          process.env.JWT_SECRET_REFRESH!,
          { expiresIn: "1d" },
        );

        res.cookie("refreshToken", refreshToken, {
          maxAge: 1 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        });

        await client_FUBD.query("UPDATE users SET token = $1 WHERE id = $2", [
          refreshToken,
          userId,
        ]);

        await client_FUBD.query("COMMIT TRANSACTION");

        return res
          .status(200)
          .json({ message: "tokens were renewed!", satus: "good" });
      } catch (error) {
        const transactionError = error;
        if (error)
          try {
            await client_FUBD.query("ROLLBACK TRANSACTION");
          } catch {}
        throw transactionError;
      } finally {
        client_FUBD.release();
      }

    const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);

    const userId = verified.userId;

    if (!verified)
      return res
        .status(200)
        .json({ message: "tokens were renewed!", satus: "good" });

    const user = await client_FUBD.query(
      "SELECT username, email, created_at FROM users WHERE id = $1",
      [id],
    );

    const userSalary = await client_FUBD.query(
      "SELECT monthly FROM salary WHERE user_id = $1",
      [id],
    );

    const userExpenses = await client_FUBD.query(
      "SELECT * FROM expense WHERE user_id = $1",
      [id],
    );

    console.log(user.rows[0].email);

    const expenses = userExpenses.rows;

    const salary = userSalary.rows[0].monthly;

    const username = user.rows[0].username;
    const email = user.rows[0].email;
    const created_at = user.rows[0].created_at;

    if (!user)
      return res
        .status(400)
        .json({ message: `Couldn't find user wiht id ${userId}` });

    return res
      .status(200)
      .json({
        username: username,
        email: email,
        created_at: created_at,
        salary: salary,
        expenses: expenses,
      });
  } catch (error) {
    const transactionError = error;
    throw transactionError;
  } finally {
    client_FUBD.release();
  }
};
