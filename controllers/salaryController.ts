import { pool } from "../db.ts";
import { type Request, type Response , type NextFunction} from "express";
import {SalaryData, type SalaryDataInput} from "../validators/salaryvalidator.ts";
import { VerifyToken } from "../utils/jwtGenerator.ts";
import { CalculateSalary } from "../utils/salaryCalculator.ts";
import dotenv from 'dotenv';

dotenv.config();


export const SalaryInsert = async (req: Request, res: Response, next:NextFunction): Promise<Response | void> => {
  const token = req.cookies.accessToken;
  if(!token){
    return next();
  }

  const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);
  if (!verified) return res.status(400).send("Unauthorizd");

  const userData = {id: verified.id, email: verified.email}


  const parsed = SalaryData.safeParse(req.body);
  if (! parsed.success) return res.status(400).json({ message: "failed to parse data from zod" });
  const requestData: SalaryDataInput = parsed.data

  try{

    const SalaryRatio = await CalculateSalary(requestData.amount);

    const sql = "INSERT INTO salary (amount, weekly, monthly, quarterly, yearly, leftover, issue_date, user_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
    const values = [requestData.amount, SalaryRatio.weekly, SalaryRatio.monthly, SalaryRatio.quarterly,
      SalaryRatio.yearly, SalaryRatio.monthly, requestData.issue_date, userData.id ]
    const { rows } = await pool.query(sql, values);
    const salaryData = {salary_info: rows[0]}
    return res.status(201).json({salaryData})
  }catch(error){
    return res.status(400).send(error)
  }
}


export const SalaryUpdate = async (req: Request, res: Response, next:NextFunction): Promise<Response | void> => {
  const token = req.cookies.accessToken;
  if(!token){
    return next();
  }

  const verified = VerifyToken(token, process.env.JWT_SECRET_ACCESS!);
  if (!verified) return res.status(400).send("Unauthorizd");

  const userData = {id: verified.id, email: verified.email}


  const parsed = SalaryData.safeParse(req.body);
  if (! parsed.success) return res.status(400).json({ message: "failed to parse data from zod" });
  const requestData: SalaryDataInput = parsed.data

  try{

    const SalaryRatio = await CalculateSalary(requestData.amount);

    const sql = "UPDATE salary SET amount=$1, weekly=$2, monthly=$3, quarterly=$4, yearly=$5, leftover=$6, issue_date=$7 WHERE user_id = $8";
    const values = [requestData.amount, SalaryRatio.weekly, SalaryRatio.monthly, SalaryRatio.quarterly,
      SalaryRatio.yearly, SalaryRatio.monthly, requestData.issue_date, userData.id ]
    const { rows } = await pool.query(sql, values);
    const salaryData = {salary_info: rows[0]}
    return res.status(201).json({salaryData})
  }catch(error){
    return res.status(400).send(error)
  }
}
