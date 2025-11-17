import { pool } from "./db.ts";

const result = await pool.query("SELECT * FROM user");
console.log(result);
