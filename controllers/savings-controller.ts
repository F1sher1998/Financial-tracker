import { type Request, type Response } from "express";
import { pool } from "../db.ts";
import { ValidateRefresh } from "../refresh_token.ts";
import { SignToken, VerifyToken } from "../utils/jwtGenerator.ts";
import {
  SavingData,
  type SavingDataInput,
} from "../validators/savingValidator.ts";
import { ValidateSavingPlan } from "../utils/savingCalc.ts";

export const createSaving = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const client = await pool.connect();

  const parsed = SavingData.safeParse(req.body);

  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "failed to validate data", status: "bad" });

  const safeData: SavingDataInput = parsed.data;

  const amount = safeData.amount;
  const reason = safeData.reason;
  const period = safeData.period;
  const start_date = safeData.start_date;
  const end_date = safeData.end_date;

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

    const result = await ValidateSavingPlan(amount, period, userId);

    console.log(result);

    if (result === false || !result)
      return res.status(400).json({
        message: `You dont have enough monthly money leftover to start a saving of: $${amount}`,
      });

    await client.query("BEGIN TRANSACTION");

    await client.query(
      "INSERT INTO saving (amount, reason, start_date, end_date, user_id) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [amount, reason, start_date, end_date, userId],
    );

    await client.query("COMMIT TRANSACTION");

    return res
      .status(201)
      .json({ message: "Successfully created a saving!", status: "good" });
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
