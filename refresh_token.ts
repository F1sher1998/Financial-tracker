import { VerifyToken } from "./utils/jwtGenerator.ts";
import { pool } from "./db.ts";

export interface UserBreakdown {
  userId: number;
  userEmail: string;
}

const client = await pool.connect();

export const ValidateRefresh = async (token: any): Promise<UserBreakdown> => {
  if (!token) throw new Error("Token was not provided or missing");

  const verified = VerifyToken(token, process.env.JWT_SECRET_REFRESH!);

  if (!verified) throw new Error("Token failed to be verified!!");

  await client.query("BEGIN TRANSACTION");

  const userData = await client.query("SELECT * FROM users WHERE token = $1", [
    token,
  ]);

  if (!userData) throw new Error("Failed to find a user");

  const userId = userData.rows[0].id;
  const userEmail = userData.rows[0].email;

  return { userId, userEmail };
};
