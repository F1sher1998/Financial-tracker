import { pool } from "../db.ts"

export interface UserPayload{
  username: string,
  email: string,
  id: number,
}

export const UserPayload = async (userId: number): Promise<UserPayload> => {

  const payload = await pool.query("SELECT username, email, id FROM users WHERE id = $1", [userId]);
  console.log(payload)
  if (!payload) throw new Error("Was not able to find user via id during paylaod creation proccess for refresh procedure");

  const username = payload.rows[0].username;
  const email = payload.rows[0].email;
  const id = payload.rows[0].id;

  console.log(username, email, id)
  return {username, email, id}
}
