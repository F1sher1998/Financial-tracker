import cors from "cors";
import express from "express";
import dotenv from "dotenv";
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

app
  .listen(8000, () => {
    console.log(`erver is running on http://localhost:${process.env.PORT}`);
  })
  .on("error", (error) => {
    console.error(error);
  });
