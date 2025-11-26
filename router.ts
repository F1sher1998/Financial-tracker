// technical imports
import { Router } from "express";
import { RegisterUser, LoginUser, FindUserById, FindUserItems } from "./controllers/userController.ts";
import { SalaryInsert, SalaryUpdate } from './controllers/salaryController.ts';
import { ExpenseCreate } from './controllers/expenseController.ts'
import { RefreshTokens } from "./services/RefreshToken.ts";
// custom imports


const router = Router();

//// User routes
router.route("/user/register").post(RegisterUser);
router.route("/user/login").post(LoginUser);
router.route("/user/find/:id").get(FindUserById, RefreshTokens)
router.route("/user/find/items/:name").get(FindUserItems, RefreshTokens)
//// Salary routes
router.route("/salary/insert").post(SalaryInsert, RefreshTokens)
router.route("/salary/update").post(SalaryUpdate, RefreshTokens)
//// Expense routes
router.route("/expense/create").post(ExpenseCreate, RefreshTokens)

export default router;
