import z, { email } from "zod";

export const UserRegister = z.object({
  username: z.string(),
  password: z.string(),
  email: email(),
});
