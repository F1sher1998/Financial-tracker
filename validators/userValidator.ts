import z from "zod";

export const UserRegister = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
});

export type UserRegisterInput = z.infer<typeof UserRegister>;

export const UserLogin = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type UserLoginInput = z.infer<typeof UserLogin>;
