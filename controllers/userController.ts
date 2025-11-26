import { pool } from "../db.ts";
import { type Request, type Response , type NextFunction} from "express";
import {UserRegister, type UserRegisterInput, UserLogin, type UserLoginInput} from "../validators/userValidator.ts";
import { SignToken, VerifyToken } from "../utils/jwtGenerator.ts";
import { hashPassword, verifyPassword, hashToken } from "../utils/passwordhasher.ts";
import dotenv from 'dotenv';

dotenv.config();


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

    await pool.query("COMMIT")

    return res.status(201).json({message: "User was created!", user: [created.id, created.username, created.email, created.created_at]})
  }catch(error){
    const userRegisterError = error;
    if (error) try { await pool.query("ROLLBACK") } catch{}
    throw userRegisterError;
  }
}


export const LoginUser = async (req: Request, res: Response): Promise<Response> => {
  const validRequest = UserLogin.safeParse(req.body);
  if (!validRequest.success) return res.status(400).json({ message: "Invalid request information", errors: validRequest.error.flatten() });
  const requestData: UserLoginInput = validRequest.data;

  const email = requestData.email;
  const password = requestData.password;
  console.log(password)

  let hashedPassword: string
  try {
    const sql = "SELECT password_hash FROM users WHERE email = $1";
    const values = [email];
    const verified = await pool.query(sql, values);
    hashedPassword = verified.rows[0].password_hash
  } catch (error) {
    return res.status(400).json({ message: "Failed to process credentials during password verification" })
  }
  console.log(hashedPassword)

  let verified: boolean
  try {
    verified = await verifyPassword(password, hashedPassword)
    if (!verified) return res.status(400).json({ message: "Failed to verify password" })
  } catch (error) {
    return res.status(400).json({ message: "Fail during verification of password"});
  }

  let userId: number;
  let userEmail: string;
  try {
    const sql = "SELECT id, email FROM users WHERE email = $1";
    const values = [email];
    const { rows } = await pool.query(sql, values);
    if (!rows) return res.status(400).json({ message: "failed to retrieve rows from DB" });
    userId = rows[0].id;
    userEmail = rows[0].email;
  } catch (error) {
    return res.status(400).json({ message: "Failed during extraction of users data from DB", errors: error })
  }


  let accessToken: string;
  let refreshToken: string;
  try {
    accessToken = await SignToken({ id: userId, email: userEmail }, process.env.JWT_SECRET_ACCESS!, { expiresIn: "15m" });
    if (!accessToken) return res.status(400).json({ message: "failed to sign access token" })

    refreshToken = await SignToken({ id: userId, email: userEmail }, process.env.JWT_SECRET_REFRESH!, { expiresIn: "1d" });
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
    const sql = "INSERT INTO refresh_token (token_hash, user_id, expires_at) VALUES($1, $2, NOW() + INTERVAL '30 days')"
    const values = [refreshToken, userId];
    await pool.query(sql, values);
  }catch(error){
    const tokenInsertError = error
    return res.status(400).json({ message: "Failed during inserting refresh token", errors: tokenInsertError });
  }

  return res.status(200).json({ message: "User has logged in successfully" });
};


export const FindUserById = async (req: Request, res: Response, next:NextFunction): Promise<Response | void> => {

  const token = req.cookies.accessToken;
  if (!token) {
    return next()
  }

  const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);
  if (!verified) return res.status(400).json({ message: "Failed to verify access token" });

  const { id } = req.params;

  try{
    const sql = "SELECT * FROM users WHERE id = $1";
    const values = [id];
    const { rows } = await pool.query(sql, values);
    if(rows.length < 0 || rows.length == 0 || !rows) return res.status(400).json({messagge: "failed to find user by id"})
    const user = rows[0];

    return res.status(200).json({message: `Info about a user with id: ${id}`, INFORMATION: user})
  }catch(error){
    return res.status(400).json({error: error})
  }
}


export const FindUserItems = async (req: Request, res: Response, next:NextFunction): Promise<Response | void> => {
  const token = req.cookies.accessToken;
  if(!token){
    return next();
  }

  const payloadData = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);

  const userData = { id: payloadData.id, email: payloadData.email };

  const {name} = req.params
  if (!name) return res.status(400).json({ message: "user didnt choose what to check!" });

  if (name === "salary") {
    try {
      const sql = "SELECT * FROM salary WHERE user_id = $1";
      const values = [userData.id];
      const { rows } = await pool.query(sql, values);
      const data = rows[0];

      return res.status(200).json({ Salary_Data: data });
    } catch (error) {
      res.status(500).send("Error during printing salary data");
    }
  } else if (name === "expense") {
    try {
      const sql = "SELECT * FROM expense WHERE user_id = $1";
      const values = [userData.id];
      const { rows } = await pool.query(sql, values);
      if(!rows || rows.length < 0) return res.status(400).send([])
      const data = rows[0];

      return res.status(200).json({ Salary_Data: data });
    } catch (error) {
      res.status(500).send("Error during printing salary data");
    }
  }
}
