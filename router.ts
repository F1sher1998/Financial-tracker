// technical imports
import { Router } from "express";

// custom imports
import {
  registerUser,
  loginUser,
  findUserById,
} from "./controllers/user-controller.ts";
import { addSalary } from "./controllers/salary-controller.ts";
import { createExpense } from "./controllers/expense-controller.ts";
import { createSaving } from "./controllers/savings-controller.ts";

const router = Router();

router.route("/user/register").post(registerUser);
router.route("/user/login").post(loginUser);
router.route("/user/salary/insert").post(addSalary);
router.route("/user/expense/create").post(createExpense);
router.route("/user/saving/create").post(createSaving);
router.route("/user/find/:id").get(findUserById);

export default router;
