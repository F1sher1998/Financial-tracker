import { pool } from "../db.ts";
import { type Request, type Response , type NextFunction} from "express";
import {ExpenseData, type ExpenseDataInput} from "../validators/expenseValidator.ts";
import { VerifyToken } from "../utils/jwtGenerator.ts";


export const ExpenseCreate = async (req: Request, res: Response, next:NextFunction): Promise<Response | void> => {
  const token = req.cookies.accessToken;
  if(!token){
    return next();
  }

  const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);
  if (!verified) return res.status(400).send("Unauthorizd");

  const userData = {id: verified.id, email: verified.email}


  const parsed = ExpenseData.safeParse(req.body);
  if (! parsed.success) return res.status(400).json({ message: "failed to parse data from zod" });
  const requestData: ExpenseDataInput = parsed.data


  try{
    const sql = "SELECT leftover FROM salary WHERE user_id = $1";
    const values = [userData.id];
    const { rows } = await pool.query(sql, values);
    const leftover = rows[0].leftover;

    console.log(leftover)

    if(leftover < requestData.amount) return res.status(400).send(`You dont have enough leftover money to spend! You have only left:$${leftover}`)
  }catch(error){
    return res.status(500).send(error);
  }

  try{
    const sql = "INSERT INTO expense (user_id, amount, date, category) VALUES($1, $2, $3, $4) RETURNING *";
    const values = [userData.id, requestData.amount, requestData.date, requestData.category]
    const firstQ = await pool.query(sql, values);
    const expenseData = firstQ.rows[0];

    const sql_2 = "UPDATE salary SET leftover = leftover - $1 WHERE user_id = $2 RETURNING leftover";
    const values_2 = [requestData.amount, userData.id];
    const secondQ = await pool.query(sql_2, values_2)
    const leftoverData = secondQ.rows[0];

    return res.status(201).json({data: expenseData, money_toSpend: leftoverData})
  }catch(error){
    return res.status(500).send(error);
  }
}
