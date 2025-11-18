// technical imports
import { Router } from "express";

// custom imports
import { registerUser } from "./controllers/user-controller.ts";

const router = Router();

router.route("/user/register").post(registerUser);

export default router;
