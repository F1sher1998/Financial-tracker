import cors from "cors";
import express from "express";
import dotenv from "dotenv";
const app = express();

import router from "./router.ts";

dotenv.config();
app.use(express.json());
app.use("/app/v1", router);
app.use(cors());

app
  .listen(2000, () => {
    console.log(`erver is running on http://localhost:${process.env.PORT}`);
  })
  .on("error", (error) => {
    console.error(error);
  });
