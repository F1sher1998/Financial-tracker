import type { Request, Response } from "express";
import {SignToken} from "../utils/jwtGenerator.ts";
import { hashToken } from "../utils/passwordhasher.ts";
import { UserPayload } from "../utils/CreateUserPayload.ts";
import { pool } from "../db.ts";



export const RefreshTokens = async (req: Request, res: Response): Promise<Response> => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(400).json({ message: "Refresh token wasnt provided!" });

  let userId: number;
  try{
    const sql = "SELECT user_id FROM refresh_token WHERE token_hash = $1";
    const values = [token];
    const {rows} = await pool.query(sql, values)
    userId = rows[0].user_id
    console.log(userId)
  } catch(error){
    return res.status(500).json({ message: "User wasnt found via refresh token!", error });
  }

  let data: any
  try{
    const payload = await UserPayload(userId);
    if(!payload) return res.status(400).json({ message: "Wasnt able to create user payload for refreshing tokens" });
    data = payload;
  }catch(error){
    return res.status(400).json({ message: "Issues during creating users payload for refreshing", error });
  }

  let accessToken: string;
  let refreshToken: string;
  try {
    accessToken = await SignToken({ id: data.id, email: data.email }, process.env.JWT_SECRET_ACCESS!, { expiresIn: "15m" });
    if (!accessToken) return res.status(400).json({ message: "failed to sign access token" })

    refreshToken = await SignToken({ id: data.id, email: data.email }, process.env.JWT_SECRET_REFRESH!, { expiresIn: "1d" });
    if (!refreshToken) return res.status(400).json({ message: "failed to sign refresh token" })

    refreshToken = await
      hashToken(refreshToken);

  } catch (error) {
    return res.status(400).json({ message: "Failed during token signing", errors: error })
  }

  try {
    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })

    res.cookie("refreshToken", refreshToken, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
  } catch (error) {
    return res.status(400).json({ message: "Failed during cookie signing", errors: error })
  }


  try{
    const sql = "UPDATE refresh_token SET token_hash = $1, user_id = $2, expires_at = NOW() + INTERVAL '1 day'"
    const values = [refreshToken, userId];
    await pool.query(sql, values);
  }catch(error){
    const tokenInsertError = error
    return res.status(400).json({ message: "Failed during updating refresh token", errors: tokenInsertError });
  }

  return res.status(200).json({ message: "TOKENS WERE SUCCESSFULLT RENEWED!" });
};
