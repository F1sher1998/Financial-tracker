import { type Request, type Response } from "express";
import { pool } from "../db.ts";
import { calcsalaryAsync, type SalaryBreakdown } from "salarycalk.ts";
import { SignToken, VerifyToken } from "../jwtGenerator.ts";
import {
  UserSalary,
  type UserSalaryInput,
} from "../validators/userValidator.ts";

export const addSalary = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const parsed = UserSalary.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "failed to validate", status: "bad" });
  }

  const data: UserSalaryInput = parsed.data;

  const client = await pool.connect();

  try {
    const token = req.cookies.accessToken;
    if (!token)
      return res.status(400).json({
        message: "did not find the token form cookies",
        status: "bad",
      });

    const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);

    const userEmail = verified.email;
    const userId = verified.id;

    if (!verified)
      return res
        .status(400)
        .json({ message: "did not verify the token", status: "bad" });

    await client.query("BEGIN TRANSACTION");

    const user = await client.query(
      "SELECT * FROM users WHERE id = $1 AND email = $2",
      [userId, userEmail],
    );

    const userId_db = user.rows[0].id;

    const breakdown: SalaryBreakdown = await calcsalaryAsync(data.amount);

    const yearly = breakdown.year;
    const quarterly = breakdown.quarter;
    const monthly = breakdown.month;
    const weekly = breakdown.week;

    await client.query(
      "UPDATE salary SET amount = $1, yearly = $2, quarterly = $3, monthly = $4, weekly = %5 WHERE id = $6",
      [data.amount, yearly, quarterly, monthly, weekly, userId_db],
    );

    await client.query("COMMIT TRANSACTION");

    return res
      .status(201)
      .json({ messae: "Salary was successfully created", status: "good" });
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
