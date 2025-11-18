// technical imports
import { Router } from "express";

// custom imports
import { registerUser, loginUser } from "./controllers/user-controller.ts";

const router = Router();

router.route("/user/register").post(registerUser);
router.route("/user/login").post(loginUser);

export default router;
