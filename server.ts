import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
const app = express();

import router from "./router.ts";

dotenv.config();
app.use(cookieParser());
app.use(express.json());
app.use("/app/v1", router);
app.use(cors());

app
  .listen(2000, () => {
    console.log(`server is running on http://localhost:${process.env.PORT}`);
  })
  .on("error", (error) => {
    console.error(error);
  });
