import { pool } from "../db.ts";
import { type Request, type Response } from "express";
import {UserRegister, type UserRegisterInput, UserLogin, type UserLoginInput} from "../validators/userValidator.ts";
import { SignToken, VerifyToken } from "../utils/jwtGenerator.ts";
import { ValidateRefresh } from "../refresh_token.ts";
import { hashPassword, verifyPassword } from "../utils/passwordhasher.ts";


export const RegisterUser = async (req: Request, res: Response): Promise<Response> => {

  const validRequest = UserRegister.safeParse(req.body);
  if (!validRequest.success) return res.status(400).json({ message: "Invalid request information", errors: validRequest.error.flatten() });
  const requestData: UserRegisterInput = validRequest.data;

  const username = requestData.username;
  const email = requestData.email;
  const password = requestData.password;


  let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch {
      return res.status(500).json({ message: "Failed to process credentials during password hash" });
    }

  try{
    await pool.query("BEGIN");

    const sql = "INSERT INTO users (username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email, created_at";
    const values = [username, email, passwordHash];
    const { rows } = await pool.query(sql, values);
    const created = rows[0];


    return res.status(201).json({message: "User was created!", user: [created.id, created.username, created.email, created.created_at]})
  }catch(error){
    const userRegisterError = error;
    if (error) try { await pool.query("ROLLBACK") } catch{}
    throw userRegisterError;
  }

}
