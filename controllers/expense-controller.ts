import { type Request, type Response } from "express";
import { pool } from "../db.ts";
import { SignToken, VerifyToken } from "../utils/jwtGenerator.ts";
import { ValidateRefresh } from "../refresh_token.ts";

import {
  ExpenseData,
  type ExpenseDataInput,
} from "../validators/expenseValidator.ts";

export const createExpense = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const parsed = ExpenseData.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "failed to verify data", status: "bad" });
  }

  const data: ExpenseDataInput = parsed.data;

  const client = await pool.connect();

  const amount = data.amount;

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

        await client.query("UPDATE users SET token = $1 WHERE id = $2", [
          refreshToken,
          userId,
        ]);

        await client.query("COMMIT TRANSACTION");

        return res
          .status(200)
          .json({ message: "tokens were renewed!", satus: "good" });
      } catch (error) {
        const transactionError = error;
        if (error)
          try {
            await client.query("ROLLBACK TRANSACTION");
          } catch {}
        throw transactionError;
      } finally {
        client.release();
      }

    const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);

    if (!verified)
      return res
        .status(200)
        .json({ message: "failed to verify token", satus: "bad" });

    const userId = verified.id;

    await client.query("BEGIN TRANSACTION");

    const salary = await client.query(
      "SELECT * FROM salary WHERE user_id = $1",
      [userId],
    );

    const salaryAmount = salary.rows[0].monthly;

    const leftover = salaryAmount - amount;

    await client.query("UPDATE salary SET leftover = $1 WHERE user_id = $2", [
      leftover,
      userId,
    ]);

    await client.query(
      "INSERT INTO expense (category, amount, date, user_id) VALUES($1, $2, $3, $4) RETURNING *",
      [data.category, data.amount, data.date, userId],
    );

    await client.query("COMMIT TRANSACTION");

    return res
      .status(201)
      .json({ message: "Expense was created successfully!", status: "good" });
  } catch (error) {
    const transactionError = error;
    if (error)
      try {
        await client.query("ROLLBACK TRANSACTION");
      } catch {}
    throw transactionError;
  } finally {
    client.release();
  }
};
